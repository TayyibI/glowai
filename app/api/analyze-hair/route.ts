/**
 * POST /api/analyze-hair
 * PerfectCorp 4-step flow: upload 3 files (front, right, left) → create task → poll → return normalized AnalysisResult.
 * Uses PERFECTCORP_API_KEY (env only; never commit).
 */
import { NextResponse } from "next/server";
import { normalizePerfectCorpResponse } from "@/services/analysisNormalizer";
import { getMockAnalysis } from "@/services/mockAnalysisAdapter";
import { featureFlags } from "@/config/featureFlags";
import type { PerfectCorpAnalysisRaw } from "@/types/PerfectCorpRaw";
import type { AnalysisResult } from "@/types/AnalysisResult";
const PERFECTCORP_BASE = process.env.PERFECTCORP_BASE_URL ?? "https://api.perfectcorp.com";
function getAuthHeaders(): HeadersInit {
    const key = process.env.PERFECTCORP_API_KEY;
    if (!key) {
        throw new Error("PERFECTCORP_API_KEY is not set");
    }
    return {
        "x-api-key": key,
        "Content-Type": "application/json",
    };
}
/** Step 1: Upload one image to hair-type-detection file endpoint → file_id */
async function uploadHairFile(base64Image: string): Promise<string> {
    const res = await fetch(
        `${PERFECTCORP_BASE}/s2s/v2.0/file/hair-type-detection`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ file: base64Image }),
        }
    );
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PerfectCorp hair file upload failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { file_id?: string };
    if (!data.file_id) throw new Error("PerfectCorp response missing file_id");
    return data.file_id;
}
/** Step 2: Create hair-type-detection task with src_file_ids (3 files) */
async function createHairTask(srcFileIds: [string, string, string]): Promise<string> {
    const res = await fetch(
        `${PERFECTCORP_BASE}/s2s/v2.0/task/hair-type-detection`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ src_file_ids: srcFileIds }),
        }
    );
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PerfectCorp hair task create failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { task_id?: string };
    if (!data.task_id) throw new Error("PerfectCorp response missing task_id");
    return data.task_id;
}
/** Step 3: Poll task until success (2s delay, max 30s) */
const POLL_DELAY_MS = 2000;
const POLL_TIMEOUT_MS = 30000;
interface HairTaskResult {
    hair_type?: {
        term?: string;
        mapping?: Record<string, unknown>;
        confidence?: number;
    };
}
async function pollHairTask(taskId: string): Promise<HairTaskResult> {
    const start = Date.now();
    for (; ;) {
        const res = await fetch(
            `${PERFECTCORP_BASE}/s2s/v2.0/task/hair-type-detection/${taskId}`,
            { method: "GET", headers: getAuthHeaders() }
        );
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`PerfectCorp hair task poll failed: ${res.status} ${text}`);
        }
        const data = (await res.json()) as {
            status?: string;
            result?: HairTaskResult;
        };
        if (data.status === "success" && data.result) {
            return data.result;
        }
        if (data.status === "failed" || data.status === "error") {
            throw new Error(`PerfectCorp hair task failed: ${data.status}`);
        }
        if (Date.now() - start >= POLL_TIMEOUT_MS) {
            throw new Error("PerfectCorp hair analysis timed out");
        }
        await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
    }
}
/** Map hair result to AnalysisResult (face defaults, hair from API) */
function toAnalysisResult(
    hairTerm: string | undefined,
    mapping: Record<string, unknown> | undefined,
    confidence?: number
): AnalysisResult {
    const raw: PerfectCorpAnalysisRaw = {
        face: {
            skinTone: "medium",
            skinType: "normal",
            concerns: [],
            confidence: 1,
        },
        hair: {
            type: hairTerm,
            confidence: confidence ?? 0.7,
        },
    };
    return normalizePerfectCorpResponse(raw);
}
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const images = body?.images ?? body?.files;
        if (!Array.isArray(images) || images.length !== 3) {
            return NextResponse.json(
                {
                    error:
                        "Missing or invalid body.images: expected array of 3 base64 strings (front, right, left)",
                },
                { status: 400 }
            );
        }
        const [front, right, left] = images as string[];
        if (
            typeof front !== "string" ||
            typeof right !== "string" ||
            typeof left !== "string"
        ) {
            return NextResponse.json(
                { error: "Each of body.images[0..2] must be a base64 string" },
                { status: 400 }
            );
        }

        const apiKey = process.env.PERFECTCORP_API_KEY;
        const shouldMock = !apiKey || featureFlags.USE_MOCK_ANALYSIS;

        if (shouldMock) {
            // Simulate network delay and return predefined mock data
            const mockRaw = getMockAnalysis({ faceImage: "", hairImage: front });
            const mockResult: AnalysisResult = normalizePerfectCorpResponse(mockRaw);
            await new Promise((r) => setTimeout(r, 1500));
            return NextResponse.json(mockResult);
        }
        const fileId1 = await uploadHairFile(front);
        const fileId2 = await uploadHairFile(right);
        const fileId3 = await uploadHairFile(left);
        const taskId = await createHairTask([fileId1, fileId2, fileId3]);
        const result = await pollHairTask(taskId);
        const hairType = result.hair_type;
        const hairTerm = hairType?.term;
        const mapping = hairType?.mapping ?? {};
        const confidence = hairType?.confidence;
        const analysis: AnalysisResult = toAnalysisResult(
            hairTerm,
            mapping as Record<string, unknown>,
            confidence
        );
        return NextResponse.json({
            ...analysis,
            hairTerm,
            mapping,
        } as AnalysisResult & { hairTerm?: string; mapping?: Record<string, unknown> });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Hair analysis failed";
        const isAuth = message.includes("PERFECTCORP_API_KEY");
        return NextResponse.json(
            { error: message },
            { status: isAuth ? 500 : 502 }
        );
    }
}
