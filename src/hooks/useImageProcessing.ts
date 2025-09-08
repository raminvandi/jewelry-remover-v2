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

  const _performJewelryRemoval = async (image: UploadedImage): Promise<string | null> => {
    updateImageStatus(image.id, { status: 'processing-stage1', progress: 10 });
    const defaultHotspot = { x: 500, y: 500 }; // This can be improved later
    const result = await ImageProcessor.removeJewelry(image.file, defaultHotspot);

    if (!result.success || !result.imageUrl) {
      updateImageStatus(image.id, { status: 'error', error: result.error || 'Jewelry removal failed.' });
      return null;
    }
    return result.imageUrl;
  };

  const clearAll = useCallback(() => {
    images.forEach(image => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
    setImages([]);
  }, [images]);

  const startUpscaleWorkflow = useCallback(async (image: UploadedImage) => {
    setIsProcessing(true);
    const jewelryRemovedUrl = await _performJewelryRemoval(image);

    if (!jewelryRemovedUrl) {
      setIsProcessing(false);
      return; // Error was already set in the helper function
    }

    updateImageStatus(image.id, { status: 'processing-stage2', progress: 50, jewelryRemovedUrl });
    

    try {
      const publicUrl = await ImageProcessor.uploadImageForPublicUrl(jewelryRemovedUrl);
      updateImageStatus(image.id, { progress: 75 });

      const upscalingResult = await ImageProcessor.upscaleImage(publicUrl);
      if (!upscalingResult.success) throw new Error(upscalingResult.error);

      updateImageStatus(image.id, {
        status: 'completed',
        progress: 100,
        upscaledUrl: upscalingResult.imageUrl
      });
    } catch (error) {
      updateImageStatus(image.id, { status: 'error', error: error instanceof Error ? error.message : 'Upscale failed.' });
    }
    setIsProcessing(false);
  }, [updateImageStatus]);

  const startProductPlacementWorkflow = useCallback(async (image: UploadedImage) => {
    setIsProcessing(true);
    const jewelryRemovedUrl = await _performJewelryRemoval(image);

    if (!jewelryRemovedUrl) {
      setIsProcessing(false);
      return;
    }
    
    // Update the image object with the result before opening the modal
    const updatedImage = { ...image, jewelryRemovedUrl, status: 'completed' as const };
    updateImageStatus(image.id, updatedImage);

    // Now open the modal with the fully prepared image object
    setEditingImage(updatedImage);
    setIsProcessing(false);
  }, [updateImageStatus]);

  return {
    images,
    isProcessing,
    editingImage,
    setEditingImage,
    addImages,
    removeImage,
    clearAll,
    startUpscaleWorkflow,
    startProductPlacementWorkflow
  };
};