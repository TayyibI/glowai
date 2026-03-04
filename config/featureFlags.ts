/**
 * Feature flags for GlowAI.
 * Use USE_MOCK_ANALYSIS = true for MVP; switch to false when Perfect Corp (or other vendor) is integrated.
 */

export const featureFlags = {
  /** When true, analysisService uses mock adapter; when false, uses Perfect Corp adapter */
  USE_MOCK_ANALYSIS: true,
} as const;

export type FeatureFlags = typeof featureFlags;
