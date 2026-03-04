# GlowAI – Implementation Notes (User Review)

## 1. Perfect Corp integration (future)

- **Location**: `services/perfectCorpAdapter.ts` is the single place for Perfect Corp API calls.
- **Raw types**: `types/PerfectCorpRaw.ts` defines placeholder request/response shapes. Replace with actual SDK/API types when integrating (e.g. from [Perfect Corp](https://www.perfectcorp.com/) Beauty AI docs).
- **Environment**: Add `PERFECT_CORP_API_KEY` and `PERFECT_CORP_BASE_URL` (or equivalent) in this adapter; do not hardcode secrets.
- **Switch**: Set `USE_MOCK_ANALYSIS: false` in `config/featureFlags.ts` when going live.
- **No-face handling**: When the vendor returns “no face detected”, throw an error with `code: 'NO_FACE'` so the app shows the retry message (see `app/page.tsx` and `components/FaceDetectionError.tsx`).
- **Hair**: If the vendor supports a separate hair endpoint or payload, pass the optional `hairImage` from the UI; the normalizer already supports `hair: null` when no hair data is returned.

## 2. Recommendation rules (business verification)

- **Input**: Only the standardized `AnalysisResult` (face + optional hair) is used. No vendor-specific fields.
- **Matching**: Products are matched by **tags** derived from:
  - Skin type (e.g. `dry`, `oily`, `combination`)
  - Skin concerns (e.g. `acne`, `dark_spots`, `fine_lines`, `sensitivity`)
  - Always including `all-skin` so generic products can match.
- **Scoring**: For each product, score = (number of tag overlaps) × 1000 + priority. Higher score wins. When multiple products match, we pick **one product per category** (e.g. one serum, one moisturizer) up to `MAX_DAY_PRODUCTS` / `MAX_NIGHT_PRODUCTS`, then sort by priority.
- **Fallback**: If no product has any tag match (score ≤ 1000), we use the **Safe Routine** IDs in `data/products.ts` (`SAFE_ROUTINE_DAY_IDS`, `SAFE_ROUTINE_NIGHT_IDS`). So we always return a valid Day and Night routine.
- **Hair**: Hair products are only added when `analysis.hair !== null` (i.e. user provided a hair image or hair was visible). We use `SAFE_ROUTINE_HAIR_IDS` for hair; no concern-based rules for hair in this MVP.
- **Guarantee**: Day and Night arrays are never empty; hair can be an empty array.

If your business rules require different logic (e.g. multiple serums, different priorities, or hair-by-type rules), the place to change is `logic/recommendationLogic.ts` and optionally `data/products.ts` (tags and priority values).

## 3. Manual verification checklist (MVP)

| Item | How to verify |
|------|----------------|
| Privacy modal | Appears on first load; blocks content until “I understand, continue”. After accept, reload and confirm modal does not appear. |
| Image capture | Use camera to take a selfie; optionally add a second photo for hair. If camera is denied, confirm fallback to file upload is offered. |
| Analysis | After capture, mock analysis runs; result shows skin tone/type, concerns, and optional hair. |
| Recommendations | Day and Night routines are shown; if mock has concerns (e.g. dullness, fine_lines), concern-specific products may appear; otherwise Safe Routine. |
| Responsiveness | Test on a narrow viewport (mobile) and desktop; layout remains usable. |
| No face | (When Perfect Corp is integrated) Simulate or trigger “no face” response; confirm retry message and “Try again” work. |
| Low confidence | Mock returns high confidence; to test disclaimer, temporarily lower confidence in `mockAnalysisAdapter` or normalizer. |
| No hair | Submit only a face image (skip hair); confirm hair section is not shown in recommendations. |

## 4. Optional: unit tests for recommendation logic

If time permits, add tests (e.g. Jest or Vitest) for `getRecommendations` in `logic/recommendationLogic.ts`:

- Analysis with no concerns → Safe Routine day/night.
- Analysis with e.g. `acne` concern → day routine includes acne-related product when tagged.
- Analysis with `hair: null` → `hair` array is empty.
- Analysis with `hair` set → `hair` array is non-empty (safe hair IDs).
