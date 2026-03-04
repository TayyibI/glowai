/**
 * Recommendation facade: delegates to lib/recommendationEngine for YouCam-based
 * tag mapping and scoring. Returns Day / Night / Hair routines for the app.
 */

import type { AnalysisResult } from "@/types/AnalysisResult";
import type { RecommendedProduct, Routine } from "@/types/Product";
import { getRecommendedRoutineFromAnalysis } from "@/lib/recommendationEngine";

/**
 * Builds day, night, and hair routines from analysis. Uses engine rules:
 * skin tags from concerns/skinType, hair tags from hair.type; score = (matching tags) × priority;
 * fallback to SAFE_ROUTINE_* when no matches.
 */
export function getRecommendations(analysis: AnalysisResult): Routine & { hair: RecommendedProduct[] } {
  const { recommendedRoutine } = getRecommendedRoutineFromAnalysis(analysis);
  return recommendedRoutine;
}
