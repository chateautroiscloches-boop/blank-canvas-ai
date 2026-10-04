import { PaintColor } from '../types';

/**
 * Curated manufacturer colour references.
 *
 * IMPORTANT:
 * These HEX values are digital visualisation references.
 * They are NOT claimed to be manufacturer-published HEX specifications.
 *
 * Manufacturer colours which are not yet represented here are resolved
 * through the manufacturer lookup in authoritativePaintService.ts.
 */

export const paintColors: PaintColor[] = [
  // ---------------------------------------------------------------------------
  // MYLANDS
  // ---------------------------------------------------------------------------

  {
    brand: 'Mylands',
    name: 'Market Green No.38',
    hex: '#404E51',
  },

  {
    brand: 'Mylands',
    name: 'Bond Street No.219',
    hex: '#4D5B6B',
  },

  {
    brand: 'Mylands',
    name: 'Sloane Square No.92',
    hex: '#C7C8C3',
  },

  {
    brand: 'Mylands',
    name: 'Grosvenor Square No.100',
    hex: '#E4E0D7',
  },

  // ---------------------------------------------------------------------------
  // FARROW & BALL
  // ---------------------------------------------------------------------------

  {
    brand: 'Farrow & Ball',
    name: 'Hague Blue No.30',
    hex: '#2F3D4C',
  },

  {
    brand: 'Farrow & Ball',
    name: "Elephant's Breath No.229",
    hex: '#C4BCB3',
  },

  {
    brand: 'Farrow & Ball',
    name: 'Skimming Stone No.241',
    hex: '#D8D1C7',
  },

  {
    brand: 'Farrow & Ball',
    name: 'Setting Plaster No.231',
    hex: '#E1C6B8',
  },

  // ---------------------------------------------------------------------------
  // BENJAMIN MOORE
  // ---------------------------------------------------------------------------

  {
    brand: 'Benjamin Moore',
    name: 'Chantilly Lace OC-65',
    hex: '#F1F2ED',
  },

  {
    brand: 'Benjamin Moore',
    name: 'Hale Navy HC-154',
    hex: '#434B56',
  },

  {
    brand: 'Benjamin Moore',
    name: 'Revere Pewter HC-172',
    hex: '#CCC9BE',
  },

  // ---------------------------------------------------------------------------
  // LITTLE GREENE
  // ---------------------------------------------------------------------------

  {
    brand: 'Little Greene',
    name: "Hicks' Blue",
    hex: '#003C5B',
  },

  {
    brand: 'Little Greene',
    name: 'Slaked Lime',
    hex: '#F4F1E9',
  },
];
