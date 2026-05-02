import { GroundingChunk } from '../types';
import { findPaintByBrandAndName } from '../functions/authoritativePaintService';

const WORKER_URL = 'https://blank-canvas-proxy.chateautroiscloches.workers.dev';

const callGemini = async (model: string, payload: object): Promise<any> => {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, payload }),
  });
  if (!response.ok) {
    throw new Error(`Worker error: ${response.status}`);
  }
  return response.json();
};

const getImageFromResponse = (data: any): { base64: string; mimeType: string } => {
  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
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
        colorPrompt = `You are a professional paint colour matcher. Verify the exact HEX code for "${name}" by ${brand}. Return ONLY a single 6-digit HEX code (e.g. #C4AFB1).`;
      } else {
        colorPrompt = `Provide a PRECISE HEX code for: "${colorQuery}". "Cream" MUST be warm and yellow-toned (#F3E5AB). "Navy" or "Dark Blue" MUST be visibly blue (#121F33). "Burgundy" MUST be a deep, saturated wine-red (#800020). Return ONLY the HEX code.`;
      }

      const colorData = await callGemini('gemini-2.5-flash', {
        contents: [{ parts: [{ text: colorPrompt }] }],
        tools: [{ googleSearch: {} }],
      });

      const colorText = colorData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      hexColor = colorText.startsWith('#') ? colorText : `#${colorText}`;
    }
  }

  const recolorPrompt = `TASK: Paint EVERY visible wall and trim surface in this room HEX: ${hexColor}. REPLACE existing pigments with 100% OPACITY. Separate COLOR from LIGHTING. Ensure Burgundy and Navy are RICH and SATURATED, not black. Ensure Cream is WARM and BUTTERY, not white. Output ONLY the image.`;

  const data = await callGemini('gemini-3.1-flash-image-preview', {
    contents: [{
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { text: recolorPrompt },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });

  return getImageFromResponse(data);
};

export const extractPatternFromImage = async (
  imageBase64: string,
  imageMimeType: string
): Promise<{ base64: string; mimeType: string }> => {
  const data = await callGemini('gemini-3.1-flash-image-preview', {
    contents: [{
      parts: [
        { inlineData: { data: imageBase64, mimeType: imageMimeType } },
        { text: 'Extract a clean, flat, front-facing tileable wallpaper pattern swatch from this image. Remove all background.' },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });
  return getImageFromResponse(data);
};

export const applyStyle = async (
  roomBase64: string,
  roomMimeType: string,
  styleBase64: string,
  styleMimeType: string,
): Promise<{ base64: string; mimeType: string }> => {
  const data = await callGemini('gemini-3.1-flash-image-preview', {
    contents: [{
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { inlineData: { data: styleBase64, mimeType: styleMimeType } },
        { text: 'Wallpaper EVERY SINGLE wall in this image with the provided pattern. 100% coverage. Maintain scale and perspective. Output ONLY image.' },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });
  return getImageFromResponse(data);
};

export const applyPanelling = async (
  roomBase64: string,
  roomMimeType: string,
  style: string,
  height: string,
  colorDescription: string
): Promise<{ base64: string; mimeType: string }> => {
  const data = await callGemini('gemini-3.1-flash-image-preview', {
    contents: [{
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { text: `Add ${style} wall panelling to ${height} of ALL walls. Color: ${colorDescription}. Real wood texture. Output ONLY image.` },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });
  return getImageFromResponse(data);
};

export const editText = async (
  imageBase64: string,
  imageMimeType: string,
  prompt: string
): Promise<{ base64: string; mimeType: string }> => {
  const isChangingWalls = /wall|skirting|paint|wallpaper|trim|skirt/i.test(prompt);

  const enhancedPrompt = `
    TASK: ${prompt}
    **DESIGN LOCKDOWN DIRECTIVE (MANDATORY):**
    ${!isChangingWalls ? `
    - The WALLS and TRIM are DELIBERATE DESIGN CHOICES.
    - DO NOT change the color, pattern, or saturation of the walls or skirting.
    - Treat wall surfaces as a PROTECTED LAYER.
    ` : `
    - If modifying wall/trim color: Use DESTRUCTIVE OVERWRITE. Replace with 100% opacity.
    - "Cream" = Buttery warm. "Burgundy" = Deep saturated red. "Navy" = Visible blue.
    `}
    - Maintain consistent lighting and photo-realism.
    - ONLY change the specific objects or areas requested.
  `;

  const data = await callGemini('gemini-3.1-flash-image-preview', {
    contents: [{
      parts: [
        { inlineData: { data: imageBase64, mimeType: imageMimeType } },
        { text: enhancedPrompt },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });
  return getImageFromResponse(data);
};

export const getDesignIdeasFromImage = async (
  roomBase64: string,
  roomMimeType: string
): Promise<{ text: string, sources?: GroundingChunk[] }> => {
  const data = await callGemini('gemini-2.5-flash', {
    contents: [{
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { text: 'Suggest 3-5 additive decor items (plants, art, lighting) for this room. Concise bullets.' },
      ],
    }],
    tools: [{ googleSearch: {} }],
  });

  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    sources: data.candidates?.[0]?.groundingMetadata?.groundingChunks,
  };
};

export const implementDesignIdeas = async (
  roomBase64: string,
  roomMimeType: string,
  idea: string
): Promise<{ base64: string; mimeType: string }> => {
  const enhancedPrompt = `Implement: ${idea}. **DESIGN LOCKDOWN:** Preserve the current wall colors/patterns and floor exactly as they are. Only add new elements.`;

  const data = await callGemini('gemini-3.1-flash-image-preview', {
    contents: [{
      parts: [
        { inlineData: { data: roomBase64, mimeType: roomMimeType } },
        { text: enhancedPrompt },
      ],
    }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });
  return getImageFromResponse(data);
};

export const generateWallpaperSwatch = async (
  prompt: string
): Promise<{ base64: string; mimeType: string }> => {
  const data = await callGemini('imagen-4.0-generate-001', {
    prompt: `Tileable wallpaper swatch: ${prompt}`,
    generationConfig: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
  });

  if (data.generatedImages?.[0]) {
    return { base64: data.generatedImages[0].image.imageBytes, mimeType: 'image/png' };
  }
  throw new Error('Generation failed.');
};
