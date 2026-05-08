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
        colorPrompt = `Provide a PRECISE HEX code for: "${colorQuery}". "Cream" MUST be warm and yellow-toned (#F3E5AB). "Navy" or "Dark Blue" MUST be visibly blue (#121F33). "Burgundy" MUST be a deep, saturated wine-red (#800020). "Bright Yellow" MUST be a vivid yellow (#FFD700). Return ONLY the HEX code.`;
      }

      const colorData = await callGemini('gemini-2.5-flash', {
        contents: [{ parts: [{ text: colorPrompt }] }],
        tools: [{ googleSearch: {} }],
      });

      const colorText = colorData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      hexColor = colorText.startsWith('#') ? colorText : `#${colorText}`;
    }
  }

  const recolorPrompt = `TASK: Repaint ONLY the walls of this room with HEX colour: ${hexColor}.

**STRICT RULES - MANDATORY:**
- ONLY change the colour of wall surfaces. Nothing else.
- Do NOT paint the ceiling — leave it exactly as it is.
- Do NOT add any architectural features, dado rails, picture rails, borders, stripes or decorative elements that do not already exist in the original image.
- Do NOT modify or add any wall features — paint the walls as flat smooth surfaces in the exact HEX colour specified.
- The HEX colour ${hexColor} is the user's deliberate choice — apply it exactly. Do NOT substitute a different colour even if it seems unusual.
- DO NOT change the colour, pattern or texture of ANY of the following — this is an absolute rule:
  * Furniture (sofas, chairs, tables, shelves)
  * Soft furnishings (cushions, throws, blankets)
  * Window treatments (curtains, blinds, shutters) — leave these EXACTLY as they are including colour and pattern
  * Floor coverings (rugs, carpets, wooden floors, tiles)
  * Lighting (lamps, pendants, spotlights)
  * Artwork, mirrors, plants, decorative objects
  * Doors, windows and door frames
- Every single object in the room must look IDENTICAL to the original image except the wall colour.
- Apply the paint colour with 100% opacity on walls only.
- Maintain realistic lighting, shadows and depth on the walls.
- Output ONLY the final image.`;

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
        { text: `Apply the provided wallpaper pattern to EVERY wall surface in this room.

**STRICT RULES - MANDATORY:**
- Apply wallpaper to wall surfaces ONLY.
- Do NOT apply wallpaper to the ceiling — leave it exactly as it is.
- DO NOT change the colour, pattern or texture of ANY of the following:
  * Furniture (sofas, chairs, tables, shelves)
  * Soft furnishings (cushions, throws, blankets)
  * Window treatments (curtains, blinds, shutters) — leave these EXACTLY as they are
  * Floor coverings (rugs, carpets, wooden floors, tiles)
  * Lighting (lamps, pendants, spotlights)
  * Artwork, mirrors, plants, decorative objects
  * Doors, windows and door frames
- Every single object must look IDENTICAL to the original image except the walls.
- Maintain realistic scale and perspective of the wallpaper pattern.
- Output ONLY the final image.` },
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
        { text: `Add ${style} wall panelling to ${height} of ALL walls in colour: ${colorDescription}.

**STRICT RULES - MANDATORY:**
- Add panelling to wall surfaces ONLY.
- Do NOT apply panelling to the ceiling — leave it exactly as it is.
- DO NOT change the colour, pattern or texture of ANY of the following:
  * Furniture (sofas, chairs, tables, shelves)
  * Soft furnishings (cushions, throws, blankets)
  * Window treatments (curtains, blinds, shutters) — leave these EXACTLY as they are
  * Floor coverings (rugs, carpets, wooden floors, tiles)
  * Lighting (lamps, pendants, spotlights)
  * Artwork, mirrors, plants, decorative objects
  * Doors, windows and door frames
- Every single object must look IDENTICAL to the original image except the walls.
- Use realistic wood texture and shadow depth on the panelling.
- Output ONLY the final image.` },
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
    - The WALLS, CEILING and TRIM are DELIBERATE DESIGN CHOICES. DO NOT change them.
    - DO NOT change the colour, pattern, or saturation of the walls, ceiling or skirting.
    - DO NOT change the colour, pattern or texture of any furniture, cushions, rugs, curtains, blinds or other objects unless explicitly asked.
    - Treat wall surfaces, ceiling and all existing furniture as PROTECTED LAYERS.
    ` : `
    - If modifying wall/trim colour: Use DESTRUCTIVE OVERWRITE on walls only. Replace with 100% opacity.
    - Do NOT paint the ceiling unless explicitly asked.
    - DO NOT change furniture, cushions, rugs, curtains or other objects.
    - "Cream" = Buttery warm. "Burgundy" = Deep saturated red. "Navy" = Visible blue.
    `}
    - Maintain consistent lighting and photo-realism.
    - ONLY change the specific objects or areas explicitly requested.
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
  const enhancedPrompt = `Implement: ${idea}.

**DESIGN LOCKDOWN - MANDATORY:**
- Preserve the current wall colours, patterns, ceiling and floor EXACTLY as they are.
- DO NOT change the colour, pattern or texture of any existing furniture, cushions, rugs, curtains, blinds or other objects.
- Only ADD the new requested elements to the scene.
- Output ONLY the final image.`;

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
