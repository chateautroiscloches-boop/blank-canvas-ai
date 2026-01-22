
import { paintColors } from '../data/paintColors';
import { PaintColor } from '../types';

/**
 * Finds a paint color from the curated list.
 * This provides an immediate, authoritative answer for known colors,
 * reducing reliance on AI search for common queries.
 * The search is case-insensitive and flexible with spacing.
 */
export const findPaintByBrandAndName = (brand: string, name: string): PaintColor | undefined => {
  if (!brand || !name) {
    return undefined;
  }
  const normalizedBrand = brand.trim().toLowerCase();
  const normalizedName = name.trim().toLowerCase();

  return paintColors.find(
    (color) =>
      color.brand.toLowerCase() === normalizedBrand &&
      color.name.toLowerCase() === normalizedName
  );
};
