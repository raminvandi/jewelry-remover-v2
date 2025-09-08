import { ProcessingResult, GeminiResponse, EnhancorResponse } from '../types';

const IMGBB_API_KEY = '3c0b39d4ea5cc580cbf69990aa847630';

export class ImageProcessor {
  static async fileToBase64(file: File): Promise<string> {
    // This function is correct and does not need changes.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static async removeJewelry(file: File, hotspot: { x: number, y: number }): Promise<ProcessingResult> {
    // This function is correct and does not need changes.
    try {
      // IMPORTANT: Use the environment variable provided by Vite
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        throw new Error("Gemini API key is missing. Please check your environment variables.");
      }

      const base64Image = await this.fileToBase64(file);
      const mimeType = file.type;
      const userPrompt = "remove the jewelry at this location";
      const systemPrompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image outside the edit area must remain identical.
- Output ONLY the final edited image. Do not return text.`;

      const requestBody = {
        contents: [{
          parts: [{
            text: systemPrompt
          }, {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }]
        }]
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data: GeminiResponse = await response.json();
      const candidate = data.candidates?.[0];
      if (!candidate) throw new Error('No candidates received from Gemini API');
      const parts = candidate.content?.parts;
      if (!parts || parts.length === 0) throw new Error('No content parts received from Gemini API');
      
      let imageData = null;
      let mimeTypeResponse = null;
      for (const part of parts) {
        if (part.inline_data?.data) {
          imageData = part.inline_data.data;
          mimeTypeResponse = part.inline_data.mime_type;
          break;
        }
        if (part.inlineData?.data) {
          imageData = part.inlineData.data;
          mimeTypeResponse = part.inlineData.mimeType;
          break;
        }
      }

      if (!imageData) {
        console.error('Gemini API Response:', JSON.stringify(data, null, 2));
        const textPart = parts.find(part => part.text);
        if (textPart && textPart.text.toLowerCase().includes('cannot directly manipulate')) {
          return { success: false, error: 'The Gemini API cannot directly manipulate images.' };
        }
        return { success: false, error: 'No image data received from Gemini API.' };
      }
      const imageUrl = `data:${mimeTypeResponse || mimeType};base64,${imageData}`;
      return { success: true, imageUrl };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async uploadImageForPublicUrl(base64DataUrl: string): Promise<string> {
    // This function is correct and does not need changes.
    try {
      const base64Data = base64DataUrl.split(',')[1];
      const formData = new FormData();
      formData.append('image', base64Data);
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload intermediate image to hosting service.');
      const result = await response.json();
      if (!result.success || !result.data.url) throw new Error('Image hosting service did not return a valid URL.');
      return result.data.url;
    } catch (error) {
      console.error("Temporary upload to imgbb failed:", error);
      throw error;
    }
  }

  static async upscaleImage(imageUrl: string): Promise<ProcessingResult> {
    try {
      const requestBody = {
        img_url: imageUrl,
        mode: "fast",
        // --- CHANGE #1: ADDED REQUIRED webhookUrl PARAMETER ---
        // Even though we poll, the API docs say this is required.
        webhookUrl: "https://example.com/webhook-placeholder"
      };

      const response = await fetch('/api-enhancor/api/upscaler/v1/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Enhancor API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const taskId = data.requestId;

      if (!data.success || !taskId) {
        throw new Error(data.error || 'Failed to initiate upscaling with Enhancor');
      }

      const upscaledUrl = await this.pollUpscalingStatus(taskId);
      
      return { success: true, imageUrl: upscaledUrl };
    } catch (error) {
      console.error('Enhancor Upscale Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error during Enhancor upscaling' };
    }
  }

  private static async pollUpscalingStatus(taskId: string): Promise<string> {
    // --- CHANGE #2: INCREASED TIMEOUT FROM 60s to 120s ---
    const maxAttempts = 60; // 60 attempts * 2 seconds = 120-second timeout
    let attempts = 0;
    let lastResponseJson = null;

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

        try {
            const response = await fetch('/api-enhancor/api/upscaler/v1/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request_id: taskId })
            });

            if (!response.ok) {
                console.warn(`[Attempt ${attempts}] Status check failed with HTTP status: ${response.status}. Retrying...`);
                continue;
            }

            const data = await response.json();
            lastResponseJson = data;

            console.log(`[Attempt ${attempts}/${maxAttempts}] Enhancor status response:`, JSON.stringify(data));

            const status = data.status ? String(data.status).toUpperCase() : '';
            const finalUrl = data.result || data.result_url;

            if (status === 'COMPLETED' && finalUrl) {
                console.log("Success! Found 'COMPLETED' status and result URL.");
                return finalUrl;
            }

            if (status === 'FAILED') {
                const errorMessage = data.error || 'Enhancor reported that the upscaling process failed.';
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error(`Polling attempt ${attempts} encountered an error:`, error);
            if (attempts >= maxAttempts) {
              throw error;
            }
        }
    }

    throw new Error(
      `Upscaling timed out. Last API response was: ${JSON.stringify(lastResponseJson)}`
    );
  }

  static async processWithNanoBanana(base64Image: string, prompt: string): Promise<ProcessingResult> {
    try {
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        throw new Error("Gemini API key is missing.");
      }

      const systemPrompt = `You are an expert, creative photo editor AI. Your task is to perform an edit on the provided image based on the user's request.
User Request: "${prompt}"
Guidelines:
The edit must be creative and high-quality.
The output image MUST be the same dimensions as the input image (1024x1024).
Blend the edit realistically unless a specific artistic style is requested.
Output ONLY the final edited image. Do not return text.`;

      const requestBody = {
        contents: [{
          parts: [
            { text: systemPrompt },
            { inline_data: { mime_type: 'image/png', data: base64Image.split(',')[1] } }
          ]
        }]
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Nano Banana (Gemini) API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      
      // Robust response handling
      const candidate = data.candidates?.[0];
      if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`AI generation stopped for reason: ${candidate.finishReason}`);
      }

      const imagePart = candidate?.content?.parts?.find(p => p.inline_data || p.inlineData);
      if (!imagePart) {
        throw new Error('AI response did not contain an image.');
      }

      const imageData = (imagePart.inline_data || imagePart.inlineData)!.data;
      const mimeType = (imagePart.inline_data || imagePart.inlineData)!.mime_type;
      const imageUrl = `data:${mimeType};base64,${imageData}`;

      return { success: true, imageUrl };

    } catch (error) {
      console.error('Nano Banana (Gemini) Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error during AI generation' };
    }
  }

  static downloadImage(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async applyMask(
    originalUpscaledImageUrl: string,
    replacementYImageUrl: string,
    maskCanvas: HTMLCanvasElement,
    cropData: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const originalImg = new Image();
      const replacementImg = new Image();
      let loadedCount = 0;

      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          try {
            // Create final canvas with original image dimensions
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = originalImg.naturalWidth;
            finalCanvas.height = originalImg.naturalHeight;
            const finalCtx = finalCanvas.getContext('2d');

            if (!finalCtx) {
              reject(new Error('Could not get final canvas context'));
              return;
            }

            // Draw the original upscaled image as base layer
            finalCtx.drawImage(originalImg, 0, 0);

            // Create temporary canvas for masked replacement image
            const maskedYCanvas = document.createElement('canvas');
            maskedYCanvas.width = cropData.width;
            maskedYCanvas.height = cropData.height;
            const maskedYCtx = maskedYCanvas.getContext('2d');

            if (!maskedYCtx) {
              reject(new Error('Could not get masked Y canvas context'));
              return;
            }

            // Draw replacement image onto masked canvas
            maskedYCtx.drawImage(replacementImg, 0, 0, cropData.width, cropData.height);

            // Create blurred mask canvas
            const blurredMaskCanvas = document.createElement('canvas');
            blurredMaskCanvas.width = cropData.width;
            blurredMaskCanvas.height = cropData.height;
            const blurredMaskCtx = blurredMaskCanvas.getContext('2d');

            if (!blurredMaskCtx) {
              reject(new Error('Could not get blurred mask canvas context'));
              return;
            }

            // Calculate scaling factors from mask canvas to crop area
            const scaleX = cropData.width / maskCanvas.offsetWidth;
            const scaleY = cropData.height / maskCanvas.offsetHeight;

            // Calculate source rectangle on mask canvas that corresponds to crop area
            const maskSrcX = cropData.x / originalImg.naturalWidth * maskCanvas.offsetWidth;
            const maskSrcY = cropData.y / originalImg.naturalHeight * maskCanvas.offsetHeight;
            const maskSrcWidth = cropData.width / originalImg.naturalWidth * maskCanvas.offsetWidth;
            const maskSrcHeight = cropData.height / originalImg.naturalHeight * maskCanvas.offsetHeight;

            // Draw the relevant portion of the mask canvas onto blurred mask canvas
            blurredMaskCtx.drawImage(
              maskCanvas,
              maskSrcX, maskSrcY, maskSrcWidth, maskSrcHeight,
              0, 0, cropData.width, cropData.height
            );

            // Apply blur to the mask
            blurredMaskCtx.filter = 'blur(15px)';
            blurredMaskCtx.drawImage(blurredMaskCanvas, 0, 0);
            blurredMaskCtx.filter = 'none';

            // Apply mask to replacement image using destination-in composite operation
            maskedYCtx.globalCompositeOperation = 'destination-in';
            maskedYCtx.drawImage(blurredMaskCanvas, 0, 0);
            maskedYCtx.globalCompositeOperation = 'source-over';

            // Draw the masked replacement image onto final canvas at crop position
            finalCtx.drawImage(maskedYCanvas, cropData.x, cropData.y);

            const finalDataUrl = finalCanvas.toDataURL('image/png');
            resolve(finalDataUrl);
          } catch (error) {
            reject(error);
          }
        }
      };

      const onImageError = () => {
        reject(new Error('Failed to load one or more images for masking'));
      };

      originalImg.crossOrigin = 'anonymous';
      replacementImg.crossOrigin = 'anonymous';
      originalImg.onload = onImageLoad;
      replacementImg.onload = onImageLoad;
      originalImg.onerror = onImageError;
      replacementImg.onerror = onImageError;
      originalImg.src = originalUpscaledImageUrl;
      replacementImg.src = replacementYImageUrl;
    });
  }

  static async cropSquareFromCenter(
    imageUrl: string, 
    centerX: number, 
    centerY: number, 
    outputSize: number
  ): Promise<{ dataUrl: string; cropDetails: { x: number; y: number; width: number; height: number } }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, outputSize, outputSize);

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        let sx, sy, sWidth, sHeight;
        let dx = 0, dy = 0, dWidth = outputSize, dHeight = outputSize;

        if (imgWidth < outputSize && imgHeight < outputSize) {
          // Image is smaller than output size - center it
          sx = 0;
          sy = 0;
          sWidth = imgWidth;
          sHeight = imgHeight;
          dx = (outputSize - imgWidth) / 2;
          dy = (outputSize - imgHeight) / 2;
          dWidth = imgWidth;
          dHeight = imgHeight;
        } else {
          // Image is larger - crop from center point
          const halfSize = outputSize / 2;
          sx = Math.max(0, Math.min(centerX - halfSize, imgWidth - outputSize));
          sy = Math.max(0, Math.min(centerY - halfSize, imgHeight - outputSize));
          sWidth = outputSize;
          sHeight = outputSize;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        
        const dataUrl = canvas.toDataURL('image/png');
        const cropDetails = { x: sx, y: sy, width: sWidth, height: sHeight };
        
        resolve({ dataUrl, cropDetails });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  static async replaceArea(
    originalImageUrl: string,
    replacementImageUrl: string,
    cropData: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const originalImg = new Image();
      const replacementImg = new Image();
      let loadedCount = 0;

      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = originalImg.naturalWidth;
            canvas.height = originalImg.naturalHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }

            // Draw the original image
            ctx.drawImage(originalImg, 0, 0);

            // Draw the replacement image on top at the specified location
            ctx.drawImage(
              replacementImg,
              cropData.x,
              cropData.y,
              cropData.width,
              cropData.height
            );

            const compositedDataUrl = canvas.toDataURL('image/png');
            resolve(compositedDataUrl);
          } catch (error) {
            reject(error);
          }
        }
      };

      const onImageError = () => {
        reject(new Error('Failed to load one or more images'));
      };

      originalImg.crossOrigin = 'anonymous';
      replacementImg.crossOrigin = 'anonymous';
      originalImg.onload = onImageLoad;
      replacementImg.onload = onImageLoad;
      originalImg.onerror = onImageError;
      replacementImg.onerror = onImageError;
      originalImg.src = originalImageUrl;
      replacementImg.src = replacementImageUrl;
    });
  }
}