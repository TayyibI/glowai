/**
 * Recommendation engine: YouCam skin-analysis + hair-type-detection → target tags,
 * then score products by (matching tags count) × priority.
 *
 * Returns 3–4 products per routine with fallback to SAFE_ROUTINE_* when score = 0.
 *
 * Updated for L'Oréal Paris (skin) + L'Oréal Elvive (hair) catalogue.
 * Supports expanded tag vocabulary and new categories:
 *   eye_cream | mask | hair_treatment | color_treated | dandruff | scalp
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

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** YouCam skin-analysis result shape (ui_score / raw_score 0–100). */
export interface YouCamSkinInput {
  oiliness?: { ui_score?: number; raw_score?: number };
  moisture?: { ui_score?: number; raw_score?: number };
  acne?: { ui_score?: number; raw_score?: number };
  radiance?: { ui_score?: number; raw_score?: number };
  wrinkle?: { ui_score?: number; raw_score?: number };
  dark_circle?: { ui_score?: number; raw_score?: number };
  spot?: { ui_score?: number; raw_score?: number };
  skin_type?: string; // e.g. "oily", "dry", "combination", "sensitive", "normal"
}

/** YouCam hair-type-detection result (term string from SDK). */
export interface YouCamHairInput {
  term?: string; // e.g. "Straight", "Wavy", "Curls", "Coily", "Kinky"
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const productById = new Map<string, Product>(products.map((p) => [p.id, p]));

function getProduct(id: string): Product | undefined {
  return productById.get(id);
}

function pickByIds(ids: string[]): Product[] {
  return ids.map((id) => getProduct(id)).filter((p): p is Product => Boolean(p));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SKIN TAG MAPPING — YouCam raw scores → concern + skin-type tags
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps YouCam skin analysis scores to the tag vocabulary used in products.ts.
 *
 * Score thresholds are deliberately conservative so the engine recommends
 * targeted products rather than general ones wherever possible.
 *
 * All ui_score values are 0–100 where higher = worse condition
 * (except moisture where higher = better).
 */
function buildSkinTargetTags(skin: YouCamSkinInput | null | undefined): string[] {
  const tags = new Set<string>();
  if (!skin) return Array.from(tags);

  // --- Oiliness ---
  const oilinessScore = skin.oiliness?.ui_score ?? skin.oiliness?.raw_score ?? 0;
  if (oilinessScore > 60) {
    tags.add("oily");
    tags.add("oiliness");
    // High oiliness strongly correlates with acne risk
    if (oilinessScore > 70) tags.add("acne");
  }

  // --- Moisture / Hydration (inverted — higher score = better hydration) ---
  const moistureScore = skin.moisture?.ui_score ?? skin.moisture?.raw_score ?? 80;
  if (moistureScore < 60) {
    tags.add("dry");
    tags.add("dryness");
    tags.add("hydration");
  }
  if (moistureScore < 40) {
    // Very dehydrated — boost sensitive tag as barrier is likely compromised
    tags.add("sensitive");
  }

  // --- Acne ---
  const acneScore = skin.acne?.ui_score ?? skin.acne?.raw_score ?? 0;
  if (acneScore > 55) {
    tags.add("acne");
    tags.add("oily"); // acne almost always accompanies oiliness
  }

  // --- Radiance / Dullness (inverted — higher score = better radiance) ---
  const radianceScore = skin.radiance?.ui_score ?? skin.radiance?.raw_score ?? 80;
  if (radianceScore < 60) {
    tags.add("dullness");
    tags.add("brightening");
  }
  if (radianceScore < 45) {
    // Very dull skin often has dark spots too
    tags.add("dark_spots");
  }

  // --- Wrinkles / Fine Lines ---
  const wrinkleScore = skin.wrinkle?.ui_score ?? skin.wrinkle?.raw_score ?? 0;
  if (wrinkleScore > 40) {
    tags.add("fine_lines");
    tags.add("anti-aging");
  }
  if (wrinkleScore > 65) {
    tags.add("wrinkles");
    tags.add("mature");
  }

  // --- Dark Spots ---
  const spotScore = skin.spot?.ui_score ?? skin.spot?.raw_score ?? 0;
  if (spotScore > 40) {
    tags.add("dark_spots");
    tags.add("brightening");
  }

  // --- Dark Circles (eye area) ---
  const darkCircleScore = skin.dark_circle?.ui_score ?? skin.dark_circle?.raw_score ?? 0;
  if (darkCircleScore > 50) {
    tags.add("fine_lines"); // Eye cream category maps to fine_lines tag
    tags.add("anti-aging");
  }

  // --- Skin type from YouCam string ---
  const skinType = (skin.skin_type ?? "").toLowerCase();
  if (skinType.includes("sensitive")) {
    tags.add("sensitive");
    tags.add("gentle");
  }
  if (skinType.includes("dry")) {
    tags.add("dry");
    tags.add("dryness");
    tags.add("hydration");
  }
  if (skinType.includes("oily")) {
    tags.add("oily");
    tags.add("oiliness");
  }
  if (skinType.includes("combination")) {
    tags.add("combination");
    tags.add("oily"); // combination skin has oily T-zone
  }
  if (skinType.includes("normal")) {
    tags.add("all-skin");
  }
  if (skinType.includes("mature")) {
    tags.add("mature");
    tags.add("anti-aging");
  }

  // Always add pollution tag — relevant for everyone in urban environments
  tags.add("pollution");

  // Always add all-skin so universal products are always eligible
  tags.add("all-skin");

  return Array.from(tags);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HAIR TAG MAPPING — YouCam hair term → hair concern tags
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps YouCam hair type detection term to product tags.
 * "all-hair" is always included so universal products always score.
 */
function buildHairTargetTags(hair: YouCamHairInput | null | undefined): string[] {
  const tags = new Set<string>(["all-hair"]);
  if (!hair?.term) return Array.from(tags);

  const term = hair.term.toLowerCase();

  if (term.includes("straight")) {
    tags.add("straight");
    // Straight hair shows frizz and shine issues more visibly
    tags.add("shine");
  }
  if (term.includes("wavy")) {
    tags.add("wavy");
    tags.add("frizzy");
    tags.add("frizz");
  }
  if (
    term.includes("curl") ||
    term.includes("coil") ||
    term.includes("kinky")
  ) {
    tags.add("curly");
    tags.add("coily");
    tags.add("frizzy");
    tags.add("frizz");
    tags.add("dry"); // Curly/coily hair is structurally drier
    tags.add("dryness");
  }

  return Array.from(tags);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SCORING — (matching tag count) × product priority
// ─────────────────────────────────────────────────────────────────────────────

function scoreProduct(product: Product, targetTags: Set<string>): number {
  let matchCount = 0;
  for (const tag of product.tags) {
    if (targetTags.has(tag)) matchCount += 1;
  }
  return matchCount * product.priority;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CATEGORY DEDUPLICATION
// Ensures no routine returns two products in the same category.
// Exception: hair_shampoo + hair_conditioner are always kept as a pair.
// ─────────────────────────────────────────────────────────────────────────────

const PAIRED_CATEGORIES = new Set(["hair_shampoo", "hair_conditioner"]);

function deduplicateByCategory(products: Product[]): Product[] {
  const seenCategories = new Set<string>();
  const result: Product[] = [];

  for (const p of products) {
    // Allow multiple entries for paired categories (shampoo + conditioner)
    if (PAIRED_CATEGORIES.has(p.category)) {
      // But only allow ONE of each within the pair
      if (!seenCategories.has(p.category)) {
        seenCategories.add(p.category);
        result.push(p);
      }
    } else {
      if (!seenCategories.has(p.category)) {
        seenCategories.add(p.category);
        result.push(p);
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SELECTION — score, deduplicate, pick top N
// ─────────────────────────────────────────────────────────────────────────────

function selectTopForRoutine(
  pool: Product[],
  targetTags: Set<string>,
  maxCount: number,
  userTagsArray: string[]
): RecommendedProduct[] {
  // Score all products in pool
  const scored = pool
    .map((p) => ({ p, score: scoreProduct(p, targetTags) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  // Deduplicate by category (highest-scoring wins per category)
  const deduplicated = deduplicateByCategory(scored.map((x) => x.p));

  // Enforce min/max count
  const count = Math.min(maxCount, Math.max(MIN_PER_ROUTINE, deduplicated.length));
  const selected = deduplicated.slice(0, count);

  return selected.map((p) => ({
    product: p,
    reason: generateReason(p.tags, userTagsArray, p.category),
  }));
}

function processFallback(
  ids: string[],
  maxCount: number,
  userTagsArray: string[]
): RecommendedProduct[] {
  const fallbackProducts = pickByIds(ids).slice(0, maxCount);
  return fallbackProducts.map((p) => ({
    product: p,
    reason: generateReason(p.tags, userTagsArray, p.category),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT TYPE
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// 6. POOL DEFINITIONS — which products are eligible per routine slot
// ─────────────────────────────────────────────────────────────────────────────

function getDayPool(): Product[] {
  return products.filter(
    (p) =>
      (p.routine === "day" || p.routine === "both") &&
      !p.category.startsWith("hair_") &&
      p.category !== "hair_treatment"
  );
}

function getNightPool(): Product[] {
  return products.filter(
    (p) =>
      (p.routine === "night" || p.routine === "both") &&
      !p.category.startsWith("hair_") &&
      p.category !== "hair_treatment"
  );
}

function getHairPool(): Product[] {
  return products.filter(
    (p) =>
      p.routine === "hair" ||
      p.category.startsWith("hair_") ||
      p.category === "hair_treatment"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MAIN ENTRY — YouCam raw input
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Primary entry point: accepts YouCam SDK skin + hair raw results.
 * Returns scored and deduplicated product recommendations per routine slot.
 * Falls back to SAFE_ROUTINE_* when no products score > 0 for a slot.
 */
export function getRecommendedRoutine(
  skin?: YouCamSkinInput | null,
  hair?: YouCamHairInput | null
): RecommendationEngineResult {
  const skinTags = buildSkinTargetTags(skin ?? null);
  const hairTags = buildHairTargetTags(hair ?? null);
  const skinTagSet = new Set(skinTags);
  const hairTagSet = new Set(hairTags);

  const day = selectTopForRoutine(getDayPool(), skinTagSet, MAX_PER_ROUTINE, skinTags);
  const night = selectTopForRoutine(getNightPool(), skinTagSet, MAX_PER_ROUTINE, skinTags);
  const hairSelected = selectTopForRoutine(getHairPool(), hairTagSet, MAX_PER_ROUTINE, hairTags);

  return {
    analysisResults: { skinTags, hairTags },
    recommendedRoutine: {
      day:
        day.length > 0
          ? day
          : processFallback(SAFE_ROUTINE_DAY_IDS, MAX_PER_ROUTINE, skinTags),
      night:
        night.length > 0
          ? night
          : processFallback(SAFE_ROUTINE_NIGHT_IDS, MAX_PER_ROUTINE, skinTags),
      hair:
        hairSelected.length > 0
          ? hairSelected
          : processFallback(SAFE_ROUTINE_HAIR_IDS, MAX_PER_ROUTINE, hairTags),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SECONDARY ENTRY — Normalised AnalysisResult
// For callers using the app's internal /api/analyze-skin normalised shape.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps normalised AnalysisResult face data to skin tags.
 * Mirrors the YouCam score thresholds as closely as possible
 * using the normalised fields available in AnalysisResult.
 */
function skinTagsFromAnalysisResult(face: AnalysisResult["face"]): string[] {
  const tags = new Set<string>(["all-skin", "pollution"]);
  const concerns = new Set<string>((face.concerns ?? []) as string[]);
  const skinType = (face.skinType ?? "").toLowerCase();

  // Hydration score (0–100, higher = better hydrated)
  if (face.hydrationScore < 60) {
    tags.add("dry");
    tags.add("dryness");
    tags.add("hydration");
  }
  if (face.hydrationScore < 40) {
    tags.add("sensitive"); // Severely dehydrated = compromised barrier
  }

  // Concern tags
  if (concerns.has("oiliness") || concerns.has("oily")) {
    tags.add("oily");
    tags.add("oiliness");
  }
  if (concerns.has("acne")) {
    tags.add("acne");
    tags.add("oily");
  }
  if (concerns.has("dryness") || concerns.has("dry")) {
    tags.add("dry");
    tags.add("dryness");
    tags.add("hydration");
  }
  if (concerns.has("dullness")) {
    tags.add("dullness");
    tags.add("brightening");
  }
  if (concerns.has("dark_spots") || concerns.has("spots")) {
    tags.add("dark_spots");
    tags.add("brightening");
  }
  if (concerns.has("fine_lines")) {
    tags.add("fine_lines");
    tags.add("anti-aging");
  }
  if (concerns.has("wrinkles")) {
    tags.add("wrinkles");
    tags.add("fine_lines");
    tags.add("anti-aging");
    tags.add("mature");
  }
  if (concerns.has("sensitivity") || concerns.has("sensitive")) {
    tags.add("sensitive");
  }
  if (concerns.has("redness") || concerns.has("irritation")) {
    tags.add("sensitive");
    tags.add("irritation");
    tags.add("redness");
  }
  if (concerns.has("pollution")) {
    tags.add("pollution");
    tags.add("dullness");
  }

  // Skin type tags
  if (skinType === "oily") {
    tags.add("oily");
    tags.add("oiliness");
  }
  if (skinType === "dry") {
    tags.add("dry");
    tags.add("dryness");
    tags.add("hydration");
  }
  if (skinType === "combination") {
    tags.add("combination");
    tags.add("oily");
  }
  if (skinType === "sensitive") {
    tags.add("sensitive");
  }
  if (skinType === "mature") {
    tags.add("mature");
    tags.add("anti-aging");
  }
  if (skinType === "normal") {
    tags.add("all-skin");
  }

  return Array.from(tags);
}

/**
 * Maps normalised AnalysisResult hair data to hair tags.
 */
function hairTagsFromAnalysisResult(hair: AnalysisResult["hair"]): string[] {
  const tags = new Set<string>(["all-hair"]);
  if (!hair?.type) return Array.from(tags);

  const term = String(hair.type).toLowerCase();

  if (term.includes("straight")) {
    tags.add("straight");
    tags.add("shine");
  }
  if (term.includes("wavy")) {
    tags.add("wavy");
    tags.add("frizzy");
    tags.add("frizz");
  }
  if (term.includes("curly") || term.includes("coily") || term.includes("kinky")) {
    tags.add("curly");
    tags.add("coily");
    tags.add("frizzy");
    tags.add("frizz");
    tags.add("dry");
    tags.add("dryness");
  }

  return Array.from(tags);
}

/**
 * Secondary entry for callers that only have a normalised AnalysisResult
 * (e.g. from /api/analyze-skin). Returns the same shape as getRecommendedRoutine.
 */
export function getRecommendedRoutineFromAnalysis(
  analysis: AnalysisResult
): RecommendationEngineResult {
  const skinTags = skinTagsFromAnalysisResult(analysis.face);
  const hairTags = analysis.hair
    ? hairTagsFromAnalysisResult(analysis.hair)
    : ["all-hair"];

  const skinTagSet = new Set(skinTags);
  const hairTagSet = new Set(hairTags);

  const day = selectTopForRoutine(getDayPool(), skinTagSet, MAX_PER_ROUTINE, skinTags);
  const night = selectTopForRoutine(getNightPool(), skinTagSet, MAX_PER_ROUTINE, skinTags);
  const hairSelected =
    analysis.hair != null
      ? selectTopForRoutine(getHairPool(), hairTagSet, MAX_PER_ROUTINE, hairTags)
      : [];

  return {
    analysisResults: { skinTags, hairTags },
    recommendedRoutine: {
      day:
        day.length > 0
          ? day
          : processFallback(SAFE_ROUTINE_DAY_IDS, MAX_PER_ROUTINE, skinTags),
      night:
        night.length > 0
          ? night
          : processFallback(SAFE_ROUTINE_NIGHT_IDS, MAX_PER_ROUTINE, skinTags),
      hair:
        hairSelected.length > 0
          ? hairSelected
          : analysis.hair != null
            ? processFallback(SAFE_ROUTINE_HAIR_IDS, MAX_PER_ROUTINE, hairTags)
            : [],
    },
  };
}