/**
 * Mock analysis adapter for MVP. Returns deterministic fake AnalysisResult-like raw data.
 * Used when featureFlags.USE_MOCK_ANALYSIS is true.
 */

import type { PerfectCorpAnalysisRaw } from "@/types/PerfectCorpRaw";

export interface MockAnalyzeInput {
  faceImage: string;
  hairImage?: string | null;
}

export function getMockAnalysis(input: MockAnalyzeInput): PerfectCorpAnalysisRaw {
  const hasHair = Boolean(input.hairImage?.trim());

  return {
    face: {
      skinTone: "light",
      skinType: "combination",
      concerns: ["dullness", "fine_lines", "dark_spots"],
      confidence: 0.88,
    },
    hair: hasHair
      ? { color: "dark_brown", type: "wavy", confidence: 0.72 }
      : null,
  };
}
