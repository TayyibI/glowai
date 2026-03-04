/**
 * Recommendation engine: YouCam skin-analysis + hair-type-detection → target tags,
 * then score products by (matching tags count) × priority. Returns 3–4 products per
 * routine with fallback to SAFE_ROUTINE_* when score = 0.
 */

import type { Product, RecommendedProduct } from "@/types/Product";
import type { AnalysisResult } from "@/types/AnalysisResult";
import { generateReason } from "@/lib/benefitExplainer";
import {
  products,
  SAFE_ROUTINE_DAY_IDS,
  SAFE_ROUTINE_NIGHT_IDS,
  SAFE_ROUTINE_HAIR_IDS,
} from "@/data/products";

const MIN_PER_ROUTINE = 3;
const MAX_PER_ROUTINE = 4;

/** YouCam skin-analysis result shape (ui_score / raw_score). */
export interface YouCamSkinInput {
  oiliness?: { ui_score?: number; raw_score?: number };
  moisture?: { ui_score?: number; raw_score?: number };
  acne?: { ui_score?: number; raw_score?: number };
  radiance?: { ui_score?: number; raw_score?: number };
  skin_type?: string;
}

/** YouCam hair-type-detection result (term string). */
export interface YouCamHairInput {
  term?: string;
}

const productById = new Map<string, Product>(products.map((p) => [p.id, p]));

function getProduct(id: string): Product | undefined {
  return productById.get(id);
}

function pickByIds(ids: string[]): Product[] {
  return ids.map((id) => getProduct(id)).filter((p): p is Product => Boolean(p));
}

// ---------- 1. Skin mapping from YouCam skin-analysis results ----------
function buildSkinTargetTags(skin: YouCamSkinInput | null | undefined): string[] {
  const targetTags: string[] = [];
  if (!skin) return targetTags;

  const oilinessUi = skin.oiliness?.ui_score ?? 0;
  const oilinessRaw = skin.oiliness?.raw_score ?? 0;
  if (oilinessUi > 65 || oilinessRaw > 60) {
    targetTags.push("oily", "oiliness", "acne");
  }

  const moistureUi = skin.moisture?.ui_score ?? 100;
  const moistureRaw = skin.moisture?.raw_score ?? 100;
  if (moistureUi < 55 || moistureRaw < 50) {
    targetTags.push("dry", "dryness", "hydration");
  }

  const acneUi = skin.acne?.ui_score ?? 0;
  if (acneUi > 60) {
    targetTags.push("acne");
  }

  const radianceUi = skin.radiance?.ui_score ?? 100;
  if (radianceUi < 55) {
    targetTags.push("dullness", "brightening");
  }

  const skinType = (skin.skin_type ?? "").toLowerCase();
  if (skinType.includes("sensitive") || skinType.includes("dry")) {
    targetTags.push("sensitive");
  }
  if (skinType.includes("oily") || skinType.includes("combination")) {
    targetTags.push("oily", "combination");
  }

  return targetTags;
}

// ---------- 2. Hair mapping from YouCam hair-type-detection ----------
function buildHairTargetTags(hair: YouCamHairInput | null | undefined): string[] {
  const targetTags: string[] = ["all-hair"];
  if (!hair?.term) return targetTags;

  const term = hair.term;
  if (term.includes("Straight")) targetTags.push("straight");
  if (term.includes("Wavy")) targetTags.push("wavy");
  if (term.includes("Curls") || term.includes("Coily") || term.includes("Kinky")) {
    targetTags.push("curly", "coily");
  }
  return targetTags;
}

// ---------- 3. Filtering: score = (matching tags count) × priority ----------
function scoreProduct(product: Product, targetTags: Set<string>): number {
  let matchCount = 0;
  for (const tag of product.tags) {
    if (targetTags.has(tag)) matchCount += 1;
  }
  return matchCount * product.priority;
}

