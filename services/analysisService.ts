/**
 * Main service for image analysis. Orchestrates the pipeline and switches between
 * mock and vendor (Perfect Corp) implementations based on feature flags.
 */

import { featureFlags } from "@/config/featureFlags";
import { normalizePerfectCorpResponse } from "@/services/analysisNormalizer";
import { analyzeWithPerfectCorp } from "@/services/perfectCorpAdapter";
import { getMockAnalysis } from "@/services/mockAnalysisAdapter";
import type { AnalysisResult } from "@/types/AnalysisResult";

export interface AnalyzeInput {
  faceImage: string;
  hairImage?: string | null;
}

export async function analyzeImages(input: AnalyzeInput): Promise<AnalysisResult> {
  let raw;

  if (featureFlags.USE_MOCK_ANALYSIS) {
    raw = getMockAnalysis({
      faceImage: input.faceImage,
      hairImage: input.hairImage ?? null,
    });
  } else {
    raw = await analyzeWithPerfectCorp({
      faceImage: input.faceImage,
      hairImage: input.hairImage ?? null,
    });
  }

  return normalizePerfectCorpResponse(raw);
}
