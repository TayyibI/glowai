/**
 * POST /api/analyze-skin
 * PerfectCorp 4-step flow: upload file → create task (dst_actions) → poll → return normalized AnalysisResult.
 * Uses PERFECTCORP_API_KEY (env only; never commit).
 */
import { NextResponse } from "next/server";
import { normalizePerfectCorpResponse } from "@/services/analysisNormalizer";
import { getMockAnalysis } from "@/services/mockAnalysisAdapter";
import { featureFlags } from "@/config/featureFlags";
import type { PerfectCorpAnalysisRaw } from "@/types/PerfectCorpRaw";
import type { AnalysisResult } from "@/types/AnalysisResult";
const PERFECTCORP_BASE = process.env.PERFECTCORP_BASE_URL ?? "https://api.perfectcorp.com";
const DST_ACTIONS = [
    "skin_type",
    "oiliness",
    "moisture",
    "acne",
    "radiance",
    "texture",
] as const;
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
/** Step 1: Upload image file → file_id */
async function uploadSkinFile(base64Image: string): Promise<string> {
    const res = await fetch(`${PERFECTCORP_BASE}/s2s/v2.0/file/skin-analysis`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ file: base64Image }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PerfectCorp file upload failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { file_id?: string };
    if (!data.file_id) throw new Error("PerfectCorp response missing file_id");
    return data.file_id;
}
/** Step 2: Create skin analysis task with dst_actions */
async function createSkinTask(fileId: string): Promise<string> {
    const res = await fetch(`${PERFECTCORP_BASE}/s2s/v2.0/task/skin-analysis`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            src_file_id: fileId,
            dst_actions: [...DST_ACTIONS],
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PerfectCorp task create failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { task_id?: string };
    if (!data.task_id) throw new Error("PerfectCorp response missing task_id");
    return data.task_id;
}
/** Step 3: Poll task until success (2s delay, max 30s) */
const POLL_DELAY_MS = 2000;
const POLL_TIMEOUT_MS = 30000;
async function pollSkinTask(taskId: string): Promise<SkinTaskResult> {
    const start = Date.now();
    for (; ;) {
        const res = await fetch(
            `${PERFECTCORP_BASE}/s2s/v2.0/task/skin-analysis/${taskId}`,
            { method: "GET", headers: getAuthHeaders() }
        );
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`PerfectCorp task poll failed: ${res.status} ${text}`);
        }
        const data = (await res.json()) as {
            status?: string;
            result?: SkinTaskResult;
        };
        if (data.status === "success" && data.result) {
            return data.result;
        }
        if (data.status === "failed" || data.status === "error") {
            throw new Error(`PerfectCorp task failed: ${data.status}`);
        }
        if (Date.now() - start >= POLL_TIMEOUT_MS) {
            throw new Error("PerfectCorp skin analysis timed out");
        }
        await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
    }
}
/** Vendor result shape (adjust to actual API response) */
interface SkinTaskResult {
    skin_type?: string;
    oiliness?: string | number;
    moisture?: string | number;
    acne?: string | number;
    radiance?: string | number;
    texture?: string | number;
    confidence?: number;
}
/** Map task result to PerfectCorpAnalysisRaw then to AnalysisResult */
function toAnalysisResult(result: SkinTaskResult): AnalysisResult {
    const concerns: string[] = [];
    if (result.oiliness && String(result.oiliness).toLowerCase() !== "normal")
        concerns.push("oiliness");
    if (result.acne && Number(result.acne) > 0) concerns.push("acne");
    if (result.radiance !== undefined && Number(result.radiance) < 0.5)
        concerns.push("dullness");
    if (result.texture && Number(result.texture) > 0.5) concerns.push("fine_lines");
    const raw: PerfectCorpAnalysisRaw = {
        face: {
            skinType: result.skin_type,
            concerns,
            confidence: result.confidence ?? 0.8,
        },
        hair: null,
    };
    return normalizePerfectCorpResponse(raw);
}
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const image = body?.image ?? body?.file;
        if (!image || typeof image !== "string") {
            return NextResponse.json(
                { error: "Missing body.image or body.file (base64 string)" },
                { status: 400 }
            );
        }

        const apiKey = process.env.PERFECTCORP_API_KEY;
        const shouldMock = !apiKey || featureFlags.USE_MOCK_ANALYSIS;

        if (shouldMock) {
            // Return predefined mock analysis exactly matching standard capture formats
            const mockRaw = getMockAnalysis({ faceImage: image });
            const mockResult: AnalysisResult = normalizePerfectCorpResponse(mockRaw);
            // Simulate network delay
            await new Promise((r) => setTimeout(r, 1500));
            return NextResponse.json(mockResult);
        }
        const fileId = await uploadSkinFile(image);
        const taskId = await createSkinTask(fileId);
        const result = await pollSkinTask(taskId);
        const analysis: AnalysisResult = toAnalysisResult(result);
        return NextResponse.json(analysis);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        const isAuth = message.includes("PERFECTCORP_API_KEY");
        return NextResponse.json(
            { error: message },
            { status: isAuth ? 500 : 502 }
        );
    }
}