function selectTopForRoutine(
  pool: Product[],
  targetTags: Set<string>,
  maxCount: number,
  userTagsArray: string[]
): RecommendedProduct[] {
  const scored = pool.map((p) => ({ p, score: scoreProduct(p, targetTags) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((x) => x.score > 0).map((x) => x.p);
  const count = Math.min(MAX_PER_ROUTINE, Math.max(MIN_PER_ROUTINE, top.length));
  if (top.length === 0) return [];
  const selected = top.slice(0, count);
  return selected.map((p) => ({
    product: p,
    reason: generateReason(p.tags, userTagsArray, p.category)
  }));
}

function processFallback(
  ids: string[],
  maxCount: number,
  userTagsArray: string[]
): RecommendedProduct[] {
  const products = pickByIds(ids).slice(0, maxCount);
  return products.map((p) => ({
    product: p,
    reason: generateReason(p.tags, userTagsArray, p.category)
  }));
}

export interface RecommendationEngineResult {
  analysisResults: {
    skinTags: string[];
    hairTags: string[];
  };
  recommendedRoutine: {
    day: RecommendedProduct[];
    night: RecommendedProduct[];
    hair: RecommendedProduct[];
  };
}

/**
 * Main entry: YouCam skin + hair raw input → target tags and recommended routine.
 * Fallback to SAFE_ROUTINE_* when score = 0 for that routine.
 */
export function getRecommendedRoutine(
  skin?: YouCamSkinInput | null,
  hair?: YouCamHairInput | null
): RecommendationEngineResult {
  const skinTags = buildSkinTargetTags(skin ?? null);
  const hairTags = buildHairTargetTags(hair ?? null);
  const skinTagSet = new Set(skinTags);
  const hairTagSet = new Set(hairTags);

  const dayPool = products.filter(
    (p) =>
      (p.routine === "day" || p.routine === "both") &&
      !p.category.startsWith("hair_")
  );
  const nightPool = products.filter(
    (p) =>
      (p.routine === "night" || p.routine === "both") &&
      !p.category.startsWith("hair_")
  );
  const hairPool = products.filter((p) => p.routine === "hair");

  const day = selectTopForRoutine(dayPool, skinTagSet, MAX_PER_ROUTINE, skinTags);
  const night = selectTopForRoutine(nightPool, skinTagSet, MAX_PER_ROUTINE, skinTags);
  const hairSelected = selectTopForRoutine(hairPool, hairTagSet, MAX_PER_ROUTINE, hairTags);

  return {
    analysisResults: { skinTags, hairTags },
    recommendedRoutine: {
      day: day.length > 0 ? day : processFallback(SAFE_ROUTINE_DAY_IDS, MAX_PER_ROUTINE, skinTags),
      night: night.length > 0 ? night : processFallback(SAFE_ROUTINE_NIGHT_IDS, MAX_PER_ROUTINE, skinTags),
      hair: hairSelected.length > 0 ? hairSelected : processFallback(SAFE_ROUTINE_HAIR_IDS, MAX_PER_ROUTINE, hairTags),
    },
  };
}

/** Map normalized AnalysisResult to YouCam-style tags and run same engine (for API/app that only have AnalysisResult). */
function skinTagsFromAnalysisResult(face: AnalysisResult["face"]): string[] {
  const targetTags: string[] = [];
  const concerns = new Set<string>((face.concerns ?? []) as string[]);
  const skinType = (face.skinType ?? "").toLowerCase();

  if (face.hydrationScore < 60) {
    targetTags.push("dry", "dryness", "hydration");
  }

  if (concerns.has("oiliness") || concerns.has("acne") || skinType === "oily") {
    targetTags.push("oily", "oiliness", "acne");
  }
  if (concerns.has("dryness") || skinType === "dry") {
    targetTags.push("dry", "dryness", "hydration");
  }
  if (concerns.has("acne")) targetTags.push("acne");
  if (concerns.has("dullness")) targetTags.push("dullness", "brightening");
  if (concerns.has("sensitivity") || skinType === "dry") targetTags.push("sensitive");
  if (skinType === "oily" || skinType === "combination") {
    targetTags.push("oily", "combination");
  }
  return targetTags;
}

function hairTagsFromAnalysisResult(hair: AnalysisResult["hair"]): string[] {
  const targetTags: string[] = ["all-hair"];
  if (!hair?.type) return targetTags;
  const term = String(hair.type);
  if (term.includes("straight")) targetTags.push("straight");
  if (term.includes("wavy")) targetTags.push("wavy");
  if (term.includes("curly") || term.includes("coily")) targetTags.push("curly", "coily");
  return targetTags;
}

/**
 * Entry for callers that only have normalized AnalysisResult (e.g. from /api/analyze-skin).
 * Returns same shape: { analysisResults, recommendedRoutine }.
 */
export function getRecommendedRoutineFromAnalysis(
  analysis: AnalysisResult
): RecommendationEngineResult {
  const skinTags = skinTagsFromAnalysisResult(analysis.face);
  const hairTags = analysis.hair ? hairTagsFromAnalysisResult(analysis.hair) : ["all-hair"];
  const skinTagSet = new Set(skinTags);
  const hairTagSet = new Set(hairTags);

  const dayPool = products.filter(
    (p) =>
      (p.routine === "day" || p.routine === "both") &&
      !p.category.startsWith("hair_")
  );
  const nightPool = products.filter(
    (p) =>
      (p.routine === "night" || p.routine === "both") &&
      !p.category.startsWith("hair_")
  );
  const hairPool = products.filter((p) => p.routine === "hair");

  const day = selectTopForRoutine(dayPool, skinTagSet, MAX_PER_ROUTINE, skinTags);
  const night = selectTopForRoutine(nightPool, skinTagSet, MAX_PER_ROUTINE, skinTags);
  const hairSelected =
    analysis.hair != null
      ? selectTopForRoutine(hairPool, hairTagSet, MAX_PER_ROUTINE, hairTags)
      : [];

  return {
    analysisResults: { skinTags, hairTags },
    recommendedRoutine: {
      day: day.length > 0 ? day : processFallback(SAFE_ROUTINE_DAY_IDS, MAX_PER_ROUTINE, skinTags),
      night: night.length > 0 ? night : processFallback(SAFE_ROUTINE_NIGHT_IDS, MAX_PER_ROUTINE, skinTags),
      hair:
        hairSelected.length > 0
          ? hairSelected
          : analysis.hair != null
            ? processFallback(SAFE_ROUTINE_HAIR_IDS, MAX_PER_ROUTINE, hairTags)
            : [],
    },
  };
}
