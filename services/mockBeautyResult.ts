/**
 * Single place to build a full AnalysisResult for /api/analyze-beauty mock responses.
 */

import type { AnalysisResult } from "@/types/AnalysisResult";
import { clampDisplayConfidence01 } from "@/lib/displayConfidence";
import { normalizePerfectCorpResponse } from "@/services/analysisNormalizer";
import { getMockAnalysis } from "@/services/mockAnalysisAdapter";

export function buildMockBeautyAnalysisResult(): AnalysisResult {
  const raw = getMockAnalysis({
    faceImage: "data:image/jpeg;base64,xx",
    hairImage: "data:image/jpeg;base64,xx",
  });
  const base = normalizePerfectCorpResponse(raw);
  const faceConf = clampDisplayConfidence01(base.face.confidence);
  const hairConf = base.hair ? clampDisplayConfidence01(base.hair.confidence) : null;
  const overall = clampDisplayConfidence01(
    hairConf !== null ? Math.min(faceConf, hairConf) : faceConf
  );
  return {
    face: { ...base.face, confidence: faceConf },
    hair: base.hair && hairConf !== null ? { ...base.hair, confidence: hairConf } : null,
    overallConfidence: overall,
  };
}
