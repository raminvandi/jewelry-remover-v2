import { useState, useCallback } from 'react';
import { UploadedImage } from '../types';
import { ImageProcessor } from '../services/imageProcessor';

export const useImageProcessing = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingImage, setEditingImage] = useState<UploadedImage | null>(null);

  const addImages = useCallback((newImages: UploadedImage[]) => {
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const updateImageStatus = useCallback((id: string, updates: Partial<UploadedImage>) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  }, []);

  const processImage = useCallback(async (image: UploadedImage) => {
    try {
      // Stage 1: Remove jewelry (This part is correct and stays the same)
      updateImageStatus(image.id, { 
        status: 'processing-stage1', 
        progress: 25 
      });
      
      const defaultHotspot = { x: 500, y: 500 };
      const jewelryRemovalResult = await ImageProcessor.removeJewelry(image.file, defaultHotspot);
      
      if (!jewelryRemovalResult.success || !jewelryRemovalResult.imageUrl) {
        updateImageStatus(image.id, {
          status: 'error',
          error: jewelryRemovalResult.error || 'Failed to remove jewelry',
          progress: 0
        });
        return;
      }

      updateImageStatus(image.id, {
        progress: 50,
        jewelryRemovedUrl: jewelryRemovalResult.imageUrl
      });

      // --- START OF THE FIX ---

      // Intermediate Step: Upload to imgbb to get a public URL
      updateImageStatus(image.id, { 
        status: 'processing-stage2', // Reuse this status for user feedback
        progress: 65, // Update progress
      });

      const publicUrl = await ImageProcessor.uploadImageForPublicUrl(jewelryRemovalResult.imageUrl);

      // Stage 2: Upscale image
      updateImageStatus(image.id, { 
        status: 'processing-stage2', 
        progress: 80 
      });

      // This now sends the public URL, not the large data string
      const upscalingResult = await ImageProcessor.upscaleImage(publicUrl);

      // --- END OF THE FIX ---

      if (!upscalingResult.success) {
        updateImageStatus(image.id, {
          status: 'completed',
          progress: 100,
          error: `Upscaling failed: ${upscalingResult.error}`
        });
        return;
      }

      updateImageStatus(image.id, {
        status: 'completed',
        progress: 100,
        upscaledUrl: upscalingResult.imageUrl,
        error: undefined
      });

    } catch (error) {
      updateImageStatus(image.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed',
        progress: 0
      });
    }
  }, [updateImageStatus]);

  const processAllPendingImages = useCallback(async () => {
    setIsProcessing(true);
    const pendingImages = images.filter(img => img.status === 'pending');
    
    // Process images in parallel with a concurrency limit
    const concurrency = 3;
    const chunks = [];
    
    for (let i = 0; i < pendingImages.length; i += concurrency) {
      chunks.push(pendingImages.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(processImage));
    }
    
    setIsProcessing(false);
  }, [images, processImage]);

  const clearAll = useCallback(() => {
    images.forEach(image => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
    setImages([]);
  }, [images]);

  return {
    images,
    isProcessing,
    editingImage,
    setEditingImage,
    addImages,
    removeImage,
    processAllPendingImages,
    clearAll
  };
};