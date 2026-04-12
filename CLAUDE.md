# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run start    # Run production build locally
npm run lint     # ESLint check
```

No test suite is configured.

## Architecture Overview

GlowAI is a mobile-first Next.js 14 (App Router) beauty-tech app that captures selfies, analyzes skin/hair, and recommends L'Oréal Paris products.

### Core Data Flow

```
Camera/Upload → API Route → PerfectCorp Adapter → Normalizer → AnalysisResult
                                                                      ↓
                                                        Recommendation Engine
                                                        (tag-based scoring)
                                                                      ↓
                                                              UI Display
```

### Key Layers

- **`app/api/analyze-skin/`** and **`app/api/analyze-hair/`** — Server-side API routes that call PerfectCorp (or mock). API key never reaches the client.
- **`services/perfectCorpAdapter.ts`** — Single integration point for Perfect Corp API: uploads images, creates tasks, polls for results.
- **`services/analysisNormalizer.ts`** — Converts raw PerfectCorp vendor responses into the app's standard `AnalysisResult` shape.
- **`lib/recommendationEngine.ts`** — Tag-based scoring: maps analysis attributes to product tags, scores each product by `matching_tag_count × priority`, deduplicates by category.
- **`lib/benefitExplainer.ts`** — Maps user concerns to human-readable benefit reasons shown in recommendations.
- **`data/products.ts`** — Static catalogue of ~20 L'Oréal Paris skin + 10 Elvive hair products with tags, priority weights, and `purchaseLink` fields.
- **`config/featureFlags.ts`** — `USE_MOCK_ANALYSIS` boolean toggles between real API and mock responses (mock is default for MVP).

### Scanner Component State Machine

`components/Scanner.tsx` is the central UI orchestrator. It owns all state (no global store) and progresses through: `onboarding → capturing → upload → analyzing → results`.

### Type Boundaries

- `types/AnalysisResult.ts` — App-internal standardized shape (never coupled to vendor)
- `types/PerfectCorpRaw.ts` — Vendor response shape (only used in `analysisNormalizer.ts`)
- `types/Product.ts` — Product and routine interfaces

## Environment Variables

```
PERFECTCORP_API_KEY=        # Required for real analysis; omit to use mock
PERFECTCORP_BASE_URL=       # Optional; defaults to https://api.perfectcorp.com
```

With no `PERFECTCORP_API_KEY` set (or `USE_MOCK_ANALYSIS=true` in `config/featureFlags.ts`), all analysis routes return deterministic mock data with a 1.5s artificial delay.

## Design System

Tailwind config enforces a "Quiet Luxury" aesthetic: no border-radius (`0px`), no box shadows, flat color palette (alabaster, charcoal, bordeaux, champagne), glass-blur effects (`backdrop-blur-[12px/20px]`). Do not add rounded corners or drop shadows — they violate the design intent.

Fonts: Inter (sans) via `--font-inter`, Playfair Display (serif) via `--font-playfair`.

## Recommendation Engine

Products in `data/products.ts` are tagged semantically (e.g., `["oily", "acne", "brightening"]`). When adding or editing products, the `priority` field (10–20) controls relative ranking among tied scores. `routineSlot` (`"day"`, `"night"`, `"both"`, `"hair"`) determines which routine a product appears in. Fallback safe-routines are defined as ID arrays at the bottom of `data/products.ts`.

## Mobile Detection

`hooks/useDeviceDetect.ts` includes a hydration guard — always check `hasMounted` before reading `isMobile` to avoid SSR mismatches.
