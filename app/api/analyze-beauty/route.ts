/**
 * POST /api/analyze-beauty
 * YouCam S2S v2.0: one image → presigned upload → parallel skin-analysis + hair-type-detection tasks → poll → combined JSON.
 * Auth: Authorization: Bearer process.env.YOUCAM_API_KEY
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { AnalysisResult } from "@/types/AnalysisResult";
import { featureFlags } from "@/config/featureFlags";
import { buildMockBeautyAnalysisResult } from "@/services/mockBeautyResult";

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting (aligned with other analyze routes)
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
// YouCam API config
// ─────────────────────────────────────────────────────────────────────────────
const YOUCAM_BASE =
  process.env.YOUCAM_BASE_URL ?? process.env.PERFECTCORP_BASE_URL ?? "https://yce-api-01.makeupar.com";

/** All SD dst_actions from the API (do not mix with hd_*). Hydration maps to API key "moisture". */
const SD_SKIN_DST_ACTIONS = [
  "wrinkle",
  "pore",
  "texture",
  "acne",
  "oiliness",
  "radiance",
  "eye_bag",
  "age_spot",
  "dark_circle_v2",
  "droopy_upper_eyelid",
  "droopy_lower_eyelid",
  "firmness",
  "moisture",
  "redness",
  "tear_trough",
  "skin_type",
] as const;

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;
const MOCK_DELAY_MS = 1500;

function getBearerHeaders(): HeadersInit {
  const key = process.env.YOUCAM_API_KEY;
  if (!key?.trim()) throw new Error("YOUCAM_API_KEY is not set");
  return {
    Authorization: `Bearer ${key.trim()}`,
    "Content-Type": "application/json",
  };
}

type FileUploadEntry = {
  file_id: string;
  requests: Array<{ method: string; url: string; headers: Record<string, string> }>;
};

function parseImageToBuffer(image: string): { buffer: Buffer; contentType: string; fileName: string } {
  const trimmed = image.trim();
  const dataUri = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([\s\S]+)$/i.exec(trimmed);
  if (dataUri) {
    const rawMime = dataUri[1].toLowerCase();
    const mime = rawMime === "image/jpg" ? "image/jpeg" : rawMime;
    const b64 = dataUri[2].replace(/\s/g, "");
    const buffer = Buffer.from(b64, "base64");
    if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Image exceeds 10 MB limit");
    const ext =
      mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    return {
      buffer,
      contentType: mime,
      fileName: `beauty_${Date.now()}_${randomBytes(4).toString("hex")}.${ext}`,
    };
  }

  const b64 = trimmed.replace(/\s/g, "");
  if (b64.length < 100) throw new Error("Image string too short — expected base64 encoded image");
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Image exceeds 10 MB limit");
  return {
    buffer,
    contentType: "image/jpeg",
    fileName: `beauty_${Date.now()}_${randomBytes(4).toString("hex")}.jpg`,
  };
}

async function initSkinFileUpload(
  contentType: string,
  fileName: string,
  fileSize: number
): Promise<FileUploadEntry> {
  const res = await fetch(`${YOUCAM_BASE}/s2s/v2.0/file/skin-analysis`, {
    method: "POST",
    headers: getBearerHeaders(),
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: fileName, file_size: fileSize }],
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Skin file init failed: ${res.status} ${text}`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as { data?: { files?: FileUploadEntry[] }; status?: number };
  } catch {
    throw new Error(`Skin file init: invalid JSON: ${text.slice(0, 500)}`);
  }
  const file = (parsed as { data?: { files?: FileUploadEntry[] } }).data?.files?.[0];
  if (!file?.file_id || !file.requests?.length) {
    throw new Error("Skin file init response missing file_id or presigned requests");
  }
  return file;
}

async function initHairTypeFileUpload(
  contentType: string,
  fileName: string,
  fileSize: number
): Promise<FileUploadEntry> {
  const res = await fetch(`${YOUCAM_BASE}/s2s/v2.0/file/hair-type-detection`, {
    method: "POST",
    headers: getBearerHeaders(),
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: fileName, file_size: fileSize }],
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Hair file init failed: ${res.status} ${text}`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as { data?: { files?: FileUploadEntry[] } };
  } catch {
    throw new Error(`Hair file init: invalid JSON: ${text.slice(0, 500)}`);
  }
  const file = (parsed as { data?: { files?: FileUploadEntry[] } }).data?.files?.[0];
  if (!file?.file_id || !file.requests?.length) {
    throw new Error("Hair file init response missing file_id or presigned requests");
  }
  return file;
}

