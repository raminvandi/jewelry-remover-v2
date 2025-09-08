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
      // Stage 1: Remove jewelry
      updateImageStatus(image.id, { 
        status: 'processing-stage1', 
        progress: 25 
      });
      
      // NOTE: We will need a way to get a hotspot. For now, we'll keep the default.
      // A future improvement could be asking the user to click on the jewelry first.
      const defaultHotspot = { x: 500, y: 500 };
      const jewelryRemovalResult = await ImageProcessor.removeJewelry(image.file, defaultHotspot);
      
      if (!jewelryRemovalResult.success || !jewelryRemovalResult.imageUrl) {
        updateImageStatus(image.id, {
          status: 'error',
          error: jewelryRemovalResult.error || 'Failed to remove jewelry',
        });
        return;
      }

      // --- THIS IS THE KEY CHANGE ---
      // Instead of continuing, set the status to 'awaiting_choice' and finish.
      updateImageStatus(image.id, {
        status: 'awaiting_choice',
        progress: 100, // Progress of this stage is 100%
        jewelryRemovedUrl: jewelryRemovalResult.imageUrl,
      });

    } catch (error) {
      updateImageStatus(image.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed',
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