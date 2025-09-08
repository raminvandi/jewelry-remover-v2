import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { UploadedImage } from '../types';
import { ImageProcessor } from '../services/imageProcessor';

interface EditModalProps {
  image: UploadedImage;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ image, onClose }) => {
  const sourceImageUrl = image.jewelryRemovedUrl || image.preview;

  const [prompt, setPrompt] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // For showing the dot on the screen
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  // For sending coordinates to the AI
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);

  const [activeImage, setActiveImage] = useState<string>(sourceImageUrl);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, offsetWidth, offsetHeight } = img;
    const scaleX = naturalWidth / offsetWidth;
    const scaleY = naturalHeight / offsetHeight;

    setEditHotspot({ x: Math.round(offsetX * scaleX), y: Math.round(offsetY * scaleY) });
  };
  
  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductImage(e.target.files[0]);
    }
  };
  
  const handleGenerate = async () => {
      if (!editHotspot) {
          alert("Please click on the image to select a location for the product placement.");
          return;
      }
      if (!prompt.trim() && !productImage) {
          alert("Please provide a text prompt or a product image.");
          return;
      }
      
      setIsLoading(true);
      
      // We will create this function in the next step.
      // const result = await ImageProcessor.generateProductPlacement(
      //   activeImage, 
      //   productImage, 
      //   prompt, 
      //   editHotspot
      // );
      
      // For now, just log it.
      console.log("Generating with:", {
          prompt,
          productImage,
          hotspot: editHotspot
      });
      
      // Simulate a delay
      setTimeout(() => {
        setIsLoading(false);
        alert("AI generation is not connected yet. See console for details.");
      }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Product Placement: {image.originalName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          <div className="relative w-fit mx-auto cursor-crosshair" onClick={handleImageClick}>
            <img ref={imgRef} src={activeImage} alt="Editing area" className="max-h-[50vh] rounded-md" />
            {displayHotspot && (
              <div 
                className="absolute rounded-full w-6 h-6 bg-blue-500/50 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${displayHotspot.x}px`, top: `${displayHotspot.y}px` }}
              >
                <div className="absolute inset-0 rounded-full w-full h-full animate-ping bg-blue-400"></div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-start gap-4">
            <div className="flex-grow">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={editHotspot ? "e.g., 'a can of soda with a red label'" : "First, click a point on the image"}
                className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={!editHotspot || isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Describe the product or the change you want to make.</p>
            </div>

            <div className="flex-shrink-0">
              <input type="file" ref={fileInputRef} onChange={handleProductImageSelect} className="hidden" accept="image/*" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                <Upload className="w-5 h-5" />
                {productImage ? "Change Image" : "Add Image"}
              </button>
              {productImage && <p className="text-xs text-center mt-1 truncate max-w-[120px]">{productImage.name}</p>}
            </div>

            <button 
              onClick={handleGenerate}
              className="px-8 py-3 bg-blue-600 text-white font-bold text-base rounded-lg transition-colors hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isLoading || !editHotspot || (!prompt.trim() && !productImage)}
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};