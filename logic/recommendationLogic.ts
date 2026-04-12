/**
 * Recommendation facade: delegates to lib/recommendationEngine for YouCam-based
 * tag mapping and scoring. Returns Day / Night / Hair routines for the app.
 *
 * Reads user onboarding preferences from sessionStorage to apply:
 *  - Goal boosting
 *  - Sensitivity exclusions
 *  - Hair concern tagging (Pakistan: hairfall)
 */

import type { AnalysisResult } from "@/types/AnalysisResult";
import type { RecommendedProduct, Routine } from "@/types/Product";
import {
  getRecommendedRoutineFromAnalysis,
  loadUserPreferences,
} from "@/lib/recommendationEngine";

/**
 * Builds day, night, and hair routines from analysis + onboarding prefs.
 * Reads preferences automatically from sessionStorage ("glowai_onboarding").
 */
export function getRecommendations(
  analysis: AnalysisResult
): Routine & { hair: RecommendedProduct[] } {
  const prefs = loadUserPreferences();
  const { recommendedRoutine } = getRecommendedRoutineFromAnalysis(analysis, prefs);
  return recommendedRoutine;
}
