/**
 * Perfect Corp API adapter.
 * MOCK: Returns fake data for MVP. Replace with real API/SDK calls when integrating.
 *
 * Integration notes for future:
 * - Perfect Corp offers Beauty AI APIs (skin analysis, try-on, etc.).
 * - Typically: upload image(s), receive analysis JSON; may support face + hair endpoints.
 * - Add env vars for API key / base URL; keep this file as the single place for Perfect Corp calls.
 */

import type { PerfectCorpAnalysisRaw } from "@/types/PerfectCorpRaw";

export interface AnalyzeImageInput {
  /** Base64 or blob URL of face/selfie image */
  faceImage: string;
  /** Optional second image for hair-focused analysis */
  hairImage?: string | null;
}

/**
 * MOCK: Simulates Perfect Corp analysis. In production, call actual API with faceImage (and optionally hairImage).
 */
export async function analyzeWithPerfectCorp(
  input: AnalyzeImageInput
): Promise<PerfectCorpAnalysisRaw> {
  await new Promise((r) => setTimeout(r, 800));

  const hasHairInput = Boolean(input.hairImage?.trim());

  return {
    face: {
      skinTone: "light",
      skinType: "combination",
      concerns: ["dullness", "fine_lines"],
      confidence: 0.85,
    },
    hair: hasHairInput
      ? {
          color: "dark_brown",
          type: "wavy",
          confidence: 0.75,
        }
      : null,
  };
}