async function putBinaryToPresignedUrl(buffer: Buffer, request: FileUploadEntry["requests"][0]): Promise<void> {
  const h = new Headers();
  for (const [k, v] of Object.entries(request.headers ?? {})) {
    if (k.toLowerCase() === "content-length") h.set(k, String(buffer.length));
    else h.set(k, v);
  }
  if (!h.has("Content-Type")) h.set("Content-Type", "application/octet-stream");

  const put = await fetch(request.url, {
    method: request.method || "PUT",
    headers: h,
    body: new Uint8Array(buffer),
  });
  if (!put.ok) {
    const t = await put.text().catch(() => "");
    throw new Error(`S3 upload failed: ${put.status} ${t.slice(0, 300)}`);
  }
}

async function createSkinAnalysisTask(fileId: string): Promise<string> {
  const res = await fetch(`${YOUCAM_BASE}/s2s/v2.0/task/skin-analysis`, {
    method: "POST",
    headers: getBearerHeaders(),
    body: JSON.stringify({
      src_file_id: fileId,
      dst_actions: [...SD_SKIN_DST_ACTIONS],
      format: "json",
      miniserver_args: { enable_mask_overlay: false },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Skin task create failed: ${res.status} ${text}`);
  const data = JSON.parse(text) as { data?: { task_id?: string } };
  const taskId = data.data?.task_id;
  if (!taskId) throw new Error("Skin task create: missing task_id");
  return taskId;
}

/** Hair type detection: three `hair-type-detection` file_ids (angles), or the same skin `file_id` three times when only a face image is provided. */
async function createHairTypeTask(srcFileIds: [string, string, string]): Promise<string> {
  const res = await fetch(`${YOUCAM_BASE}/s2s/v2.0/task/hair-type-detection`, {
    method: "POST",
    headers: getBearerHeaders(),
    body: JSON.stringify({ src_file_ids: srcFileIds }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Hair task create failed: ${res.status} ${text}`);
  const data = JSON.parse(text) as { data?: { task_id?: string } };
  const taskId = data.data?.task_id;
  if (!taskId) throw new Error("Hair task create: missing task_id");
  return taskId;
}

type TaskPollState =
  | { phase: "running" }
  | { phase: "success"; payload: unknown }
  | { phase: "error"; message: string };

function readTaskStatus(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  const data = o.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.task_status === "string") return d.task_status;
    if (typeof d.status === "string") return d.status;
  }
  if (typeof o.task_status === "string") return o.task_status;
  if (typeof o.status === "string" && o.status !== "200") return o.status;
  return undefined;
}

function extractSuccessPayload(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const o = body as Record<string, unknown>;
  if (o.data !== undefined) return o.data;
  return body;
}

async function pollTaskOnce(
  url: string,
  label: "skin" | "hair"
): Promise<TaskPollState> {
  const res = await fetch(url, { method: "GET", headers: getBearerHeaders() });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    return { phase: "error", message: `${label}: invalid JSON from poll (${res.status})` };
  }
  if (!res.ok) {
    return { phase: "error", message: `${label}: poll HTTP ${res.status} ${text.slice(0, 400)}` };
  }

  const st = (readTaskStatus(body) ?? "").toLowerCase();
  if (st === "success" || st === "completed") {
    return { phase: "success", payload: extractSuccessPayload(body) };
  }
  if (st === "error" || st === "failed") {
    const msg =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error?: unknown }).error)
        : text.slice(0, 400);
    return { phase: "error", message: `${label} task failed: ${msg}` };
  }
  if (st === "running" || st === "pending" || st === "processing" || st === "") {
    return { phase: "running" };
  }
  return { phase: "running" };
}

