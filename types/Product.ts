/**
 * Product and routine types for recommendations.
 */

export type ProductCategory =
  | "cleanser"
  | "toner"
  | "serum"
  | "moisturizer"
  | "sunscreen"
  | "mask"
  | "hair_shampoo"
  | "hair_conditioner"
  | "hair_treatment"
  | "other";

export type RoutineType = "day" | "night" | "hair" | "both";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  /** For sorting when multiple products match (higher = preferred) */
  priority: number;
  /** Optional tags for rule matching (skin_type_or_hair_type, concern, e.g. "oily", "acne", "straight") */
  tags: string[];
  /** Routine this product belongs to */
  routine: RoutineType;
  /** Placeholder; fill with real Daraz/product links later */
  purchaseLink: string;
  description?: string;
  /** Product image URL (placeholder or real asset) */
  image: string;
}

export interface RecommendedProduct {
  product: Product;
  reason: string;
}

export interface Routine {
  day: RecommendedProduct[];
  night: RecommendedProduct[];
}
