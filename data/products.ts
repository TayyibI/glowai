/**
 * Static product catalog for GlowAI - French brand products (MVP)
 * L'Oréal Paris (skin), L'Oréal Elvive (hair) — 40 products
 *
 * Tag vocabulary used by the recommendation engine:
 *
 * SKIN CONCERN TAGS   → oily | oiliness | acne | dry | dryness | hydration |
 *                        dullness | brightening | dark_spots | fine_lines |
 *                        wrinkles | anti-aging | sensitive | irritation |
 *                        redness | pollution | combination | mature
 *
 * HAIR CONCERN TAGS   → all-hair | hairfall | damaged | repair | frizzy | frizz |
 *                        dry | dryness | fine | thin | volume | curly | coily |
 *                        wavy | straight | shine | breakage | color_treated
 *
 * ROUTINE SLOTS       → day | night | both | hair
 *
 * PRIORITY SCALE      → 10 (low) → 20 (hero / most effective for tag)
 *
 * Image filenames follow the pattern: {id}.jpg
 * Upload to: gs://product-imgs-glowai/{id}.jpg
 * See IMAGE UPLOAD GUIDE at bottom of this file.
 */

import type { Product } from "@/types/Product";

export const products: Product[] = [

  // ====================== L'ORÉAL PARIS — SKIN (20) ======================
  // Revitalift, Hydra Genius, Pure Clay, Age Perfect, UV Defender ranges

  // --- CLEANSERS (6) ---
  {
    id: "loreal-001",
    name: "Pure Clay Purifying Face Wash 150ml",
    category: "cleanser",
    priority: 20,
    tags: ["oily", "combination", "oiliness", "acne", "dullness"],
    routine: "both",
    purchaseLink: "https://www.lorealparis.com.au/pure-clay-face-wash-purify-mattify",
    description:
      "Kaolin and bentonite clay cleanser that deeply purifies pores, controls excess oil, and leaves skin matte and refreshed.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-001.jpg",
  },
  {
    id: "loreal-002",
    name: "Pure Clay Brightening Face Wash 150ml",
    category: "cleanser",
    priority: 18,
    tags: ["dullness", "brightening", "all-skin", "dark_spots"],
    routine: "both",
    purchaseLink: "https://www.lorealparis.com.au/pure-clay-face-wash-brighten-glow",
    description:
      "Yuzu lemon-infused clay cleanser that gently exfoliates dead cells to instantly reveal a brighter, more even complexion.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-002.jpg",
  },
  {
    id: "loreal-003",
    name: "Micellar Water 3-in-1 400ml",
    category: "cleanser",
    priority: 12,
    tags: ["sensitive", "gentle", "all-skin", "dryness"],
    routine: "both",
    purchaseLink: "https://www.lorealparis.com.au/micellar-cleansing-water-normal-to-dry-skin",
    description:
      "No-rinse micellar water that dissolves makeup, dirt, and impurities without stripping the skin's natural moisture barrier.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-003.jpg",
  },
  {
    id: "loreal-004",
    name: "Pure Clay Anti-Pore Face Wash 150ml",
    category: "cleanser",
    priority: 18,
    tags: ["oily", "combination", "oiliness", "acne"],
    routine: "both",
    purchaseLink: "https://www.lorealparis.com.au/pure-clay-face-wash-minimise-pores",
    description:
      "Three-clay and eucalyptus formula that tightens visible pores and prevents acne-causing congestion with every wash.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-004.jpg",
  },
  {
    id: "loreal-005",
    name: "Age Perfect Cleansing Milk 200ml",
    category: "cleanser",
    priority: 15,
    tags: ["mature", "dry", "dryness", "sensitive", "anti-aging"],
    routine: "both",
    purchaseLink: "https://www.lorealparis.com.au/age-perfect-cleansing-milk",
    description:
      "Gentle cleansing milk enriched with manuka honey that nourishes and softens mature or dry skin while removing impurities.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-005.jpg",
  },
  {
    id: "loreal-006",
    name: "Revitalift Micro-Peeling Purifying Gel Wash 150ml",
    category: "cleanser",
    priority: 16,
    tags: ["fine_lines", "dullness", "brightening", "anti-aging", "all-skin"],
    routine: "both",
    purchaseLink: "https://www.lorealparis.com.au/revitalift-micro-peeling-purifying-gel-wash",
    description:
      "LHA-infused gel wash that micro-exfoliates daily to visibly smooth fine lines and restore radiance without irritation.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-006.jpg",
  },

  // --- SERUMS (4) ---
  {
    id: "loreal-007",
    name: "Revitalift 1.5% Pure Hyaluronic Acid Serum 30ml",
    category: "serum",
    priority: 20,
    tags: ["dry", "dryness", "hydration", "fine_lines", "all-skin"],
    routine: "day",
    purchaseLink: "https://www.lorealparis.com.au/revitalift-1-5-pure-hyaluronic-acid-serum",
    description:
      "Dual-concentration hyaluronic acid serum that plumps skin surface and deep layers, visibly reducing fine lines in 7 days.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-007.jpg",
  },
  {
    id: "loreal-008",
    name: "Revitalift 10% Pure Vitamin C Serum 30ml",
    category: "serum",
    priority: 20,
    tags: ["dullness", "brightening", "dark_spots", "anti-aging", "all-skin"],
    routine: "day",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/clinical/12-percent-vitamin-c-serum",
    description:
      "Stabilised 10% vitamin C serum that fades dark spots and boosts radiance with clinically proven brightening results in 4 weeks.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-008.jpg",
  },
  {
    id: "loreal-009",
    name: "Revitalift Laser Retinol Night Serum 30ml",
    category: "serum",
    priority: 20,
    tags: ["fine_lines", "wrinkles", "anti-aging", "mature", "dark_spots"],
    routine: "night",
    purchaseLink: "https://www.lorealparis.com.au/revitalift-laser-pure-retinol-night-serum",
    description:
      "0.2% pure retinol serum that accelerates cell renewal overnight, visibly reducing deep wrinkles and pigmentation marks.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-009.jpg",
  },
  {
    id: "loreal-010",
    name: "Glycolic Bright Instant Glowing Serum 30ml",
    category: "serum",
    priority: 18,
    tags: ["dullness", "brightening", "dark_spots", "oily", "combination"],
    routine: "day",
    purchaseLink: "https://www.lorealparis.com.au/glycolic-bright-instant-glowing-serum",
    description:
      "Glycolic acid serum that resurfaces skin texture and fades post-acne marks for a visible glow from the first application.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-010.jpg",
  },

  // --- DAY MOISTURISERS (4) ---
  {
    id: "loreal-011",
    name: "Hydra Genius Aloe Water Day Moisturiser 70ml",
    category: "moisturizer",
    priority: 18,
    tags: ["dry", "dryness", "hydration", "sensitive", "all-skin"],
    routine: "day",
    purchaseLink: "https://www.lorealparis.com.au/hydra-genius-the-liquid-care-normal-to-dry-skin",
    description:
      "Hyaluronic acid and aloe vera liquid moisturiser that provides 72-hour continuous hydration, ideal for dry and sensitive skin types.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-011.jpg",
  },
  {
    id: "loreal-012",
    name: "Revitalift Laser SPF20 Day Cream 50ml",
    category: "moisturizer",
    priority: 20,
    tags: ["fine_lines", "wrinkles", "anti-aging", "mature", "brightening"],
    routine: "day",
    purchaseLink: "https://www.lorealparis.com.au/revitalift-laser-renew-advanced-anti-aging-cream-spf20",
    description:
      "Pro-retinol and vitamin C day cream with SPF20 that targets deep wrinkles, firms skin, and protects against photoageing.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-012.jpg",
  },
  {
    id: "loreal-013",
    name: "UV Defender Sunscreen Moisturiser SPF50+ 40ml",
    category: "moisturizer",
    priority: 18,
    tags: ["all-skin", "pollution", "dark_spots", "anti-aging"],
    routine: "day",
    purchaseLink: "https://www.lorealparis.com.au/uv-defender-sunscreen-moisturiser-anti-dullness-spf50",
    description:
      "Broad-spectrum SPF50+ daily moisturiser with UVA/UVB and pollution filters that prevents dark spot formation and photoageing.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-013.jpg",
  },
  {
    id: "loreal-014",
    name: "Pure Clay Mattifying Day Moisturiser 50ml",
    category: "moisturizer",
    priority: 18,
    tags: ["oily", "combination", "oiliness", "acne"],
    routine: "day",
    purchaseLink: "https://www.lorealparis.com.au/pure-clay-moisturiser-mattify-control-shine",
    description:
      "Lightweight clay moisturiser that controls shine for up to 24 hours without clogging pores, formulated for oily and combination skin.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-014.jpg",
  },

  // --- NIGHT MOISTURISERS (3) ---
  {
    id: "loreal-015",
    name: "Age Perfect Cell Renewal Night Cream 50ml",
    category: "moisturizer",
    priority: 20,
    tags: ["mature", "fine_lines", "wrinkles", "anti-aging", "dullness"],
    routine: "night",
    purchaseLink: "https://www.lorealparis.com.au/age-perfect-cell-renewal-rejuvenating-night-cream",
    description:
      "Peony extract and LHA night cream that stimulates cell renewal, visibly re-densifies skin and reduces age spots by morning.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-015.jpg",
  },
  {
    id: "loreal-016",
    name: "Hydra Genius Sleeping Cream Night Moisturiser 50ml",
    category: "moisturizer",
    priority: 18,
    tags: ["dry", "dryness", "hydration", "fine_lines", "sensitive"],
    routine: "night",
    purchaseLink: "https://www.lorealparis.com.au/hydra-genius-sleeping-cream",
    description:
      "Overnight hyaluronic acid sleeping cream that intensively replenishes moisture lost during the day for plumper skin by morning.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-016.jpg",
  },
  {
    id: "loreal-017",
    name: "Revitalift Triple Power Night Cream 50ml",
    category: "moisturizer",
    priority: 18,
    tags: ["anti-aging", "fine_lines", "wrinkles", "mature", "hydration"],
    routine: "night",
    purchaseLink: "https://www.lorealparis.com.au/revitalift-triple-power-anti-aging-overnight-cream",
    description:
      "Pro-retinol, vitamin C, and hyaluronic acid night cream that simultaneously firms, brightens and hydrates for comprehensive overnight repair.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-017.jpg",
  },

  // --- EYE CREAM (1) ---
  {
    id: "loreal-018",
    name: "Revitalift Laser Renew Eye Cream 15ml",
    category: "eye_cream",
    priority: 15,
    tags: ["fine_lines", "anti-aging", "mature", "dark_spots"],
    routine: "both",
    purchaseLink: "https://www.lorealparis.com.au/revitalift-laser-renew-eye-cream",
    description:
      "Pro-retinol and caffeine eye cream that targets crow's feet, puffiness, and under-eye dark circles in the delicate eye contour area.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-018.jpg",
  },

  // --- TONER/ESSENCE (1) ---
  {
    id: "loreal-019",
    name: "Glycolic Bright Instant Glowing Toner 130ml",
    category: "toner",
    priority: 15,
    tags: ["dullness", "brightening", "dark_spots", "oily", "combination"],
    routine: "both",
    purchaseLink: "https://www.lorealparis.com.au/glycolic-bright-glowing-toner",
    description:
      "Glycolic acid toner that sweeps away residue after cleansing, refines pores, and primes skin for better serum absorption.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-019.jpg",
  },

  // --- MASK (1) ---
  {
    id: "loreal-020",
    name: "Pure Clay Anti-Pollution Detox Mask 50ml",
    category: "mask",
    priority: 14,
    tags: ["oily", "combination", "dullness", "pollution", "all-skin"],
    routine: "both",
    purchaseLink: "https://www.lorealparis.com.au/pure-clay-face-mask-detox-charcoal",
    description:
      "Activated charcoal and kaolin clay mask that draws out pollution particles and toxins from deep within pores, used 2–3 times weekly.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-020.jpg",
  },

  // ====================== L'ORÉAL ELVIVE — HAIR (20) ======================
  // Extraordinary Oil, Total Repair 5, Color Vive, Hyaluron Plump, Dream Long ranges

  // --- EXTRAORDINARY OIL (4) ---
  {
    id: "elvive-001",
    name: "Extraordinary Oil Shampoo 400ml",
    category: "hair_shampoo",
    priority: 18,
    tags: ["all-hair", "dry", "dryness", "frizzy", "frizz", "shine"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-extraordinary-oil-shampoo",
    description:
      "6 rare flower oil blend shampoo that nourishes dry, frizzy hair from root to tip, leaving it silky, shiny, and frizz-free.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-001.jpg",
  },
  {
    id: "elvive-002",
    name: "Extraordinary Oil Conditioner 300ml",
    category: "hair_conditioner",
    priority: 18,
    tags: ["all-hair", "dry", "dryness", "frizzy", "frizz", "shine"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-extraordinary-oil-conditioner",
    description:
      "Paired conditioner to the Extraordinary Oil shampoo that seals in moisture, controls frizz, and boosts mirror-like shine.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-002.jpg",
  },
  {
    id: "elvive-003",
    name: "Extraordinary Oil Hair Treatment Serum 100ml",
    category: "hair_treatment",
    priority: 20,
    tags: ["all-hair", "frizzy", "frizz", "dry", "dryness", "shine", "damaged"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-extraordinary-oil-hair-serum",
    description:
      "Leave-in serum with Camellia oil that tames frizz instantly, adds intense shine, and protects hair from heat styling damage.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-003.jpg",
  },
  {
    id: "elvive-004",
    name: "Extraordinary Oil Curls Shampoo 400ml",
    category: "hair_shampoo",
    priority: 20,
    tags: ["curly", "coily", "wavy", "frizzy", "frizz", "dry", "dryness"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-extraordinary-oil-curls-shampoo",
    description:
      "Coconut oil-enriched shampoo specifically developed for curly and coily hair to define curls, eliminate frizz, and restore moisture.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-004.jpg",
  },

  // --- TOTAL REPAIR 5 (4) ---
  {
    id: "elvive-005",
    name: "Total Repair 5 Shampoo 400ml",
    category: "hair_shampoo",
    priority: 20,
    tags: ["damaged", "repair", "breakage", "dry", "frizzy", "frizz"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-total-repair-5-shampoo",
    description:
      "Ceramide and protein shampoo that targets 5 damage signs — breakage, dryness, dullness, roughness, and split ends — in one wash.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-005.jpg",
  },
  {
    id: "elvive-006",
    name: "Total Repair 5 Conditioner 300ml",
    category: "hair_conditioner",
    priority: 20,
    tags: ["damaged", "repair", "breakage", "dry", "frizzy"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-total-repair-5-conditioner",
    description:
      "Deep conditioning ceramide treatment that rebuilds damaged hair fibre structure and prevents future breakage after each use.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-006.jpg",
  },
  {
    id: "elvive-007",
    name: "Total Repair 5 Extreme Balm 200ml",
    category: "hair_treatment",
    priority: 18,
    tags: ["damaged", "repair", "breakage", "dry", "dryness"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-total-repair-5-extreme-balm",
    description:
      "Intense overnight repair balm for severely damaged ends that restores strength and elasticity without weighing hair down.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-007.jpg",
  },
  {
    id: "elvive-008",
    name: "Total Repair 5 Renewing Mask 300ml",
    category: "hair_treatment",
    priority: 18,
    tags: ["damaged", "repair", "breakage", "dry", "dryness", "frizzy"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-total-repair-5-renewing-mask",
    description:
      "Weekly ceramide and arginine mask that delivers intensive repair for hair weakened by heat, colour, or chemical treatments.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-008.jpg",
  },

  // --- HYALURON PLUMP (3) ---
  {
    id: "elvive-009",
    name: "Hyaluron Plump Shampoo 400ml",
    category: "hair_shampoo",
    priority: 18,
    tags: ["all-hair", "dry", "dryness", "fine", "thin", "hydration"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-hyaluron-plump-shampoo",
    description:
      "Hyaluronic acid infused shampoo that replenishes moisture in dry, dehydrated hair and adds weightless plumping volume.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-009.jpg",
  },
  {
    id: "elvive-010",
    name: "Hyaluron Plump Conditioner 300ml",
    category: "hair_conditioner",
    priority: 18,
    tags: ["all-hair", "dry", "dryness", "fine", "thin", "hydration"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-hyaluron-plump-conditioner",
    description:
      "Hyaluronic acid conditioner that provides lasting hydration without weighing down fine or thin hair — adds body and softness.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-010.jpg",
  },
  {
    id: "elvive-011",
    name: "Hyaluron Plump Replumping Serum 150ml",
    category: "hair_treatment",
    priority: 20,
    tags: ["all-hair", "dry", "dryness", "fine", "thin", "hydration", "volume"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-hyaluron-plump-replumping-serum",
    description:
      "Leave-in hyaluronic acid hair serum that fills in gaps in the hair fibre, visibly plumping and thickening each strand.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-011.jpg",
  },

  // --- COLOR VIVE (3) ---
  {
    id: "elvive-012",
    name: "Color Vive Shampoo 400ml",
    category: "hair_shampoo",
    priority: 18,
    tags: ["color_treated", "all-hair", "shine", "damaged"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-color-vive-shampoo",
    description:
      "UV filter and antioxidant shampoo that protects colour-treated hair from fading, washing out 2× slower than unprotected hair.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-012.jpg",
  },
  {
    id: "elvive-013",
    name: "Color Vive Conditioner 300ml",
    category: "hair_conditioner",
    priority: 18,
    tags: ["color_treated", "all-hair", "shine", "damaged", "frizzy"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-color-vive-conditioner",
    description:
      "Colour-protect conditioner that seals the hair cuticle to lock in dye, add shine, and prevent colour-related frizz.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-013.jpg",
  },
  {
    id: "elvive-014",
    name: "Color Vive Protecting Balm 300ml",
    category: "hair_treatment",
    priority: 15,
    tags: ["color_treated", "damaged", "repair", "shine"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-color-vive-protecting-mask",
    description:
      "Weekly deep treatment balm that reinforces colour-treated hair, reduces breakage from chemical processing, and restores vibrancy.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-014.jpg",
  },

  // --- DREAM LONG (3) ---
  {
    id: "elvive-015",
    name: "Dream Long Shampoo 400ml",
    category: "hair_shampoo",
    priority: 18,
    tags: ["all-hair", "hairfall", "breakage", "fine", "thin"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-dream-long-shampoo",
    description:
      "Castor oil and arginine shampoo that reinforces weak, fragile hair from root to tip, reducing breakage to help hair grow longer.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-015.jpg",
  },
  {
    id: "elvive-016",
    name: "Dream Long Conditioner 300ml",
    category: "hair_conditioner",
    priority: 18,
    tags: ["all-hair", "hairfall", "breakage", "fine", "thin", "dry"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-dream-long-conditioner",
    description:
      "Lightweight conditioner that detangles and strengthens fragile long hair without weighing it down, reducing breakage at brushing.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-016.jpg",
  },
  {
    id: "elvive-017",
    name: "Dream Long Wonder Water 200ml",
    category: "hair_treatment",
    priority: 20,
    tags: ["all-hair", "frizzy", "frizz", "shine", "damaged", "breakage"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-wonder-water",
    description:
      "10-second lamellar water rinse-off treatment that seals the hair cuticle for instant smoothness, glass-like shine, and frizz control.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-017.jpg",
  },

  // --- ANTI-HAIRFALL (2) ---
  {
    id: "elvive-018",
    name: "Full Resist Anti-Hairfall Shampoo 400ml",
    category: "hair_shampoo",
    priority: 20,
    tags: ["all-hair", "hairfall", "breakage", "fine", "thin"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-full-resist-shampoo",
    description:
      "Biotin and arginine anti-hairfall shampoo that strengthens hair bonds and reduces hair loss due to breakage by up to 97%.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-018.jpg",
  },
  {
    id: "elvive-019",
    name: "Full Resist Anti-Hairfall Conditioner 300ml",
    category: "hair_conditioner",
    priority: 20,
    tags: ["all-hair", "hairfall", "breakage", "fine", "thin", "dry"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-full-resist-conditioner",
    description:
      "Biotin-enriched anti-breakage conditioner that reinforces the hair fibre and reduces hairfall visible during rinsing and brushing.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-019.jpg",
  },

  // --- SCALP (1) ---
  {
    id: "elvive-020",
    name: "Scalp Advanced Anti-Dandruff Shampoo 400ml",
    category: "hair_shampoo",
    priority: 15,
    tags: ["all-hair", "scalp", "dandruff", "dry", "dryness"],
    routine: "hair",
    purchaseLink: "https://www.lorealparis.com.au/elvive-scalp-advanced-anti-dandruff-shampoo",
    description:
      "Piroctone olamine anti-dandruff shampoo that eliminates flakes, soothes scalp irritation, and keeps hair clean and refreshed.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-020.jpg",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SAFE ROUTINE FALLBACKS
// Used when no products score > 0 for a given profile.
// These are the most universally suitable products across all skin/hair types.
// ─────────────────────────────────────────────────────────────────────────────

/** Safe day routine: gentle cleanser + hydrating serum + SPF moisturiser */
export const SAFE_ROUTINE_DAY_IDS = [
  "loreal-003",  // Micellar Water (all-skin gentle cleanser)
  "loreal-007",  // Hyaluronic Acid Serum (universal hydration)
  "loreal-013",  // UV Defender SPF50+ (everyone needs SPF)
  "loreal-011",  // Hydra Genius Day Moisturiser
];

/** Safe night routine: gentle cleanser + night moisturiser */
export const SAFE_ROUTINE_NIGHT_IDS = [
  "loreal-003",  // Micellar Water
  "loreal-016",  // Hydra Genius Sleeping Cream
  "loreal-015",  // Age Perfect Night Cream
];

/** Safe hair routine: universal repair shampoo + conditioner + treatment */
export const SAFE_ROUTINE_HAIR_IDS = [
  "elvive-005",  // Total Repair 5 Shampoo (addresses most hair concerns)
  "elvive-006",  // Total Repair 5 Conditioner
  "elvive-003",  // Extraordinary Oil Serum (universal finishing treatment)
];

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE UPLOAD GUIDE
// ─────────────────────────────────────────────────────────────────────────────
//
// Upload each product image to your GCloud bucket using the filename = product id.
//
// Bucket path: gs://product-imgs-glowai/
// Public URL:  https://storage.googleapis.com/product-imgs-glowai/{id}.jpg
//
// SKIN PRODUCTS (L'Oréal Paris) — search these exact product names on:
//   lorealparis.com.au, lorealparis.co.uk, or loreal-paris.com for official images
//
//   loreal-001.jpg  → L'Oréal Pure Clay Purifying Face Wash (black tube)
//   loreal-002.jpg  → L'Oréal Pure Clay Brightening Face Wash (yellow/white tube)
//   loreal-003.jpg  → L'Oréal Micellar Water 3-in-1 400ml (clear/pink bottle)
//   loreal-004.jpg  → L'Oréal Pure Clay Anti-Pore Face Wash (blue/green tube)
//   loreal-005.jpg  → L'Oréal Age Perfect Cleansing Milk (gold/beige bottle)
//   loreal-006.jpg  → L'Oréal Revitalift Micro-Peeling Gel Wash (white/gold tube)
//   loreal-007.jpg  → L'Oréal Revitalift 1.5% Hyaluronic Acid Serum (clear bottle)
//   loreal-008.jpg  → L'Oréal Revitalift 10% Vitamin C Serum (orange bottle)
//   loreal-009.jpg  → L'Oréal Revitalift Laser Retinol Serum (dark purple bottle)
//   loreal-010.jpg  → L'Oréal Glycolic Bright Glowing Serum (pink bottle)
//   loreal-011.jpg  → L'Oréal Hydra Genius Aloe Water Moisturiser (green bottle)
//   loreal-012.jpg  → L'Oréal Revitalift Laser SPF20 Day Cream (gold/white jar)
//   loreal-013.jpg  → L'Oréal UV Defender SPF50+ (white tube)
//   loreal-014.jpg  → L'Oréal Pure Clay Mattifying Moisturiser (black jar)
//   loreal-015.jpg  → L'Oréal Age Perfect Cell Renewal Night Cream (gold jar)
//   loreal-016.jpg  → L'Oréal Hydra Genius Sleeping Cream (turquoise jar)
//   loreal-017.jpg  → L'Oréal Revitalift Triple Power Night Cream (white jar)
//   loreal-018.jpg  → L'Oréal Revitalift Laser Eye Cream (small gold tube)
//   loreal-019.jpg  → L'Oréal Glycolic Bright Toner (pink bottle)
//   loreal-020.jpg  → L'Oréal Pure Clay Charcoal Detox Mask (black jar)
//
// HAIR PRODUCTS (L'Oréal Elvive) — search "Elvive {product name}" on:
//   lorealparis.com.au or elvive.com
//
//   elvive-001.jpg  → Elvive Extraordinary Oil Shampoo (gold/bronze bottle)
//   elvive-002.jpg  → Elvive Extraordinary Oil Conditioner (gold/bronze bottle)
//   elvive-003.jpg  → Elvive Extraordinary Oil Serum (gold dropper bottle)
//   elvive-004.jpg  → Elvive Extraordinary Oil Curls Shampoo (orange bottle)
//   elvive-005.jpg  → Elvive Total Repair 5 Shampoo (red/white bottle)
//   elvive-006.jpg  → Elvive Total Repair 5 Conditioner (red/white bottle)
//   elvive-007.jpg  → Elvive Total Repair 5 Extreme Balm (red jar)
//   elvive-008.jpg  → Elvive Total Repair 5 Renewing Mask (red jar)
//   elvive-009.jpg  → Elvive Hyaluron Plump Shampoo (blue/clear bottle)
//   elvive-010.jpg  → Elvive Hyaluron Plump Conditioner (blue/clear bottle)
//   elvive-011.jpg  → Elvive Hyaluron Plump Serum (blue bottle)
//   elvive-012.jpg  → Elvive Color Vive Shampoo (purple bottle)
//   elvive-013.jpg  → Elvive Color Vive Conditioner (purple bottle)
//   elvive-014.jpg  → Elvive Color Vive Protecting Balm (purple jar)
//   elvive-015.jpg  → Elvive Dream Long Shampoo (pink bottle)
//   elvive-016.jpg  → Elvive Dream Long Conditioner (pink bottle)
//   elvive-017.jpg  → Elvive Wonder Water (clear/blue bottle)
//   elvive-018.jpg  → Elvive Full Resist Anti-Hairfall Shampoo (red/white bottle)
//   elvive-019.jpg  → Elvive Full Resist Anti-Hairfall Conditioner (red/white bottle)
//   elvive-020.jpg  → Elvive Scalp Advanced Anti-Dandruff Shampoo (blue bottle)
//
// QUICK UPLOAD COMMAND (run from terminal with gsutil installed):
//   gsutil -m cp ./product-images/*.jpg gs://product-imgs-glowai/
//
// Make sure the bucket has public read access:
//   gsutil iam ch allUsers:objectViewer gs://product-imgs-glowai