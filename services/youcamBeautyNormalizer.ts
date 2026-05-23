/**
 * Maps YouCam analyze-beauty API payloads (skin + hair task `data` blobs) to AnalysisResult.
 * Handles format=json skin output (`results.output[]`) and hair-type-detection shapes.
 */

import { clampDisplayConfidence01 } from "@/lib/displayConfidence";
import type { AnalysisResult, FaceAnalysis, HairAnalysis, SkinConcern, SkinToneCategory, SkinTypeCategory } from "@/types/AnalysisResult";

type OutputRow = {
  type?: string;
  ui_score?: number;
  raw_score?: number;
  label?: string;
  value?: string;
  term?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Pull per-metric rows from various YouCam JSON layouts */
function collectSkinOutputRows(skinRaw: unknown): OutputRow[] {
  const root = asRecord(skinRaw);
  if (!root) return [];

  const results = asRecord(root.results);
  if (results) {
    const out = results.output;
    if (Array.isArray(out)) return out as OutputRow[];
    const nested = asRecord(results.results);
    if (nested?.output && Array.isArray(nested.output)) return nested.output as OutputRow[];
  }

  const out2 = root.output;
  if (Array.isArray(out2)) return out2 as OutputRow[];

  return [];
}

function scoreFor(rows: OutputRow[], type: string): { ui?: number; raw?: number } {
  const t = type.toLowerCase();
  const row = rows.find((r) => (r.type ?? "").toLowerCase() === t);
  return { ui: row?.ui_score, raw: row?.raw_score };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.7;
  return Math.min(1, Math.max(0, n));
}

function mapSkinTypeLabel(raw: string | undefined): SkinTypeCategory {
  if (!raw) return "normal";
  const s = raw.toLowerCase();
  if (s.includes("oil")) return "oily";
  if (s.includes("dry")) return "dry";
  if (s.includes("comb")) return "combination";
  if (s.includes("sens")) return "normal";
  if (s.includes("normal")) return "normal";
  return "combination";
}

function deriveConcerns(rows: OutputRow[]): SkinConcern[] {
  const concerns = new Set<SkinConcern>();

  const g = (name: string) => scoreFor(rows, name).ui ?? scoreFor(rows, name).raw ?? undefined;

  const oil = g("oiliness");
  if (oil !== undefined && oil > 60) concerns.add("oiliness");

  const acne = g("acne");
  if (acne !== undefined && acne > 55) concerns.add("acne");

  const rad = g("radiance");
  if (rad !== undefined && rad < 60) concerns.add("dullness");
  if (rad !== undefined && rad < 45) concerns.add("dark_spots");

  const wr = g("wrinkle");
  if (wr !== undefined && wr > 40) concerns.add("fine_lines");

  const spot = g("age_spot");
  if (spot !== undefined && spot > 40) concerns.add("dark_spots");

  const dc = g("dark_circle_v2") ?? g("dark_circle");
  if (dc !== undefined && dc > 50) concerns.add("fine_lines");

  const red = g("redness");
  if (red !== undefined && red > 55) concerns.add("redness");

  const pore = g("pore");
  if (pore !== undefined && pore > 55) concerns.add("pores");

  const tex = g("texture");
  if (tex !== undefined && tex > 55) concerns.add("fine_lines");

  const skinTypeRow = rows.find((r) => (r.type ?? "").toLowerCase() === "skin_type");
  const stLabel =
    typeof skinTypeRow?.label === "string"
      ? skinTypeRow.label
      : typeof skinTypeRow?.value === "string"
        ? skinTypeRow.value
        : typeof skinTypeRow?.term === "string"
          ? skinTypeRow.term
          : "";
  if (stLabel.toLowerCase().includes("sens")) concerns.add("sensitivity");

  return Array.from(concerns);
}

function skinToneFromRows(rows: OutputRow[]): SkinToneCategory {
  const rad = scoreFor(rows, "radiance").ui;
  if (rad === undefined) return "medium";
  if (rad >= 75) return "light";
  if (rad >= 55) return "medium";
  return "tan";
}

function extractHairTermAndConfidence(hairRaw: unknown): { term: string; confidence: number } {
  const root = asRecord(hairRaw);
  if (!root) return { term: "", confidence: 0.65 };

  const tryNode = (node: unknown): { term: string; confidence: number } | null => {
    const o = asRecord(node);
    if (!o) return null;
    const ht = asRecord(o.hair_type) ?? asRecord(o.hairType);
    const term =
      typeof ht?.term === "string"
        ? ht.term
        : typeof o.term === "string"
          ? o.term
          : typeof o.label === "string"
            ? o.label
            : "";
    const conf =
      typeof ht?.confidence === "number"
        ? ht.confidence
        : typeof o.confidence === "number"
          ? o.confidence
          : 0.75;
    if (term) return { term, confidence: clamp01(conf) };
    return null;
  };

  const direct = tryNode(root);
  if (direct) return direct;

  const res = asRecord(root.results);
  if (res) {
    const nested = tryNode(res);
    if (nested) return nested;
  }

  return { term: "", confidence: 0.65 };
}

function mapHairTypeTerm(term: string): HairAnalysis["type"] {
  const t = term.toLowerCase();
  if (t.includes("straight")) return "straight";
  if (t.includes("wavy")) return "wavy";
  if (t.includes("curl") || t.includes("coil") || t.includes("kink")) return "curly";
  return "unknown";
}

function mapHairColor(_term: string): HairAnalysis["color"] {
  return "dark_brown";
}

/**
 * Normalizes combined `/api/analyze-beauty` payloads into AnalysisResult for UI + recommendationEngine.
 */
export function normalizeYouCamBeautyToAnalysisResult(skinRaw: unknown, hairRaw: unknown): AnalysisResult {
  const rows = collectSkinOutputRows(skinRaw);

  const moistureUi = scoreFor(rows, "moisture").ui ?? scoreFor(rows, "moisture").raw ?? 72;
  const hydrationScore = Math.round(Math.min(100, Math.max(0, moistureUi)));

  const hydrationLevel: FaceAnalysis["hydrationLevel"] =
    hydrationScore >= 81 ? "Excellent" :
      hydrationScore >= 61 ? "Good" :
        hydrationScore >= 41 ? "Moderate" : "Low";

  const skinTypeRow = rows.find((r) => (r.type ?? "").toLowerCase() === "skin_type");
  const skinTypeLabel =
    typeof skinTypeRow?.label === "string"
      ? skinTypeRow.label
      : typeof skinTypeRow?.value === "string"
        ? skinTypeRow.value
        : "";
  const skinType: SkinTypeCategory = mapSkinTypeLabel(skinTypeLabel);

  let concerns = deriveConcerns(rows);
  if (hydrationScore < 45) concerns.push("dullness");
  concerns = Array.from(new Set(concerns));

  const face: FaceAnalysis = {
    skinTone: skinToneFromRows(rows),
    skinType,
    concerns,
    hydrationScore,
    hydrationLevel,
    confidence: clampDisplayConfidence01(0.82),
  };

  const { term, confidence: hairConfRaw } = extractHairTermAndConfidence(hairRaw);
  let hair: HairAnalysis | null = null;
  if (term.trim()) {
    hair = {
      color: mapHairColor(term),
      type: mapHairTypeTerm(term),
      confidence: clampDisplayConfidence01(hairConfRaw),
    };
  }

  const faceConf = face.confidence;
  const overallConfidence = clampDisplayConfidence01(
    hair ? Math.min(faceConf, hair.confidence) : faceConf
  );

  return { face, hair, overallConfidence };
}
