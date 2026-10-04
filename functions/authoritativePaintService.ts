import { paintColors } from '../data/paintColors';
import { PaintColor } from '../types';

/**
 * Normalises a manufacturer or colour name so that small differences in
 * punctuation, spacing and trademark symbols do not prevent a match.
 *
 * Examples:
 *
 * "Market Green No.38"
 * "Market Green No 38"
 * "Market Green No. 38™"
 *
 * all become effectively the same searchable string.
 */
const normalise = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/&/g, 'and')
    .replace(/\bnumber\b/g, 'no')
    .replace(/\bno\.\s*/g, 'no')
    .replace(/\bno\s*/g, 'no')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Finds a manufacturer from a free-form colour query.
 *
 * Examples:
 *
 * "Mylands, Market Green"
 * "Market Green, Mylands"
 * "Mylands Market Green No.38"
 */
export const identifyPaintBrand = (
  query: string
): string | undefined => {
  if (!query) {
    return undefined;
  }

  const normalisedQuery = normalise(query);

  const brands = Array.from(
    new Set(paintColors.map((colour) => colour.brand))
  );

  return brands.find((brand) =>
    normalisedQuery.includes(normalise(brand))
  );
};

/**
 * Attempts to find an exact known manufacturer colour.
 *
 * Matching is deliberately tolerant:
 *
 * - case insensitive
 * - punctuation insensitive
 * - trademark symbols ignored
 * - "No.38" / "No 38" treated the same
 * - brand/name can be supplied in either order
 */
export const findPaintByBrandAndName = (
  brand: string,
  name: string
): PaintColor | undefined => {
  if (!brand || !name) {
    return undefined;
  }

  const normalisedBrand = normalise(brand);
  const normalisedName = normalise(name);

  return paintColors.find((colour) => {
    const colourBrand = normalise(colour.brand);
    const colourName = normalise(colour.name);

    return (
      colourBrand === normalisedBrand &&
      (
        colourName === normalisedName ||
        colourName.includes(normalisedName) ||
        normalisedName.includes(colourName)
      )
    );
  });
};

/**
 * Searches the complete local database for a colour from a free-form query.
 *
 * This allows the app to recognise:
 *
 * "Mylands Market Green"
 * "Market Green Mylands"
 * "Mylands Market Green No.38"
 */
export const findPaintFromQuery = (
  query: string
): PaintColor | undefined => {
  if (!query) {
    return undefined;
  }

  const normalisedQuery = normalise(query);

  return paintColors.find((colour) => {
    const brand = normalise(colour.brand);
    const name = normalise(colour.name);

    const hasBrand = normalisedQuery.includes(brand);
    const hasName =
      normalisedQuery.includes(name) ||
      name.includes(normalisedQuery);

    return hasBrand && hasName;
  });
};

/**
 * Returns true when the query appears to contain a known paint manufacturer.
 *
 * This is useful because manufacturer-specific colours should be handled
 * differently from generic colours.
 */
export const isKnownPaintBrand = (
  query: string
): boolean => {
  if (!query) {
    return false;
  }

  const normalisedQuery = normalise(query);

  const knownBrands = [
    'Mylands',
    'Farrow & Ball',
    'Benjamin Moore',
    'Little Greene',
    'Rust-Oleum',
  ];

  return knownBrands.some((brand) =>
    normalisedQuery.includes(normalise(brand))
  );
};
