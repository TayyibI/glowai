/**
 * Feature flags for GlowAI.
 * `USE_MOCK_ANALYSIS`: when true, `/api/analyze-beauty` returns mock data immediately (`mockReason: "feature_flag"`).
 */

export const featureFlags = {
  USE_MOCK_ANALYSIS: false,
} as const;

export type FeatureFlags = typeof featureFlags;
