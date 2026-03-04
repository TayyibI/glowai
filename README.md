# GlowAI

Mobile-first beauty-tech web app: capture face/hair images, get mocked analysis, and product recommendations with strict separation of concerns (UI, Analysis, API, Products).

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Accept the privacy modal, then use camera or file upload to capture a selfie; optionally add a second hair image. Mock analysis runs and Day/Night (and optional Hair) routines are shown.

## Project structure

| Path | Purpose |
|------|--------|
| `app/` | Pages and layouts (App Router) |
| `components/` | UI (PrivacyModal, ImageCapture, AnalysisDisplay, RecommendationList, FaceDetectionError) |
| `types/` | TypeScript interfaces (AnalysisResult, Product, PerfectCorpRaw) |
| `services/` | Business logic: `analysisService` (orchestrator), `perfectCorpAdapter` (vendor, mocked), `analysisNormalizer`, `mockAnalysisAdapter` |
| `config/` | Feature flags (`USE_MOCK_ANALYSIS`) |
| `data/` | Static products and safe-routine IDs |
| `logic/` | Recommendation engine (`recommendationLogic.ts`) |

## Analysis pipeline

- **analysisService**: Orchestrates analysis; uses mock or Perfect Corp adapter from `config/featureFlags.ts`.
- **perfectCorpAdapter**: Vendor API (mocked). Replace with real Perfect Corp calls when integrating.
- **analysisNormalizer**: Maps raw vendor response → `AnalysisResult`. UI and recommendation logic consume only `AnalysisResult`.

## Perfect Corp integration (future)

- Types for raw responses: `types/PerfectCorpRaw.ts` (replace with real SDK types).
- Single integration point: `services/perfectCorpAdapter.ts`. Add env vars for API key/base URL there.
- Set `USE_MOCK_ANALYSIS: false` in `config/featureFlags.ts` when going live with Perfect Corp.
- Map vendor “no face” (or similar) to throwing an error with `code: 'NO_FACE'` so the UI can show the face-detection retry message.

## Recommendation rules

- Match products by analysis tags (skin type, concerns). Sort by priority; limit counts per routine.
- If no rules match → predefined “Popular / Safe Routine” (see `data/products.ts`: `SAFE_ROUTINE_DAY_IDS`, `SAFE_ROUTINE_NIGHT_IDS`, `SAFE_ROUTINE_HAIR_IDS`).
- Guarantee: always returns a valid Day & Night routine; hair products only when `analysis.hair !== null`.

## Manual verification (MVP)

1. **Privacy modal**: Appears on load; blocks until accepted.
2. **Image capture**: Camera works; fallback to file upload if camera unavailable.
3. **Analysis**: Mock returns expected result (skin tone/type, concerns; optional hair).
4. **Recommendations**: Correct products for mock result; safe routine when no match.
5. **Responsiveness**: Layout on mobile and desktop.
6. **Edge cases**: No face → show retry (when adapter throws `NO_FACE`); low confidence → disclaimer + gentler suggestions; no hair → skip hair block.

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm run start` – run production build
- `npm run lint` – ESLint
