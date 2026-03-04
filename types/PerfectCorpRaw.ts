/**
 * Placeholder types for Perfect Corp API responses.
 * Replace with actual SDK/API response types when integrating.
 * @see https://www.perfectcorp.com/ (Beauty AI APIs)
 *
 * Example shape – adjust to real API when available:
 * - Face: skin tone, skin type, concerns, confidence
 * - Hair (optional): color, type, confidence
 */

export interface PerfectCorpFaceRaw {
  skinTone?: string;
  skinType?: string;
  concerns?: string[];
  confidence?: number;
}

export interface PerfectCorpHairRaw {
  color?: string;
  type?: string;
  confidence?: number;
}

export interface PerfectCorpAnalysisRaw {
  face?: PerfectCorpFaceRaw;
  hair?: PerfectCorpHairRaw | null;
}
