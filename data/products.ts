/**
 * Static product catalog for GlowAI - French brand products (MVP)
 * L'Oréal Paris (skin) + L'Oréal Elvive (hair)
 * All purchaseLinks verified on loreal-paris.co.uk — March 2026
 *
 * Tag vocabulary:
 * SKIN  → oily | oiliness | acne | dry | dryness | hydration | dullness |
 *          brightening | dark_spots | fine_lines | wrinkles | anti-aging |
 *          sensitive | irritation | redness | pollution | combination | mature | all-skin
 * HAIR  → all-hair | hairfall | damaged | repair | frizzy | frizz | dry | dryness |
 *          fine | thin | volume | curly | coily | wavy | straight | shine |
 *          breakage | color_treated
 * SLOTS → day | night | both | hair
 * PRIORITY 10 (low) → 20 (hero)
 */

import type { Product } from "@/types/Product";

export const products: Product[] = [

  // ============================================================
  // L'ORÉAL PARIS — SKIN (20)
  // ============================================================

  // ── CLEANSERS (6) ──────────────────────────────────────────

  {
    id: "loreal-001",
    name: "Pure Clay Purifying Foam Wash",
    category: "cleanser",
    priority: 20,
    tags: ["oily", "combination", "oiliness", "acne", "dullness"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/pure-clay/foam-wash-green",
    description:
      "3 pure clays + eucalyptus gel-wash that purifies pores, controls excess oil, and leaves skin matte and refreshed.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-001.jpg",
  },
  {
    id: "loreal-002",
    name: "Pure Clay Brightening Foam Wash",
    category: "cleanser",
    priority: 18,
    tags: ["dullness", "brightening", "all-skin", "dark_spots"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/pure-clay/foam-wash-red",
    description:
      "3 pure clays + red algae exfoliating scrub that buffs away dead skin cells for brighter, smoother skin every day.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-002.jpg",
  },
  {
    id: "loreal-003",
    name: "Revitalift Filler Hyaluronic Acid Micellar Water",
    category: "cleanser",
    priority: 14,
    tags: ["sensitive", "dry", "dryness", "hydration", "all-skin"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/filler-renew/hyaluronic-acid-cleansing-micellar-water",
    description:
      "Micellar water enriched with hyaluronic acid that removes makeup and impurities while leaving skin feeling replumped and hydrated.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-003.jpg",
  },
  {
    id: "loreal-004",
    name: "Pure Clay Detox Charcoal Foam Wash",
    category: "cleanser",
    priority: 18,
    tags: ["oily", "combination", "oiliness", "acne", "pollution"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/pure-clay/foam-wash-black",
    description:
      "3 pure clays + charcoal gel-wash that acts like a magnet to draw out pollution particles and clear congested pores.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-004.jpg",
  },
  {
    id: "loreal-005",
    name: "Bright Reveal Spot Fading Serum-in-Cleanser",
    category: "cleanser",
    priority: 18,
    tags: ["dark_spots", "dullness", "brightening", "oily", "acne", "all-skin"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/bright-reveal/serum-in-cleanser-niacinamide-and-salicylic-acid",
    description:
      "Niacinamide + salicylic acid gel-to-foam cleanser clinically proven to fade post-acne marks and visibly correct dark spots from the first wash.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-005.jpg",
  },
  {
    id: "loreal-006",
    name: "Age Perfect Micellar Water for Mature Skin",
    category: "cleanser",
    priority: 14,
    tags: ["mature", "sensitive", "dry", "dryness", "anti-aging"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/age-perfect/collagen-expert/micellar-water",
    description:
      "Pro-vitamin B5 micellar water designed for mature and sensitive skin that cleanses, soothes, and hydrates in one gentle action.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-006.jpg",
  },

  // ── SERUMS (5) ─────────────────────────────────────────────

  {
    id: "loreal-007",
    name: "Revitalift Filler 1.5% Hyaluronic Acid Serum",
    category: "serum",
    priority: 20,
    tags: ["dry", "dryness", "hydration", "fine_lines", "all-skin"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/filler-renew/hyaluronic-acid-anti-wrinkle-serum",
    description:
      "World's #1 serum — dual micro and macro hyaluronic acid formula clinically proven to replump skin and reduce fine lines in 1 hour.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-007.jpg",
  },
  {
    id: "loreal-008",
    name: "Revitalift Clinical 12% Pure Vitamin C Serum",
    category: "serum",
    priority: 20,
    tags: ["dullness", "brightening", "dark_spots", "fine_lines", "anti-aging", "all-skin"],
    routine: "day",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/clinical/12-percent-vitamin-c-serum",
    description:
      "Stabilised 12% pure vitamin C + vitamin E + salicylic acid serum proven to deliver 2x brighter skin and reduce pores and fine lines in 4 weeks.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-008.jpg",
  },
  {
    id: "loreal-009",
    name: "Revitalift Laser Pure Retinol Night Serum",
    category: "serum",
    priority: 20,
    tags: ["fine_lines", "wrinkles", "anti-aging", "mature", "dark_spots"],
    routine: "night",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/laser-renew/pure-retinol-deep-anti-wrinkle-night-serum-30ml",
    description:
      "Highest concentration pure retinol night serum — 77% of women saw a visible reduction in deep wrinkles. Apply 3-4 drops before moisturiser.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-009.jpg",
  },
  {
    id: "loreal-010",
    name: "Bright Reveal 10% Niacinamide Dark Spot Serum",
    category: "serum",
    priority: 20,
    tags: ["dark_spots", "dullness", "brightening", "all-skin", "oily", "combination"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/bright-reveal/10-niacinamide-amino-sulfonic-ferulic-acid-serum",
    description:
      "Dermatologist-validated 10% niacinamide + amino-sulfonic acid serum clinically proven to reduce 77% of dark spots from acne, sun, and ageing.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-010.jpg",
  },
  {
    id: "loreal-011",
    name: "Revitalift Filler 2.5% Hyaluronic Acid Eye Serum",
    category: "eye_cream",
    priority: 18,
    tags: ["fine_lines", "anti-aging", "mature", "dark_spots", "all-skin"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/filler-renew/hyaluronic-acid-eye-serum",
    description:
      "Hyaluronic acid + caffeine eye serum proven to visibly brighten dark circles and replump eye lines. Fragrance-free, validated by dermatologists.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-011.jpg",
  },

  // ── DAY MOISTURISERS (4) ───────────────────────────────────

  {
    id: "loreal-012",
    name: "Revitalift Laser Triple Action Anti-Ageing Day Cream",
    category: "moisturizer",
    priority: 20,
    tags: ["fine_lines", "wrinkles", "anti-aging", "mature", "brightening", "all-skin"],
    routine: "day",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/laser-routine/laser-renew-anti-ageing-day-cream",
    description:
      "Pro-retinol, hyaluronic acid, and vitamin C day cream that simultaneously smooths wrinkles, firms, and brightens — validated by dermatologists.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-012.jpg",
  },
  {
    id: "loreal-013",
    name: "Revitalift Clinical SPF50+ Vitamin C UV Fluid",
    category: "moisturizer",
    priority: 20,
    tags: ["all-skin", "pollution", "dark_spots", "dullness", "anti-aging", "brightening"],
    routine: "day",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/clinical/vitamin-c-anti-uv-fluid",
    description:
      "Non-oily, non-sticky SPF50+ daily fluid that blocks UV-caused dark spots and ageing. Pairs with vitamin C serum for 4x brighter skin tone.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-013.jpg",
  },
  {
    id: "loreal-014",
    name: "Bright Reveal Dark Spot Hydrating Cream SPF50",
    category: "moisturizer",
    priority: 18,
    tags: ["dark_spots", "dullness", "brightening", "all-skin", "pollution"],
    routine: "day",
    purchaseLink: "https://www.loreal-paris.co.uk/bright-reveal/dark-spot-hydrating-cream-spf-50-niacinamide",
    description:
      "Niacinamide + Mexoryl 400 SPF50 moisturiser that visibly fades dark spots in 1 month while providing the broadest UV protection available.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-014.jpg",
  },
  {
    id: "loreal-015",
    name: "Revitalift Filler Hyaluronic Acid Plumping Water-Cream",
    category: "moisturizer",
    priority: 18,
    tags: ["dry", "dryness", "hydration", "fine_lines", "all-skin", "sensitive"],
    routine: "day",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/filler-renew/plumping-water-cream",
    description:
      "Lightweight non-sticky water-cream with 2 types of hyaluronic acid and 3 ceramides — skin is 3x plumper and lines are visibly reduced in 2 weeks.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-015.jpg",
  },

  // ── NIGHT MOISTURISERS (3) ─────────────────────────────────

  {
    id: "loreal-016",
    name: "Revitalift Laser Retinol + Niacinamide Night Cream",
    category: "moisturizer",
    priority: 20,
    tags: ["fine_lines", "wrinkles", "anti-aging", "mature", "dark_spots", "dullness"],
    routine: "night",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/laser-renew/retinol-niacinamide-night-cream",
    description:
      "Retinol + niacinamide pressed night cream clinically proven to reduce wrinkles and even skin tone in 10 nights. Suitable for retinol beginners.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-016.jpg",
  },
  {
    id: "loreal-017",
    name: "Revitalift Filler Hyaluronic Acid Night Cream",
    category: "moisturizer",
    priority: 18,
    tags: ["dry", "dryness", "hydration", "fine_lines", "wrinkles", "anti-aging"],
    routine: "night",
    purchaseLink: "https://www.loreal-paris.co.uk/revitalift/filler-renew/night-cream",
    description:
      "Concentrated hyaluronic acid night cream that fills wrinkles, defines contours, and restores skin while you sleep.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-017.jpg",
  },
  {
    id: "loreal-018",
    name: "Age Perfect Cell Renew Midnight Cream",
    category: "moisturizer",
    priority: 18,
    tags: ["mature", "fine_lines", "wrinkles", "anti-aging", "dullness", "dry"],
    routine: "night",
    purchaseLink: "https://www.loreal-paris.co.uk/age-perfect/cell-renew/midnight-cream",
    description:
      "Antioxidant overnight cream for mature skin that stimulates cell renewal, repairs the skin barrier, and reveals a fresher complexion by morning.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-018.jpg",
  },

  // ── MASKS (2) ──────────────────────────────────────────────

  {
    id: "loreal-019",
    name: "Pure Clay Bright Yuzu Lemon Face Mask",
    category: "mask",
    priority: 14,
    tags: ["dullness", "brightening", "dark_spots", "all-skin", "oily", "combination"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/pure-clay/bright-face-mask",
    description:
      "3 pure clays + yuzu lemon brightening mask used 2-3x weekly to exfoliate dead cells, absorb oil, and reveal a more even and radiant complexion.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-019.jpg",
  },
  {
    id: "loreal-020",
    name: "Pure Clay Detox Charcoal Face Mask",
    category: "mask",
    priority: 14,
    tags: ["oily", "combination", "acne", "pollution", "dullness"],
    routine: "both",
    purchaseLink: "https://www.loreal-paris.co.uk/pure-clay/purity-mask",
    description:
      "3 pure clays + eucalyptus detox mask used 2-3x weekly that draws out impurities from deep in pores for clarified, matte-looking skin.",
    image: "https://storage.googleapis.com/product-imgs-glowai/loreal-020.jpg",
  },

  // ============================================================
  // L'ORÉAL ELVIVE — HAIR (20)
  // ============================================================

  // ── EXTRAORDINARY OIL (3) ──────────────────────────────────

  {
    id: "elvive-001",
    name: "Elvive Extraordinary Oil Nourishing Shampoo",
    category: "hair_shampoo",
    priority: 18,
    tags: ["all-hair", "dry", "dryness", "frizzy", "frizz", "shine", "damaged"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/extraordinary-oil/oil-shampoo-dry-hair",
    description:
      "Silicone-free shampoo with marula and camellia oils that restores hair lipids for up to 8 weeks of nourishment and shine.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-001.jpg",
  },
  {
    id: "elvive-002",
    name: "Elvive Extraordinary Oil Nourishing Conditioner",
    category: "hair_conditioner",
    priority: 18,
    tags: ["all-hair", "dry", "dryness", "frizzy", "frizz", "shine"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/extraordinary-oil/oil-conditioner",
    description:
      "Marula and camellia oil conditioner that seals in moisture for 90% instant nourishment and hair that feels softer and healthier.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-002.jpg",
  },
  {
    id: "elvive-003",
    name: "Elvive Extraordinary Oil Coco Weightless Shampoo",
    category: "hair_shampoo",
    priority: 16,
    tags: ["all-hair", "fine", "thin", "dry", "frizzy", "shine"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/extraordinary-oil/coconut-shampoo",
    description:
      "Extra-fine coconut oil shampoo that delivers intense nourishment and irresistible shine with absolutely no weigh-down.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-003.jpg",
  },

  // ── FULL RESTORE 5 (3) ─────────────────────────────────────

  {
    id: "elvive-004",
    name: "Elvive Full Restore 5 Repairing Shampoo",
    category: "hair_shampoo",
    priority: 20,
    tags: ["damaged", "repair", "breakage", "dry", "frizzy", "frizz"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/full-restore-5/elvive-full-restore-5-shampoo",
    description:
      "Ceramide-powered shampoo that targets all 5 signs of hair damage: strength, softness, vitality, silkiness, and shine from the first wash.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-004.jpg",
  },
  {
    id: "elvive-005",
    name: "Elvive Full Restore 5 Repairing Conditioner",
    category: "hair_conditioner",
    priority: 20,
    tags: ["damaged", "repair", "breakage", "dry", "frizzy"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/full-restore-5/elvive-full-restore-5-conditioner",
    description:
      "Ceramide conditioner that rebuilds damaged hair fibre structure, leaving hair stronger, healthier, and more resilient after every use.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-005.jpg",
  },
  {
    id: "elvive-006",
    name: "Elvive Full Restore 5 Repair Mask",
    category: "hair_treatment",
    priority: 18,
    tags: ["damaged", "repair", "breakage", "dry", "dryness", "shine"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/full-restore-5/full-restore-5-mask",
    description:
      "Pro-keratin and ceramide weekly mask that reinforces each hair fibre, restores smoothness, and delivers a visible reduction in signs of damage.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-006.jpg",
  },

  // ── BOND REPAIR (3) ────────────────────────────────────────

  {
    id: "elvive-007",
    name: "Elvive Bond Repair Pre-Shampoo Treatment",
    category: "hair_treatment",
    priority: 20,
    tags: ["damaged", "repair", "breakage", "frizzy", "frizz", "color_treated"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/bond-repair/pre-shampoo-treatment",
    description:
      "Citric acid complex pre-shampoo that rebuilds broken hair bonds from within — up to 98% less breakage and 90% more shine.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-007.jpg",
  },
  {
    id: "elvive-008",
    name: "Elvive Bond Repair Shampoo",
    category: "hair_shampoo",
    priority: 20,
    tags: ["damaged", "repair", "breakage", "frizzy", "frizz", "color_treated"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/bond-repair/shampoo",
    description:
      "Sulphate-free citric acid shampoo that restores hair to its original strength — step 2 of the Bond Repair routine, up to 82% stronger hair.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-008.jpg",
  },
  {
    id: "elvive-009",
    name: "Elvive Bond Repair Conditioner",
    category: "hair_conditioner",
    priority: 20,
    tags: ["damaged", "repair", "breakage", "frizzy", "frizz", "shine", "color_treated"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/bond-repair/conditioner",
    description:
      "Step 3 of the Bond Repair routine — citric acid conditioner that seals repaired bonds, eliminates frizz, and delivers glass-like shine.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-009.jpg",
  },

  // ── HYDRA HYALURONIC (3) ───────────────────────────────────

  {
    id: "elvive-010",
    name: "Elvive Hydra Hyaluronic Moisture Boosting Shampoo",
    category: "hair_shampoo",
    priority: 18,
    tags: ["all-hair", "dry", "dryness", "fine", "thin", "hydration"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/hydra-hyaluronic/shampoo-with-hyaluronic-acid",
    description:
      "Hyaluronic acid shampoo that weightlessly coats hair to keep it feeling hydrated for up to 72 hours — hair looks plumped, bouncy, and shiny.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-010.jpg",
  },
  {
    id: "elvive-011",
    name: "Elvive Hydra Hyaluronic Moisture Locking Conditioner",
    category: "hair_conditioner",
    priority: 18,
    tags: ["all-hair", "dry", "dryness", "fine", "thin", "hydration"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/hydra-hyaluronic/conditioner-with-hyaluronic-acid",
    description:
      "Hyaluronic acid conditioner that locks in moisture for up to 72 hours with no weigh-down — suitable for all hair types and textures.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-011.jpg",
  },
  {
    id: "elvive-012",
    name: "Elvive Hydra Hyaluronic Wonder Water",
    category: "hair_treatment",
    priority: 20,
    tags: ["all-hair", "dry", "dryness", "shine", "frizzy", "frizz", "fine"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/wonder-water-with-hyaluronic-acid",
    description:
      "8-second rinse-out lamellar water with hyaluronic acid — hair looks up to 5x shinier and feels plumped. Silicone-free, works on all textures.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-012.jpg",
  },

  // ── COLOUR PROTECT (3) ─────────────────────────────────────

  {
    id: "elvive-013",
    name: "Elvive Colour Protect Shampoo",
    category: "hair_shampoo",
    priority: 18,
    tags: ["color_treated", "all-hair", "shine", "damaged", "frizzy"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/colour-protect/elvive-colour-protect-care-shampoo",
    description:
      "Pure vitamin C + UV filter shampoo that preserves colour vibrancy for up to 40 washes — sunproof and waterproof for coloured hair.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-013.jpg",
  },
  {
    id: "elvive-014",
    name: "Elvive Colour Protect Conditioner",
    category: "hair_conditioner",
    priority: 18,
    tags: ["color_treated", "all-hair", "shine", "frizzy", "frizz"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/colour-protect/elvive-colour-protect-conditioner",
    description:
      "Pure vitamin C conditioner that seals the hair cuticle to lock in dye, shield against UV damage, and boost colour-radiant shine.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-014.jpg",
  },
  {
    id: "elvive-015",
    name: "Elvive Colour Protect Wonder Water",
    category: "hair_treatment",
    priority: 16,
    tags: ["color_treated", "all-hair", "shine", "damaged", "frizzy", "frizz"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/colour-protect/wonder-water",
    description:
      "8-second lamellar rinse-out treatment for coloured hair — pH-optimised formula delivers up to 5x more shine and vibrant colour radiance.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-015.jpg",
  },

  // ── DREAM LENGTHS (3) ──────────────────────────────────────

  {
    id: "elvive-016",
    name: "Elvive Dream Lengths Restoring Shampoo",
    category: "hair_shampoo",
    priority: 18,
    tags: ["all-hair", "hairfall", "breakage", "damaged", "fine", "thin"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/dream-lengths/long-hair-shampoo",
    description:
      "Vegetal keratin and castor oil shampoo that strengthens hair fibre from root to tip — split ends appear sealed, saving your last 3 cm.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-016.jpg",
  },
  {
    id: "elvive-017",
    name: "Elvive Dream Lengths Restoring Conditioner",
    category: "hair_conditioner",
    priority: 18,
    tags: ["all-hair", "hairfall", "breakage", "damaged", "fine", "thin", "dry"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/dream-lengths/long-hair-conditioner",
    description:
      "Keratin and castor oil conditioner that instantly helps repair fragile lengths and seals split ends — suitable for all hair types.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-017.jpg",
  },
  {
    id: "elvive-018",
    name: "Elvive Dream Lengths More Than Shampoo",
    category: "hair_shampoo",
    priority: 16,
    tags: ["all-hair", "hairfall", "breakage", "damaged", "dry"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/dream-lengths/more-than-shampoo",
    description:
      "Shampoo with the care of a mask — keratin, vitamins, and castor oil in one step for long, damaged hair that needs serious strengthening.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-018.jpg",
  },

  // ── GLYCOLIC GLOSS + HA SERUM (2) ──────────────────────────

  {
    id: "elvive-019",
    name: "Elvive Glycolic Gloss Shine-Sealing Conditioner",
    category: "hair_conditioner",
    priority: 18,
    tags: ["all-hair", "shine", "damaged", "frizzy", "frizz", "color_treated", "wavy", "straight"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/glycolic-gloss/glycolic-gloss-core-conditioner",
    description:
      "Glycolic acid conditioner that laminates the hair cuticle with an instant shine glaze for exceptional sleekness — ideal for dull, porous hair.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-019.jpg",
  },
  {
    id: "elvive-020",
    name: "Elvive Hydra Hyaluronic Moisture Plump Hair Serum",
    category: "hair_treatment",
    priority: 18,
    tags: ["all-hair", "dry", "dryness", "hydration", "fine", "thin", "frizzy", "frizz"],
    routine: "hair",
    purchaseLink: "https://www.loreal-paris.co.uk/elvive/hydra-hyaluronic/hair-serum-with-hyaluronic-acid",
    description:
      "Leave-in hyaluronic acid hair serum that weightlessly coats strands for up to 72-hour hydration — use on wet or dry hair at any time.",
    image: "https://storage.googleapis.com/product-imgs-glowai/elvive-020.jpg",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SAFE ROUTINE FALLBACKS
// Used when no products score > 0 for a given profile.
// ─────────────────────────────────────────────────────────────────────────────

/** Day: gentle cleanser + universal hydration serum + SPF */
export const SAFE_ROUTINE_DAY_IDS = [
  "loreal-003",  // Revitalift Micellar Water (all-skin cleanser)
  "loreal-007",  // Hyaluronic Acid Serum (universal hydration)
  "loreal-013",  // Revitalift Clinical SPF50+ (everyone needs SPF)
  "loreal-015",  // Revitalift Filler Water-Cream
];

/** Night: micellar water + HA serum + hydrating night cream */
export const SAFE_ROUTINE_NIGHT_IDS = [
  "loreal-003",  // Revitalift Micellar Water
  "loreal-007",  // Hyaluronic Acid Serum
  "loreal-017",  // Revitalift Filler Night Cream
];

/** Hair: ceramide repair shampoo + conditioner + universal treatment */
export const SAFE_ROUTINE_HAIR_IDS = [
  "elvive-004",  // Full Restore 5 Shampoo
  "elvive-005",  // Full Restore 5 Conditioner
  "elvive-012",  // Hydra Hyaluronic Wonder Water
];

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE UPLOAD GUIDE
// Bucket:  gs://product-imgs-glowai/
// Public:  https://storage.googleapis.com/product-imgs-glowai/{id}.jpg
//
// Get images from each product page on loreal-paris.co.uk
// Right-click product hero image > Save as > rename to {id}.jpg
//
// SKIN
//   loreal-001  Pure Clay Green Foam Wash (green tube)
//   loreal-002  Pure Clay Red Foam Wash (red/pink tube)
//   loreal-003  Revitalift Filler Micellar Water (clear/blue bottle)
//   loreal-004  Pure Clay Black Charcoal Foam Wash (black tube)
//   loreal-005  Bright Reveal Serum-in-Cleanser (pink/white bottle)
//   loreal-006  Age Perfect Micellar Water (gold/beige bottle)
//   loreal-007  Revitalift Filler HA Serum (clear dropper bottle)
//   loreal-008  Revitalift Clinical Vitamin C Serum (orange bottle)
//   loreal-009  Revitalift Laser Retinol Night Serum (dark purple bottle)
//   loreal-010  Bright Reveal Niacinamide Serum (pink/gold bottle)
//   loreal-011  Revitalift Filler Eye Serum (silver tube with roller tip)
//   loreal-012  Revitalift Laser Day Cream (white/gold jar)
//   loreal-013  Revitalift Clinical SPF50+ UV Fluid (white tube)
//   loreal-014  Bright Reveal Dark Spot Cream SPF50 (pink/white jar)
//   loreal-015  Revitalift Filler Water-Cream (white/blue jar)
//   loreal-016  Revitalift Laser Retinol Night Cream (purple/gold jar)
//   loreal-017  Revitalift Filler Night Cream (white/purple jar)
//   loreal-018  Age Perfect Cell Renew Midnight Cream (dark blue jar)
//   loreal-019  Pure Clay Bright Mask (yellow jar)
//   loreal-020  Pure Clay Detox Mask (black jar)
//
// HAIR
//   elvive-001  Extraordinary Oil Shampoo (gold/bronze bottle)
//   elvive-002  Extraordinary Oil Conditioner (gold/bronze bottle)
//   elvive-003  Extraordinary Oil Coco Shampoo (white/gold bottle)
//   elvive-004  Full Restore 5 Shampoo (red/cream bottle)
//   elvive-005  Full Restore 5 Conditioner (red/cream bottle)
//   elvive-006  Full Restore 5 Mask (red jar)
//   elvive-007  Bond Repair Pre-Shampoo (black/gold bottle)
//   elvive-008  Bond Repair Shampoo (black/gold bottle)
//   elvive-009  Bond Repair Conditioner (black/gold bottle)
//   elvive-010  Hydra Hyaluronic Shampoo (blue/clear bottle)
//   elvive-011  Hydra Hyaluronic Conditioner (blue/clear bottle)
//   elvive-012  Hydra Hyaluronic Wonder Water (blue/clear bottle)
//   elvive-013  Colour Protect Shampoo (purple bottle)
//   elvive-014  Colour Protect Conditioner (purple bottle)
//   elvive-015  Colour Protect Wonder Water (purple bottle)
//   elvive-016  Dream Lengths Shampoo (pink bottle)
//   elvive-017  Dream Lengths Conditioner (pink bottle)
//   elvive-018  Dream Lengths More Than Shampoo (pink/gold bottle)
//   elvive-019  Glycolic Gloss Conditioner (red/pink bottle)
//   elvive-020  Hydra Hyaluronic Hair Serum (blue spray bottle)
//
// BULK UPLOAD COMMANDS:
//   gsutil -m cp ./product-images/*.jpg gs://product-imgs-glowai/
//   gsutil iam ch allUsers:objectViewer gs://product-imgs-glowai
// ─────────────────────────────────────────────────────────────────────────────