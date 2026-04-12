/**
 * POST /api/analyze-skin
 * Security layer: rate limiting (10 req / 60s per IP), server-side image validation,
 * CORS headers. PerfectCorp 4-step flow: upload → create task → poll → normalize.
 * Falls back to mock when PERFECTCORP_API_KEY is not set.
 */
import { NextRequest, NextResponse } from "next/server";
import { normalizePerfectCorpResponse } from "@/services/analysisNormalizer";
import { getMockAnalysis } from "@/services/mockAnalysisAdapter";
import { featureFlags } from "@/config/featureFlags";
import type { PerfectCorpAnalysisRaw } from "@/types/PerfectCorpRaw";
import type { AnalysisResult } from "@/types/AnalysisResult";

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITING — in-memory per IP (10 requests per 60 seconds)
// ─────────────────────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const ipWindowMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = ipWindowMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipWindowMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true };
}

// Prune stale entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipWindowMap.entries()) {
    if (now > entry.resetAt) ipWindowMap.delete(ip);
  }
}, 5 * 60_000);

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const VALID_BASE64_RE = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

function validateBase64Image(value: unknown): string | null {
  if (typeof value !== "string") return "Image must be a string";
  if (value.length > MAX_IMAGE_BYTES * 1.37) return "Image exceeds 10 MB limit"; // base64 is ~37% larger
  if (!VALID_BASE64_RE.test(value.split(",")[0] + ",")) {
    // Flexible: allow raw base64 without data URI prefix
    if (value.length < 100) return "Image string too short — expected base64 encoded image";
  }
  return null; // valid
}

// ─────────────────────────────────────────────────────────────────────────────
// CORS HEADERS
// ─────────────────────────────────────────────────────────────────────────────
function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFECTCORP INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────
const PERFECTCORP_BASE = process.env.PERFECTCORP_BASE_URL ?? "https://api.perfectcorp.com";

const DST_ACTIONS = [
  "skin_type", "oiliness", "moisture", "acne", "radiance", "texture",
] as const;

function getAuthHeaders(): HeadersInit {
  const key = process.env.PERFECTCORP_API_KEY;
  if (!key) throw new Error("PERFECTCORP_API_KEY is not set");
  return { "x-api-key": key, "Content-Type": "application/json" };
}

async function uploadSkinFile(base64Image: string): Promise<string> {
  const res = await fetch(`${PERFECTCORP_BASE}/s2s/v2.0/file/skin-analysis`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ file: base64Image }),
  });
  if (!res.ok) throw new Error(`PerfectCorp file upload failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { file_id?: string };
  if (!data.file_id) throw new Error("PerfectCorp response missing file_id");
  return data.file_id;
}

async function createSkinTask(fileId: string): Promise<string> {
  const res = await fetch(`${PERFECTCORP_BASE}/s2s/v2.0/task/skin-analysis`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ src_file_id: fileId, dst_actions: [...DST_ACTIONS] }),
  });
  if (!res.ok) throw new Error(`PerfectCorp task create failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { task_id?: string };
  if (!data.task_id) throw new Error("PerfectCorp response missing task_id");
  return data.task_id;
}

const POLL_DELAY_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

interface SkinTaskResult {
  skin_type?: string;
  oiliness?: string | number;
  moisture?: string | number;
  acne?: string | number;
  radiance?: string | number;
  texture?: string | number;
  confidence?: number;
}

async function pollSkinTask(taskId: string): Promise<SkinTaskResult> {
  const start = Date.now();
  for (; ;) {
    const res = await fetch(`${PERFECTCORP_BASE}/s2s/v2.0/task/skin-analysis/${taskId}`, {
      method: "GET", headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`PerfectCorp poll failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { status?: string; result?: SkinTaskResult };
    if (data.status === "success" && data.result) return data.result;
    if (data.status === "failed" || data.status === "error")
      throw new Error(`PerfectCorp task failed: ${data.status}`);
    if (Date.now() - start >= POLL_TIMEOUT_MS)
      throw new Error("PerfectCorp skin analysis timed out");
    await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
  }
}

function toAnalysisResult(result: SkinTaskResult): AnalysisResult {
  const concerns: string[] = [];
  if (result.oiliness && String(result.oiliness).toLowerCase() !== "normal") concerns.push("oiliness");
  if (result.acne && Number(result.acne) > 0) concerns.push("acne");
  if (result.radiance !== undefined && Number(result.radiance) < 0.5) concerns.push("dullness");
  if (result.texture && Number(result.texture) > 0.5) concerns.push("fine_lines");

  const raw: PerfectCorpAnalysisRaw = {
    face: { skinType: result.skin_type, concerns, confidence: result.confidence ?? 0.8 },
    hair: null,
  };
  return normalizePerfectCorpResponse(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const headers = corsHeaders();

  // Rate limit by forwarded IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((retryAfterMs ?? 60000) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const image = body?.image ?? body?.file;

    // Server-side image validation
    const validationError = validateBase64Image(image);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400, headers });
    }

    const apiKey = process.env.PERFECTCORP_API_KEY;
    const shouldMock = !apiKey || featureFlags.USE_MOCK_ANALYSIS;

    if (shouldMock) {
      const mockRaw = getMockAnalysis({ faceImage: image });
      const mockResult: AnalysisResult = normalizePerfectCorpResponse(mockRaw);
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json(mockResult, { headers });
    }

    const fileId = await uploadSkinFile(image);
    const taskId = await createSkinTask(fileId);
    const result = await pollSkinTask(taskId);
    const analysis: AnalysisResult = toAnalysisResult(result);
    return NextResponse.json(analysis, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    const isAuth = message.includes("PERFECTCORP_API_KEY");
    return NextResponse.json({ error: message }, { status: isAuth ? 500 : 502, headers });
  }
}