async function pollBothTasksParallel(
  skinTaskId: string,
  hairTaskId: string
): Promise<{ skin: unknown; hair: unknown }> {
  const skinUrl = `${YOUCAM_BASE}/s2s/v2.0/task/skin-analysis/${encodeURIComponent(skinTaskId)}`;
  const hairUrl = `${YOUCAM_BASE}/s2s/v2.0/task/hair-type-detection/${encodeURIComponent(hairTaskId)}`;
  const start = Date.now();
  let lastSkin: TaskPollState = { phase: "running" };
  let lastHair: TaskPollState = { phase: "running" };

  for (; ;) {
    if (Date.now() - start >= POLL_TIMEOUT_MS) {
      throw new Error(
        `Analysis timed out after ${POLL_TIMEOUT_MS / 1000}s (skin: ${lastSkin.phase}, hair: ${lastHair.phase})`
      );
    }

    const [s, h] = await Promise.all([pollTaskOnce(skinUrl, "skin"), pollTaskOnce(hairUrl, "hair")]);
    lastSkin = s;
    lastHair = h;

    if (s.phase === "error") throw new Error(s.message);
    if (h.phase === "error") throw new Error(h.message);
    if (s.phase === "success" && h.phase === "success") {
      return { skin: s.payload, hair: h.payload };
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

function isClientErrorMessage(message: string): boolean {
  return (
    message.includes("Missing image") ||
    message.includes("must be a string") ||
    message.includes("too short") ||
    message.includes("exceeds 10 MB") ||
    message.includes("Face image is empty") ||
    message.includes("Provide all three hair angles")
  );
}

export type AnalyzeBeautyMockReason =
  | "rate_limit"
  | "feature_flag"
  | "no_api_key"
  | "api_error"
  | "parse_error";

async function jsonMockSuccess(
  headers: HeadersInit,
  reason: AnalyzeBeautyMockReason,
  detail?: string
) {
  const safeDetail = detail?.trim().slice(0, 500);
  console.warn(
    "[analyze-beauty] mock fallback",
    JSON.stringify({ reason, detail: safeDetail ?? null, ts: new Date().toISOString() })
  );
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const analysis: AnalysisResult = buildMockBeautyAnalysisResult();
  return NextResponse.json(
    {
      mock: true as const,
      analysis,
      mockReason: reason,
      ...(safeDetail ? { mockDetail: safeDetail } : {}),
    },
    { status: 200, headers }
  );
}

type ParsedMultipart = {
  face: { buffer: Buffer; contentType: string; fileName: string };
  hairAngles?: [
    { buffer: Buffer; contentType: string; fileName: string },
    { buffer: Buffer; contentType: string; fileName: string },
    { buffer: Buffer; contentType: string; fileName: string },
  ];
};

async function runYouCamPipeline(parsed: ParsedMultipart): Promise<{
  mock: false;
  skin: unknown;
  hair: unknown;
  file_id: string;
  skin_task_id: string;
  hair_task_id: string;
}> {
  const { face, hairAngles } = parsed;

  const skinMeta = await initSkinFileUpload(face.contentType, face.fileName, face.buffer.length);
  const skinPresigned = skinMeta.requests[0];
  if (!skinPresigned?.url) throw new Error("Skin presigned upload URL missing");
  await putBinaryToPresignedUrl(face.buffer, skinPresigned);
  const skinFileId = skinMeta.file_id;

  let hairFileIds: [string, string, string];
  if (hairAngles?.length === 3) {
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const h = hairAngles[i];
      const meta = await initHairTypeFileUpload(h.contentType, h.fileName, h.buffer.length);
      const putReq = meta.requests[0];
      if (!putReq?.url) throw new Error(`Hair presigned URL missing (angle ${i + 1})`);
      await putBinaryToPresignedUrl(h.buffer, putReq);
      ids.push(meta.file_id);
    }
    hairFileIds = [ids[0], ids[1], ids[2]];
  } else {
    hairFileIds = [skinFileId, skinFileId, skinFileId];
  }

  const [skinTaskId, hairTaskId] = await Promise.all([
    createSkinAnalysisTask(skinFileId),
    createHairTypeTask(hairFileIds),
  ]);

  const { skin, hair } = await pollBothTasksParallel(skinTaskId, hairTaskId);
  return {
    mock: false,
    skin,
    hair,
    file_id: skinFileId,
    skin_task_id: skinTaskId,
    hair_task_id: hairTaskId,
  };
}

function validateBodyImage(value: unknown): string | null {
  if (typeof value !== "string") return "Image must be a string";
  return null;
}

async function formBlobToPart(
  entry: FormDataEntryValue | null,
  fallbackBaseName: string
): Promise<{ buffer: Buffer; contentType: string; fileName: string } | null> {
  if (!(entry instanceof Blob) || entry.size === 0) return null;
  const buffer = Buffer.from(await entry.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Image exceeds 10 MB limit");
  const mime = entry.type && entry.type.startsWith("image/") ? entry.type : "image/jpeg";
  const fileName =
    entry instanceof File && entry.name?.trim()
      ? entry.name
      : `${fallbackBaseName}_${Date.now()}_${randomBytes(4).toString("hex")}.jpg`;
  return { buffer, contentType: mime, fileName };
}

async function parseMultipartBeauty(request: NextRequest): Promise<ParsedMultipart> {
  const contentTypeHeader = request.headers.get("content-type") ?? "";
  if (contentTypeHeader.includes("multipart/form-data")) {
    const form = await request.formData();
    const faceEntry = form.get("file") ?? form.get("image");
    if (!(faceEntry instanceof Blob)) throw new Error("Missing image file (use field name \"file\" or \"image\")");
    const face = await formBlobToPart(faceEntry, "face");
    if (!face) throw new Error("Face image is empty");

    const hf = await formBlobToPart(form.get("hair_front"), "hair_front");
    const hr = await formBlobToPart(form.get("hair_right"), "hair_right");
    const hl = await formBlobToPart(form.get("hair_left"), "hair_left");
    const partialHair = [hf, hr, hl].filter(Boolean).length;
    if (partialHair > 0 && partialHair < 3) {
      throw new Error("Provide all three hair angles (hair_front, hair_right, hair_left) or omit them for face-only mode.");
    }
    if (hf && hr && hl) {
      return { face, hairAngles: [hf, hr, hl] };
    }
    return { face };
  }

  const body = await request.json();
  const image = body?.image ?? body?.file;
  const ve = validateBodyImage(image);
  if (ve) throw new Error(ve);
  const face = parseImageToBuffer(image as string);
  return { face };
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return jsonMockSuccess(headers, "rate_limit", "In-memory limit: 10 requests / 60s per IP");
  }

  let parsed: ParsedMultipart;
  try {
    parsed = await parseMultipartBeauty(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    if (isClientErrorMessage(message)) {
      return NextResponse.json({ error: message }, { status: 400, headers });
    }
    return jsonMockSuccess(headers, "parse_error", message);
  }

  const apiKey = process.env.YOUCAM_API_KEY?.trim();
  if (featureFlags.USE_MOCK_ANALYSIS) {
    return jsonMockSuccess(
      headers,
      "feature_flag",
      "config/featureFlags.ts has USE_MOCK_ANALYSIS = true — set to false to call YouCam."
    );
  }
  if (!apiKey) {
    return jsonMockSuccess(headers, "no_api_key", "Set YOUCAM_API_KEY in .env for live analysis.");
  }

  try {
    const payload = await runYouCamPipeline(parsed);
    return NextResponse.json(payload, { status: 200, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonMockSuccess(headers, "api_error", msg);
  }
}
