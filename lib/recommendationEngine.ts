/**
 * Recommendation engine: YouCam/PerfectCorp skin-analysis + hair-type-detection → target tags,
 * then scores products by (matching tags count) × priority.
 *
 * INTELLIGENCE LAYER (v2):
 *   1. Exclusion rules  — blocks ingredient-risky products for sensitive/reactive profiles
 *   2. Goal boosting    — multiplies score for products matching the user's primary goal
 *   3. Sensitivity filtering — removes flagged products from the pool entirely
 *   4. Routine step ordering — enforces cleanser → toner → serum → moisturiser → SPF order
 *   5. Hairfall concern — Pakistan-specific: hard-water hairfall maps to repair/strength tags
 *
 * Returns 3–4 products per routine with fallback to SAFE_ROUTINE_* when score = 0.
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

export interface YouCamSkinInput {
  oiliness?: { ui_score?: number; raw_score?: number };
  moisture?: { ui_score?: number; raw_score?: number };
  acne?: { ui_score?: number; raw_score?: number };
  radiance?: { ui_score?: number; raw_score?: number };
  wrinkle?: { ui_score?: number; raw_score?: number };
  dark_circle?: { ui_score?: number; raw_score?: number };
  spot?: { ui_score?: number; raw_score?: number };
  skin_type?: string;
}

export interface YouCamHairInput {
  term?: string;
}

/** User preferences captured during onboarding. Read from sessionStorage key "glowai_onboarding". */
export interface UserPreferences {
  goal?: string;          // e.g. "Clear acne", "Brighter skin", "Deep hydration"
  sensitivities?: string[]; // e.g. ["retinol", "fragrance", "acids"]
  routineTime?: string;   // e.g. "Under 3 minutes", "5–10 minutes", "10+ minutes"
  hairConcern?: string;   // e.g. "Hairfall", "Frizz", "Dryness"
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCLUSION RULES
// Maps a sensitivity keyword to product tag/description fragments to exclude
// ─────────────────────────────────────────────────────────────────────────────

/**
 * If a user flags a sensitivity, any product whose description or name contains
 * ANY of these keywords is removed from their pool.
 */
const SENSITIVITY_EXCLUSION_MAP: Record<string, string[]> = {
  retinol:      ["retinol", "retin-a", "retinoid"],
  acids:        ["salicylic acid", "glycolic", "lactic acid", "aha", "bha", "acid", "exfoliat"],
  fragrance:    ["fragrance", "parfum", "scented"],
  vitamin_c:    ["vitamin c", "ascorbic acid"],
  niacinamide:  ["niacinamide"],
  spf:          ["spf", "sunscreen", "uv filter"],
};

/** Skin-type-based automatic exclusions — no user input required */
const AUTO_EXCLUSIONS: Record<string, string[]> = {
  // Sensitive skin should never get high-potency retinol or acid products
  sensitive: ["retinol", "salicylic acid", "glycolic", "aha", "bha"],
  // Dry skin should not get clay/charcoal stripping cleansers
  dry:       ["pure clay", "charcoal", "foam wash"],
};

function productMatchesSensitivity(product: Product, keywords: string[]): boolean {
  const searchText = `${product.name} ${product.description ?? ""}`.toLowerCase();
  return keywords.some((kw) => searchText.includes(kw.toLowerCase()));
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTINE STEP ORDER
// Used to sort the final selection into the correct application order
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_STEP_ORDER: Record<string, number> = {
  cleanser:        1,
  toner:           2,
  serum:           3,
  eye_cream:       4,
  moisturizer:     5,
  sunscreen:       6,
  mask:            7,
  other:           8,
  hair_shampoo:    1,
  hair_conditioner:2,
  hair_treatment:  3,
};

function sortByRoutineStep(recs: RecommendedProduct[]): RecommendedProduct[] {
  return [...recs].sort(
    (a, b) =>
      (CATEGORY_STEP_ORDER[a.product.category] ?? 9) -
      (CATEGORY_STEP_ORDER[b.product.category] ?? 9)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOAL BOOSTING
// Multiplies the base score for products that match the user's stated goal
// ─────────────────────────────────────────────────────────────────────────────

const GOAL_TAG_MAP: Record<string, string[]> = {
  "clear acne":       ["acne", "oily", "oiliness"],
  "brighter skin":    ["brightening", "dullness", "dark_spots"],
  "deep hydration":   ["hydration", "dry", "dryness"],
  "anti-ageing":      ["anti-aging", "fine_lines", "wrinkles", "mature"],
  "fade dark spots":  ["dark_spots", "brightening"],
  "less oiliness":    ["oily", "oiliness", "combination"],
  "hairfall":         ["hairfall", "breakage", "repair", "damaged"],
};

const GOAL_BOOST_MULTIPLIER = 1.4;

function goalBoostScore(product: Product, goal: string | undefined): number {
  if (!goal) return 1;
  const goalKey = goal.toLowerCase();
  const boostTags = GOAL_TAG_MAP[goalKey];
  if (!boostTags) return 1;
  const overlap = boostTags.filter((t) => product.tags.includes(t));
  return overlap.length > 0 ? GOAL_BOOST_MULTIPLIER : 1;
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
// 1. SKIN TAG MAPPING
// ─────────────────────────────────────────────────────────────────────────────

function buildSkinTargetTags(skin: YouCamSkinInput | null | undefined): string[] {
  const tags = new Set<string>();
  if (!skin) return Array.from(tags);

  const oilinessScore = skin.oiliness?.ui_score ?? skin.oiliness?.raw_score ?? 0;
  if (oilinessScore > 60) { tags.add("oily"); tags.add("oiliness"); }
  if (oilinessScore > 70) tags.add("acne");

  const moistureScore = skin.moisture?.ui_score ?? skin.moisture?.raw_score ?? 80;
  if (moistureScore < 60) { tags.add("dry"); tags.add("dryness"); tags.add("hydration"); }
  if (moistureScore < 40) tags.add("sensitive");

  const acneScore = skin.acne?.ui_score ?? skin.acne?.raw_score ?? 0;
  if (acneScore > 55) { tags.add("acne"); tags.add("oily"); }

  const radianceScore = skin.radiance?.ui_score ?? skin.radiance?.raw_score ?? 80;
  if (radianceScore < 60) { tags.add("dullness"); tags.add("brightening"); }
  if (radianceScore < 45) tags.add("dark_spots");

  const wrinkleScore = skin.wrinkle?.ui_score ?? skin.wrinkle?.raw_score ?? 0;
  if (wrinkleScore > 40) { tags.add("fine_lines"); tags.add("anti-aging"); }
  if (wrinkleScore > 65) { tags.add("wrinkles"); tags.add("mature"); }

  const spotScore = skin.spot?.ui_score ?? skin.spot?.raw_score ?? 0;
  if (spotScore > 40) { tags.add("dark_spots"); tags.add("brightening"); }

  const darkCircleScore = skin.dark_circle?.ui_score ?? skin.dark_circle?.raw_score ?? 0;
  if (darkCircleScore > 50) { tags.add("fine_lines"); tags.add("anti-aging"); }

  const skinType = (skin.skin_type ?? "").toLowerCase();
  if (skinType.includes("sensitive")) { tags.add("sensitive"); tags.add("gentle"); }
  if (skinType.includes("dry")) { tags.add("dry"); tags.add("dryness"); tags.add("hydration"); }
  if (skinType.includes("oily")) { tags.add("oily"); tags.add("oiliness"); }
  if (skinType.includes("combination")) { tags.add("combination"); tags.add("oily"); }
  if (skinType.includes("normal")) tags.add("all-skin");
  if (skinType.includes("mature")) { tags.add("mature"); tags.add("anti-aging"); }

  tags.add("pollution");
  tags.add("all-skin");

  return Array.from(tags);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HAIR TAG MAPPING — including Pakistan-specific hairfall concern
// ─────────────────────────────────────────────────────────────────────────────

function buildHairTargetTags(
  hair: YouCamHairInput | null | undefined,
  hairConcern?: string
): string[] {
  const tags = new Set<string>(["all-hair"]);
  if (!hair?.term && !hairConcern) return Array.from(tags);

  const term = (hair?.term ?? "").toLowerCase();

  if (term.includes("straight")) { tags.add("straight"); tags.add("shine"); }
  if (term.includes("wavy")) { tags.add("wavy"); tags.add("frizzy"); tags.add("frizz"); }
  if (term.includes("curl") || term.includes("coil") || term.includes("kinky")) {
    tags.add("curly"); tags.add("coily");
    tags.add("frizzy"); tags.add("frizz");
    tags.add("dry"); tags.add("dryness");
  }

  // Pakistan-specific: hard-water hairfall maps to repair/breakage tags
  const concern = (hairConcern ?? "").toLowerCase();
  if (concern.includes("hairfall") || concern.includes("thinning") || concern.includes("fall")) {
    tags.add("hairfall");
    tags.add("breakage");
    tags.add("repair");
    tags.add("damaged");
  }
  if (concern.includes("frizz")) { tags.add("frizzy"); tags.add("frizz"); }
  if (concern.includes("dry")) { tags.add("dry"); tags.add("dryness"); tags.add("hydration"); }
  if (concern.includes("dandruff") || concern.includes("scalp")) { tags.add("scalp"); }
  if (concern.includes("shine") || concern.includes("dull")) { tags.add("shine"); }

  return Array.from(tags);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SCORING with goal boost
// ─────────────────────────────────────────────────────────────────────────────

function scoreProduct(product: Product, targetTags: Set<string>, goal?: string): number {
  let matchCount = 0;
  for (const tag of product.tags) {
    if (targetTags.has(tag)) matchCount += 1;
  }
  return matchCount * product.priority * goalBoostScore(product, goal);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CATEGORY DEDUPLICATION
// ─────────────────────────────────────────────────────────────────────────────

const PAIRED_CATEGORIES = new Set(["hair_shampoo", "hair_conditioner"]);

function deduplicateByCategory(prods: Product[]): Product[] {
  const seenCategories = new Set<string>();
  const result: Product[] = [];
  for (const p of prods) {
    if (PAIRED_CATEGORIES.has(p.category)) {
      if (!seenCategories.has(p.category)) { seenCategories.add(p.category); result.push(p); }
    } else {
      if (!seenCategories.has(p.category)) { seenCategories.add(p.category); result.push(p); }
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. POOL FILTERING — applies exclusions before scoring
// ─────────────────────────────────────────────────────────────────────────────

function buildExclusionKeywords(
  skinTags: string[],
  prefs: UserPreferences
): string[] {
  const keywords: string[] = [];

  // Auto-exclusions from skin profile
  for (const tag of skinTags) {
    const autoKws = AUTO_EXCLUSIONS[tag];
    if (autoKws) keywords.push(...autoKws);
  }

  // User-stated sensitivities
  for (const s of (prefs.sensitivities ?? [])) {
    const mappedKws = SENSITIVITY_EXCLUSION_MAP[s.toLowerCase()];
    if (mappedKws) keywords.push(...mappedKws);
  }

  return [...new Set(keywords)]; // deduplicate
}

function filterPool(pool: Product[], exclusionKeywords: string[]): Product[] {
  if (exclusionKeywords.length === 0) return pool;
  return pool.filter((p) => !productMatchesSensitivity(p, exclusionKeywords));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SELECTION — score, filter, deduplicate, order
// ─────────────────────────────────────────────────────────────────────────────

function selectTopForRoutine(
  pool: Product[],
  targetTags: Set<string>,
  maxCount: number,
  userTagsArray: string[],
  prefs: UserPreferences,
  exclusionKeywords: string[]
): RecommendedProduct[] {
  const filteredPool = filterPool(pool, exclusionKeywords);

  const scored = filteredPool
    .map((p) => ({ p, score: scoreProduct(p, targetTags, prefs.goal) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  const deduplicated = deduplicateByCategory(scored.map((x) => x.p));
  const count = Math.min(maxCount, Math.max(MIN_PER_ROUTINE, deduplicated.length));
  const selected = deduplicated.slice(0, count);

  const recs = selected.map((p) => ({
    product: p,
    reason: generateReason(p.tags, userTagsArray, p.category),
  }));

  return sortByRoutineStep(recs);
}

function processFallback(
  ids: string[],
  maxCount: number,
  userTagsArray: string[]
): RecommendedProduct[] {
  const fallbackProducts = pickByIds(ids).slice(0, maxCount);
  const recs = fallbackProducts.map((p) => ({
    product: p,
    reason: generateReason(p.tags, userTagsArray, p.category),
  }));
  return sortByRoutineStep(recs);
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT TYPE
// ─────────────────────────────────────────────────────────────────────────────

export interface RecommendationEngineResult {
  analysisResults: {
    skinTags: string[];
    hairTags: string[];
    exclusionsApplied: string[];
  };
  recommendedRoutine: {
    day: RecommendedProduct[];
    night: RecommendedProduct[];
    hair: RecommendedProduct[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. POOL DEFINITIONS
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
// 8. MAIN ENTRY — YouCam raw input
// ─────────────────────────────────────────────────────────────────────────────

export function getRecommendedRoutine(
  skin?: YouCamSkinInput | null,
  hair?: YouCamHairInput | null,
  prefs: UserPreferences = {}
): RecommendationEngineResult {
  const skinTags = buildSkinTargetTags(skin ?? null);
  const hairTags = buildHairTargetTags(hair ?? null, prefs.hairConcern);
  const skinTagSet = new Set(skinTags);
  const hairTagSet = new Set(hairTags);
  const exclusionKeywords = buildExclusionKeywords(skinTags, prefs);

  const day = selectTopForRoutine(getDayPool(), skinTagSet, MAX_PER_ROUTINE, skinTags, prefs, exclusionKeywords);
  const night = selectTopForRoutine(getNightPool(), skinTagSet, MAX_PER_ROUTINE, skinTags, prefs, exclusionKeywords);
  const hairSelected = selectTopForRoutine(getHairPool(), hairTagSet, MAX_PER_ROUTINE, hairTags, prefs, []);

  return {
    analysisResults: { skinTags, hairTags, exclusionsApplied: exclusionKeywords },
    recommendedRoutine: {
      day: day.length > 0 ? day : processFallback(SAFE_ROUTINE_DAY_IDS, MAX_PER_ROUTINE, skinTags),
      night: night.length > 0 ? night : processFallback(SAFE_ROUTINE_NIGHT_IDS, MAX_PER_ROUTINE, skinTags),
      hair: hairSelected.length > 0 ? hairSelected : processFallback(SAFE_ROUTINE_HAIR_IDS, MAX_PER_ROUTINE, hairTags),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SECONDARY ENTRY — Normalised AnalysisResult + onboarding prefs
// ─────────────────────────────────────────────────────────────────────────────

function skinTagsFromAnalysisResult(face: AnalysisResult["face"]): string[] {
  const tags = new Set<string>(["all-skin", "pollution"]);
  const concerns = new Set<string>((face.concerns ?? []) as string[]);
  const skinType = (face.skinType ?? "").toLowerCase();

  if (face.hydrationScore < 60) { tags.add("dry"); tags.add("dryness"); tags.add("hydration"); }
  if (face.hydrationScore < 40) tags.add("sensitive");

  if (concerns.has("oiliness") || concerns.has("oily")) { tags.add("oily"); tags.add("oiliness"); }
  if (concerns.has("acne")) { tags.add("acne"); tags.add("oily"); }
  if (concerns.has("dryness") || concerns.has("dry")) { tags.add("dry"); tags.add("dryness"); tags.add("hydration"); }
  if (concerns.has("dullness")) { tags.add("dullness"); tags.add("brightening"); }
  if (concerns.has("dark_spots") || concerns.has("spots")) { tags.add("dark_spots"); tags.add("brightening"); }
  if (concerns.has("fine_lines")) { tags.add("fine_lines"); tags.add("anti-aging"); }
  if (concerns.has("wrinkles")) { tags.add("wrinkles"); tags.add("fine_lines"); tags.add("anti-aging"); tags.add("mature"); }
  if (concerns.has("sensitivity") || concerns.has("sensitive")) tags.add("sensitive");
  if (concerns.has("redness") || concerns.has("irritation")) { tags.add("sensitive"); tags.add("irritation"); tags.add("redness"); }

  if (skinType === "oily") { tags.add("oily"); tags.add("oiliness"); }
  if (skinType === "dry") { tags.add("dry"); tags.add("dryness"); tags.add("hydration"); }
  if (skinType === "combination") { tags.add("combination"); tags.add("oily"); }
  if (skinType === "sensitive") tags.add("sensitive");
  if (skinType === "mature") { tags.add("mature"); tags.add("anti-aging"); }
  if (skinType === "normal") tags.add("all-skin");

  return Array.from(tags);
}

function hairTagsFromAnalysisResult(
  hair: AnalysisResult["hair"],
  hairConcern?: string
): string[] {
  const tags = new Set<string>(["all-hair"]);
  const term = hair?.type ? String(hair.type).toLowerCase() : "";

  if (term.includes("straight")) { tags.add("straight"); tags.add("shine"); }
  if (term.includes("wavy")) { tags.add("wavy"); tags.add("frizzy"); tags.add("frizz"); }
  if (term.includes("curly") || term.includes("coily") || term.includes("kinky")) {
    tags.add("curly"); tags.add("coily");
    tags.add("frizzy"); tags.add("frizz");
    tags.add("dry"); tags.add("dryness");
  }

  // Pakistan-specific hairfall
  const concern = (hairConcern ?? "").toLowerCase();
  if (concern.includes("hairfall") || concern.includes("thinning") || concern.includes("fall")) {
    tags.add("hairfall"); tags.add("breakage"); tags.add("repair"); tags.add("damaged");
  }
  if (concern.includes("frizz")) { tags.add("frizzy"); tags.add("frizz"); }
  if (concern.includes("dry")) { tags.add("dry"); tags.add("dryness"); tags.add("hydration"); }

  return Array.from(tags);
}

/**
 * Load user preferences from sessionStorage (set during onboarding).
 * Call this on the client side; returns empty prefs on server.
 */
export function loadUserPreferences(): UserPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("glowai_onboarding");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      goal: typeof parsed.goal === "string" ? parsed.goal : undefined,
      sensitivities: Array.isArray(parsed.sensitivities) ? (parsed.sensitivities as string[]) : [],
      routineTime: typeof parsed.routineTime === "string" ? parsed.routineTime : undefined,
      hairConcern: typeof parsed.hairConcern === "string" ? parsed.hairConcern : undefined,
    };
  } catch { return {}; }
}

export function getRecommendedRoutineFromAnalysis(
  analysis: AnalysisResult,
  prefs: UserPreferences = {}
): RecommendationEngineResult {
  const skinTags = skinTagsFromAnalysisResult(analysis.face);
  const hairTags = analysis.hair
    ? hairTagsFromAnalysisResult(analysis.hair, prefs.hairConcern)
    : hairTagsFromAnalysisResult(null, prefs.hairConcern);

  const skinTagSet = new Set(skinTags);
  const hairTagSet = new Set(hairTags);
  const exclusionKeywords = buildExclusionKeywords(skinTags, prefs);

  const day = selectTopForRoutine(getDayPool(), skinTagSet, MAX_PER_ROUTINE, skinTags, prefs, exclusionKeywords);
  const night = selectTopForRoutine(getNightPool(), skinTagSet, MAX_PER_ROUTINE, skinTags, prefs, exclusionKeywords);
  const hairSelected =
    analysis.hair != null || (prefs.hairConcern ?? "") !== ""
      ? selectTopForRoutine(getHairPool(), hairTagSet, MAX_PER_ROUTINE, hairTags, prefs, [])
      : [];

  return {
    analysisResults: { skinTags, hairTags, exclusionsApplied: exclusionKeywords },
    recommendedRoutine: {
      day: day.length > 0 ? day : processFallback(SAFE_ROUTINE_DAY_IDS, MAX_PER_ROUTINE, skinTags),
      night: night.length > 0 ? night : processFallback(SAFE_ROUTINE_NIGHT_IDS, MAX_PER_ROUTINE, skinTags),
      hair:
        hairSelected.length > 0
          ? hairSelected
          : analysis.hair != null || (prefs.hairConcern ?? "") !== ""
            ? processFallback(SAFE_ROUTINE_HAIR_IDS, MAX_PER_ROUTINE, hairTags)
            : [],
    },
  };
}