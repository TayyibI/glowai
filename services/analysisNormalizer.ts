/**
 * Converts raw vendor (e.g. Perfect Corp) responses into the standardized AnalysisResult.
 * UI and recommendation logic consume only AnalysisResult.
 */

import type { AnalysisResult, FaceAnalysis, HairAnalysis } from "@/types/AnalysisResult";
import type {
  SkinToneCategory,
  SkinTypeCategory,
  SkinConcern,
  HairColorCategory,
  HairTypeCategory,
} from "@/types/AnalysisResult";
import type { PerfectCorpAnalysisRaw } from "@/types/PerfectCorpRaw";

const SKIN_TONE_MAP: Record<string, SkinToneCategory> = {
  fair: "fair",
  light: "light",
  medium: "medium",
  tan: "tan",
  deep: "deep",
  rich: "rich",
};

const SKIN_TYPE_MAP: Record<string, SkinTypeCategory> = {
  dry: "dry",
  normal: "normal",
  combination: "combination",
  oily: "oily",
};

const CONCERN_MAP: Record<string, SkinConcern> = {
  acne: "acne",
  dark_spots: "dark_spots",
  fine_lines: "fine_lines",
  dullness: "dullness",
  redness: "redness",
  pores: "pores",
  sensitivity: "sensitivity",
  oiliness: "oiliness",
};

const HAIR_COLOR_MAP: Record<string, HairColorCategory> = {
  black: "black",
  dark_brown: "dark_brown",
  brown: "brown",
  light_brown: "light_brown",
  blonde: "blonde",
  red: "red",
  gray: "gray",
};

const HAIR_TYPE_MAP: Record<string, HairTypeCategory> = {
  straight: "straight",
  wavy: "wavy",
  curly: "curly",
  coily: "coily",
  unknown: "unknown",
};

function normalizeSkinTone(raw?: string): SkinToneCategory {
  if (!raw) return "medium";
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  return SKIN_TONE_MAP[key] ?? "medium";
}

function normalizeSkinType(raw?: string): SkinTypeCategory {
  if (!raw) return "normal";
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  return SKIN_TYPE_MAP[key] ?? "normal";
}

function normalizeConcerns(raw?: string[]): SkinConcern[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => {
      const key = String(c).toLowerCase().replace(/\s+/g, "_");
      return CONCERN_MAP[key];
    })
    .filter((c): c is SkinConcern => Boolean(c));
}

function normalizeHairColor(raw?: string): HairColorCategory {
  if (!raw) return "brown";
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  return HAIR_COLOR_MAP[key] ?? "brown";
}

function normalizeHairType(raw?: string): HairTypeCategory {
  if (!raw) return "unknown";
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  return HAIR_TYPE_MAP[key] ?? "unknown";
}

export function normalizePerfectCorpResponse(
  raw: PerfectCorpAnalysisRaw & {
    face?: {
      moisture?: { ui_score?: number, raw_score?: number },
      hd_moisture?: { ui_score?: number, raw_score?: number }
    }
  }
): AnalysisResult {
  const faceRaw = raw.face;
  const moistureScore = faceRaw?.moisture?.ui_score ?? faceRaw?.moisture?.raw_score ??
    faceRaw?.hd_moisture?.ui_score ?? faceRaw?.hd_moisture?.raw_score ?? 70;
  const hydrationScore = Math.round(moistureScore);
  const hydrationLevel = hydrationScore >= 81 ? "Excellent" :
    hydrationScore >= 61 ? "Good" :
      hydrationScore >= 41 ? "Moderate" : "Low";

  const face: FaceAnalysis = {
    skinTone: normalizeSkinTone(faceRaw?.skinTone),
    skinType: normalizeSkinType(faceRaw?.skinType),
    concerns: normalizeConcerns(faceRaw?.concerns),
    hydrationScore,
    hydrationLevel,
    confidence: Math.min(1, Math.max(0, faceRaw?.confidence ?? 0.8)),
  };

  let hair: HairAnalysis | null = null;
  if (raw.hair && typeof raw.hair === "object") {
    hair = {
      color: normalizeHairColor(raw.hair.color),
      type: normalizeHairType(raw.hair.type),
      confidence: Math.min(1, Math.max(0, raw.hair.confidence ?? 0.7)),
    };
  }

  const overallConfidence = hair
    ? Math.min(face.confidence, hair.confidence)
    : face.confidence;

  return {
    face,
    hair,
    overallConfidence,
  };
}
