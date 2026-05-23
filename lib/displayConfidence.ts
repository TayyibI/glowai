/**
 * Confidence values shown on the analysis report are floored so the UI never
 * displays an AI accuracy score at or below 90%.
 */

/** Minimum displayed confidence as a 0–1 score (strictly above 90%). */
export const MIN_DISPLAY_CONFIDENCE_01 = 0.91;

/** Minimum shown as an integer percent (91% … 100%). */
export const MIN_DISPLAY_CONFIDENCE_PERCENT = 91;

/** Clamp model confidence for display and downstream normalization. */
export function clampDisplayConfidence01(conf: number): number {
  if (!Number.isFinite(conf)) return MIN_DISPLAY_CONFIDENCE_01;
  return Math.min(1, Math.max(MIN_DISPLAY_CONFIDENCE_01, conf));
}

/** Integer percent for labels (never below 91). */
export function confidencePercentDisplayed(conf01: number): number {
  return Math.max(
    MIN_DISPLAY_CONFIDENCE_PERCENT,
    Math.min(100, Math.round(clampDisplayConfidence01(conf01) * 100))
  );
}
