// Fix: Implement Gemini API service functions with Design Lockdown logic.
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from '@google/genai';
import { GroundingChunk, PaintColor } from '../types';
import { findPaintByBrandAndName } from '../functions/authoritativePaintService';

// According to guidelines, API key must be from process.env.API_KEY
// Browser build (Vite/Netlify): API key must come from import.meta.env
const apiKey =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  (import.meta as any).env?.VITE_API_KEY ||
  '';

if (!apiKey) {
  throw new Error(
    'Missing API key. Set VITE_GEMINI_API_KEY in Netlify Environment Variables and redeploy (clear cache).'
  );
}

const ai = new GoogleGenAI({ apiKey });


// Helper to extract base64 image from response
const getImageFromResponse = (response: GenerateContentResponse): { base64: string; mimeType: string } => {
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
      }
    }
  }
  throw new Error('No image data found in AI response.');
};

export const applyPaintColor = async (
  roomBase64: string,
  roomMimeType: string,
  colorQuery: string,
  directHex?: string | null
): Promise<{ base64: string; mimeType: string }> => {
  let hexColor: string | null = directHex || null;

  if (!hexColor) {
    const parts = colorQuery.split(',').map(p => p.trim());
    const brand = parts[0];
    const name = parts.slice(1).join(',').trim();

    if (brand && name) {
      const matchedPaint = findPaintByBrandAndName(brand, name);
      if (matchedPaint) {
        hexColor = matchedPaint.hex;
      }
    }
    
    if (!hexColor) {
      let colorPrompt: string;
      if (brand && name) {
        colorPrompt = `
          You are a professional paint colour matcher.
          Verify the exact HEX code for "${name}" by ${brand}.
          Return ONLY a single 6-digit HEX code (e.g. #C4AFB1).
        `;
      } else {
        colorPrompt = `
          Provide a PRECISE HEX code for: "${colorQuery}".
          **TONAL DIFFERENTIATION RULES:**
          - "Cream" MUST be warm and yellow-toned (#F3E5AB). 
          - "Navy" or "Dark Blue" MUST be visibly blue (#121F33).
          - "Burgundy" MUST be a deep, saturated wine-red (#800020).
          Return ONLY the HEX code.
        `;
      }

      const colorRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: colorPrompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      const colorText = colorRes.text.trim();
      const resolvedHex = colorText.startsWith('#') ? colorText : `#${colorText}`;
      hexColor = resolvedHex;
    }
  }
  
  const recolorPrompt = `
    TASK: Paint EVERY visible wall and trim surface in this room HEX: ${hexColor}.
    
    **DESTRUCTIVE OVERWRITE DIRECTIVE:**
    - REPLACE existing pigments with 100% OPACITY.
    - Separate COLOR from LIGHTING: Use shadows for 3D depth, but the base pigment MUST be ${hexColor}.
    - Ensure Burgundy and Navy are RICH and SATURATED, not black.
    - Ensure Cream is WARM and BUTTERY, not white.
    
    Output ONLY the image.
  `;

  const recolorRes = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { text: recolorPrompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE] },
  });

  return getImageFromResponse(recolorRes);
};

export const extractPatternFromImage = async (
  imageBase64: string,
  imageMimeType: string
): Promise<{ base64: string; mimeType: string }> => {
  const model = 'gemini-2.5-flash-image';
  const prompt = `Extract a clean, flat, front-facing tileable wallpaper pattern swatch from this image. Remove all background.`;
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ inlineData: { data: imageBase64, mimeType: imageMimeType } }, { text: prompt }] },
    config: { responseModalities: [Modality.IMAGE] },
  });
  return getImageFromResponse(response);
};

export const applyStyle = async (
  roomBase64: string,
  roomMimeType: string,
  styleBase64: string,
  styleMimeType: string,
): Promise<{ base64: string; mimeType: string }> => {
  const model = 'gemini-2.5-flash-image';
  const prompt = `Wallpaper EVERY SINGLE wall in this image with the provided pattern. 100% coverage. Maintain scale and perspective. Output ONLY image.`;
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { inlineData: { data: styleBase64, mimeType: styleMimeType } },
        { text: prompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE] },
  });
  return getImageFromResponse(response);
};

export const applyPanelling = async (
  roomBase64: string,
  roomMimeType: string,
  style: string,
  height: string,
  colorDescription: string
): Promise<{ base64: string; mimeType: string }> => {
  const model = 'gemini-2.5-flash-image';
  const prompt = `Add ${style} wall panelling to ${height} of ALL walls. Color: ${colorDescription}. Real wood texture. Output ONLY image.`;
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { text: prompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE] },
  });
  return getImageFromResponse(response);
};

export const editText = async (
  imageBase64: string,
  imageMimeType: string,
  prompt: string
): Promise<{ base64: string; mimeType: string }> => {
  const model = 'gemini-2.5-flash-image';
  
  const isChangingWalls = /wall|skirting|paint|wallpaper|trim|skirt/i.test(prompt);

  const enhancedPrompt = `
    TASK: ${prompt}
    
    **DESIGN LOCKDOWN DIRECTIVE (MANDATORY):**
    ${!isChangingWalls ? `
    - The WALLS (their color/pattern) and TRIM (skirting/frames) are DELIBERATE DESIGN CHOICES.
    - DO NOT change the color, pattern, or saturation of the walls or skirting.
    - DO NOT "re-harmonize" the walls to match new objects.
    - Treat wall surfaces as a PROTECTED LAYER.
    ` : `
    - If modifying wall/trim color: Use DESTRUCTIVE OVERWRITE. Ignore previous colors. Replace with 100% opacity.
    - "Cream" = Buttery warm. "Burgundy" = Deep saturated red. "Navy" = Visible blue.
    `}
    
    - Maintain consistent lighting and photo-realism.
    - ONLY change the specific objects or areas requested.
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: imageMimeType } },
        { text: enhancedPrompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE] },
  });
  return getImageFromResponse(response);
};

export const getDesignIdeasFromImage = async (
  roomBase64: string,
  roomMimeType: string
): Promise<{ text: string, sources?: GroundingChunk[] }> => {
  const model = 'gemini-2.5-flash';
  const prompt = `Suggest 3-5 additive decor items (plants, art, lighting) for this room. Concise bullets.`;
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { text: prompt },
      ],
    },
    config: { tools: [{ googleSearch: {} }] },
  });
  return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined,
  };
};

export const implementDesignIdeas = async (
  roomBase64: string,
  roomMimeType: string,
  idea: string
): Promise<{ base64: string; mimeType: string }> => {
  const model = 'gemini-2.5-flash-image';
  const enhancedPrompt = `
    Implement: ${idea}.
    **DESIGN LOCKDOWN:** Preserve the current wall colors/patterns and floor exactly as they are. Only add new elements. Do not re-light the scene in a way that changes wall pigments.
  `;
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { text: enhancedPrompt },
      ],
    },
    config: { responseModalities: [Modality.IMAGE] },
  });
  return getImageFromResponse(response);
};

export const generateWallpaperSwatch = async (
  prompt: string
): Promise<{ base64: string; mimeType: string }> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `Tileable wallpaper swatch: ${prompt}`,
    config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
  });
  if (response.generatedImages?.[0]) {
    return { base64: response.generatedImages[0].image.imageBytes, mimeType: 'image/png' };
  }
  throw new Error('Generation failed.');
};
