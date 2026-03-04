/**
 * GlowAI – Strictly typed analysis result.
 * UI and recommendation logic MUST consume only this interface.
 * Vendor-specific responses are normalized into this shape via analysisNormalizer.
 */

export type SkinToneCategory =
  | "fair"
  | "light"
  | "medium"
  | "tan"
  | "deep"
  | "rich";

export type SkinTypeCategory = "dry" | "normal" | "combination" | "oily";

export type SkinConcern =
  | "acne"
  | "dark_spots"
  | "fine_lines"
  | "dullness"
  | "redness"
  | "pores"
  | "sensitivity"
  | "oiliness";

export type HairColorCategory =
  | "black"
  | "dark_brown"
  | "brown"
  | "light_brown"
  | "blonde"
  | "red"
  | "gray";

export type HairTypeCategory =
  | "straight"
  | "wavy"
  | "curly"
  | "coily"
  | "unknown";

export interface FaceAnalysis {
  skinTone: SkinToneCategory;
  skinType: SkinTypeCategory;
  concerns: SkinConcern[];
  hydrationScore: number;
  hydrationLevel: "Excellent" | "Good" | "Moderate" | "Low";
  /** 0–1; low confidence may trigger gentler recommendations and disclaimer */
  confidence: number;
}

export interface HairAnalysis {
  color: HairColorCategory;
  type: HairTypeCategory;
  /** Present only when a dedicated hair image was provided or hair was clearly visible */
  confidence: number;
}

/** When no hair image / no visible hair: hair is null; rest of pipeline still runs. */
export interface AnalysisResult {
  face: FaceAnalysis;
  /** null when hair analysis was skipped (no hair image or not visible) */
  hair: HairAnalysis | null;
  /** Overall analysis confidence (e.g. min of face/hair or face-only) */
  overallConfidence: number;
}
