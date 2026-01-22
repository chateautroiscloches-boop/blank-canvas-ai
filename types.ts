
export enum Tab {
  PAINT = 'Paint',
  WALLPAPER = 'Wallpaper',
  PANELLING = 'Panelling',
  DESIGN_IDEAS = 'Design Ideas',
}

export enum PanellingStyle {
  TONGUE_AND_GROOVE = 'Tongue and Groove',
  VICTORIAN = 'Victorian',
  SHAKER = 'Shaker',
}

export enum PanellingHeight {
  LOWER_THIRD = 'Lower Third',
  HALF_WALL = 'Half Wall',
  FULL_WALL = 'Full Wall',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface WallpaperSwatch {
  brand: string;
  name: string;
  swatchImageUrl: string;
}

export interface PaintColor {
    brand: string;
    name: string;
    hex: string;
}
