
// Fix: Implement fileToBase64 to convert a File object to a base64 string.
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // We only want the base64 part, not the data URL prefix
        const base64 = reader.result.split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Could not extract base64 string from file.'));
        }
      } else {
        reject(new Error('File could not be read as a data URL string.'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Fix: Implement addWatermark to draw text on an image using a canvas.
export const addWatermark = (base64Image: string, text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Handle both raw base64 and data URLs
    img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      // 1. Draw Main Image
      ctx.drawImage(img, 0, 0);

      // 2. Configure Watermark Text
      // Increased size by another 70% relative to the previous version
      // (approx 0.05 * 1.7 = 0.085)
      // Minimum size increased to 60px.
      const fontSize = Math.max(60, Math.min(img.width, img.height) * 0.085);
      
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Position logic (Center)
      const x = canvas.width / 2;
      const y = canvas.height / 2;

      // 3. Draw Text
      ctx.save();
      // Semi-transparent white (0.5 alpha) so image behind is visible
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      // Semi-transparent black shadow to ensure readability on light backgrounds
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText(text, x, y);
      ctx.restore();

      resolve(canvas.toDataURL());
    };

    img.onerror = (e) => reject(new Error(`Failed to load main image: ${e}`));
  });
};

// Fix: Add missing 'imageUrlToBase64' function to fetch an image from a URL and convert it to a base64 string.
export const imageUrlToBase64 = async (url: string): Promise<{ base64: string, mimeType: string }> => {
  // Use a public CORS proxy to fetch images from third-party domains.
  // This is necessary because browsers block direct `fetch` requests to different origins (CORS policy).
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch the image swatch from ${url} (via proxy). Status: ${response.status} ${response.statusText}. The AI might have provided an invalid link, or the website is blocking access.`);
  }
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        if (base64) {
          resolve({ base64, mimeType: blob.type });
        } else {
          reject(new Error('Could not extract base64 string from image URL.'));
        }
      } else {
        reject(new Error('Image URL could not be read as a data URL string.'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const createSwatchFromHex = (hex: string): { base64: string; mimeType: string } => {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context to create color swatch.');
  }
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  
  if (!base64) {
      throw new Error('Could not generate base64 string from canvas.');
  }

  return { base64, mimeType: 'image/png' };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const getHexFromImageUrl = (url: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const { base64, mimeType } = await imageUrlToBase64(url);
      const img = new Image();
      img.src = `data:${mimeType};base64,${base64}`;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          return reject(new Error('Could not get canvas context to extract color.'));
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const pixelData = ctx.getImageData(centerX, centerY, 1, 1).data;

        const hex = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
        resolve(hex);
      };

      img.onerror = (error) => {
        reject(new Error(`Failed to load image from URL to extract color: ${error}`));
      };
    } catch (e) {
      reject(e);
    }
  });
};

export const getHexFromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error('Could not read file as data URL.'));
            }
            
            const img = new Image();
            img.src = reader.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 50;
                canvas.height = 50;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    return reject(new Error('Could not get canvas context to extract color.'));
                }

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const centerX = Math.floor(canvas.width / 2);
                const centerY = Math.floor(canvas.height / 2);
                const pixelData = ctx.getImageData(centerX, centerY, 1, 1).data;

                const hex = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
                resolve(hex);
            };

            img.onerror = (error) => {
                reject(new Error(`Failed to load image from file to extract color: ${error}`));
            };
        };
        reader.onerror = (error) => reject(error);
    });
};
