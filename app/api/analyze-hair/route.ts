/**
 * POST /api/analyze-hair
 * Security: rate limiting (10 req / 60s per IP), server-side image validation, CORS.
 * PerfectCorp 4-step flow: upload 3 files → create task → poll → normalize.
 */
import { NextRequest, NextResponse } from "next/server";
import { normalizePerfectCorpResponse } from "@/services/analysisNormalizer";
import { getMockAnalysis } from "@/services/mockAnalysisAdapter";
import { featureFlags } from "@/config/featureFlags";
import type { PerfectCorpAnalysisRaw } from "@/types/PerfectCorpRaw";
import type { AnalysisResult } from "@/types/AnalysisResult";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SECURITY HELPERS (mirrors analyze-skin/route.ts)
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
  if (entry.count >= RATE_LIMIT_MAX) return { allowed: false, retryAfterMs: entry.resetAt - now };
  entry.count += 1;
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipWindowMap.entries()) {
    if (now > entry.resetAt) ipWindowMap.delete(ip);
  }
}, 5 * 60_000);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function validateBase64Image(value: unknown): string | null {
  if (typeof value !== "string") return "Image must be a string";
  if (value.length > MAX_IMAGE_BYTES * 1.37) return "Image exceeds 10 MB limit";
  if (value.length < 100) return "Image string too short — expected base64 encoded image";
  return null;
}

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

function getAuthHeaders(): HeadersInit {
  const key = process.env.PERFECTCORP_API_KEY;
  if (!key) throw new Error("PERFECTCORP_API_KEY is not set");
  return { "x-api-key": key, "Content-Type": "application/json" };
}

async function uploadHairFile(base64Image: string): Promise<string> {
  const res = await fetch(`${PERFECTCORP_BASE}/s2s/v2.0/file/hair-type-detection`, {
    method: "POST", headers: getAuthHeaders(),
    body: JSON.stringify({ file: base64Image }),
  });
  if (!res.ok) throw new Error(`PerfectCorp hair upload failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { file_id?: string };
  if (!data.file_id) throw new Error("PerfectCorp response missing file_id");
  return data.file_id;
}

async function createHairTask(srcFileIds: [string, string, string]): Promise<string> {
  const res = await fetch(`${PERFECTCORP_BASE}/s2s/v2.0/task/hair-type-detection`, {
    method: "POST", headers: getAuthHeaders(),
    body: JSON.stringify({ src_file_ids: srcFileIds }),
  });
  if (!res.ok) throw new Error(`PerfectCorp hair task failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { task_id?: string };
  if (!data.task_id) throw new Error("PerfectCorp response missing task_id");
  return data.task_id;
}

const POLL_DELAY_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

interface HairTaskResult {
  hair_type?: { term?: string; mapping?: Record<string, unknown>; confidence?: number };
}

async function pollHairTask(taskId: string): Promise<HairTaskResult> {
  const start = Date.now();
  for (; ;) {
    const res = await fetch(`${PERFECTCORP_BASE}/s2s/v2.0/task/hair-type-detection/${taskId}`, {
      method: "GET", headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`PerfectCorp hair poll failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { status?: string; result?: HairTaskResult };
    if (data.status === "success" && data.result) return data.result;
    if (data.status === "failed" || data.status === "error")
      throw new Error(`PerfectCorp hair task failed: ${data.status}`);
    if (Date.now() - start >= POLL_TIMEOUT_MS)
      throw new Error("PerfectCorp hair analysis timed out");
    await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
  }
}

function toAnalysisResult(
  hairTerm: string | undefined,
  mapping: Record<string, unknown> | undefined,
  confidence?: number
): AnalysisResult {
  const raw: PerfectCorpAnalysisRaw = {
    face: { skinTone: "medium", skinType: "normal", concerns: [], confidence: 1 },
    hair: { type: hairTerm, confidence: confidence ?? 0.7 },
  };
  return normalizePerfectCorpResponse(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const headers = corsHeaders();

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
    const images = body?.images ?? body?.files;

    if (!Array.isArray(images) || images.length !== 3) {
      return NextResponse.json(
        { error: "body.images must be an array of exactly 3 base64 strings (front, right, left)" },
        { status: 400, headers }
      );
    }

    // Validate all three images
    for (let i = 0; i < 3; i++) {
      const err = validateBase64Image(images[i]);
      if (err) return NextResponse.json({ error: `Image ${i + 1}: ${err}` }, { status: 400, headers });
    }

    const [front, right, left] = images as string[];
    const apiKey = process.env.PERFECTCORP_API_KEY;
    const shouldMock = !apiKey || featureFlags.USE_MOCK_ANALYSIS;

    if (shouldMock) {
      const mockRaw = getMockAnalysis({ faceImage: "", hairImage: front });
      const mockResult: AnalysisResult = normalizePerfectCorpResponse(mockRaw);
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json(mockResult, { headers });
    }

    const [fileId1, fileId2, fileId3] = await Promise.all([
      uploadHairFile(front),
      uploadHairFile(right),
      uploadHairFile(left),
    ]);
    const taskId = await createHairTask([fileId1, fileId2, fileId3]);
    const result = await pollHairTask(taskId);
    const hairType = result.hair_type;
    const analysis: AnalysisResult = toAnalysisResult(
      hairType?.term,
      hairType?.mapping as Record<string, unknown> ?? {},
      hairType?.confidence
    );
    return NextResponse.json({ ...analysis, hairTerm: hairType?.term, mapping: hairType?.mapping }, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hair analysis failed";
    const isAuth = message.includes("PERFECTCORP_API_KEY");
    return NextResponse.json({ error: message }, { status: isAuth ? 500 : 502, headers });
  }
}
