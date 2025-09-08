import React, { useState, useRef, useEffect } from 'react';
import { X, Brush } from 'lucide-react';
import { UploadedImage } from '../types';
import { ImageProcessor } from '../services/imageProcessor';

interface EditModalProps {
  image: UploadedImage;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ image, onClose }) => {
  const [croppedImageX, setCroppedImageX] = useState<string | null>(null);
  const [cropDetails, setCropDetails] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [activeImage, setActiveImage] = useState<string>(image.upscaledUrl || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isFinalImageReady, setIsFinalImageReady] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update mask canvas dimensions when image loads or changes
  useEffect(() => {
    const updateCanvasDimensions = () => {
      if (imgRef.current && maskCanvasRef.current) {
        const img = imgRef.current;
        const canvas = maskCanvasRef.current;
        canvas.width = img.offsetWidth;
        canvas.height = img.offsetHeight;
        
        // Clear the canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    // Update dimensions after image loads
    if (imgRef.current) {
      if (imgRef.current.complete) {
        updateCanvasDimensions();
      } else {
        imgRef.current.onload = updateCanvasDimensions;
      }
    }
  }, [activeImage]);

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    
    // Get click coordinates relative to the displayed image
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Calculate the scale factors to convert to natural image coordinates
    const scaleX = img.naturalWidth / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;
    
    // Convert to natural image coordinates
    const centerX = Math.round(clickX * scaleX);
    const centerY = Math.round(clickY * scaleY);
    
    try {
      const result = await ImageProcessor.cropSquareFromCenter(
        image.upscaledUrl!,
        centerX,
        centerY,
        1024
      );
      setCroppedImageX(result.dataUrl);
      setCropDetails(result.cropDetails);
    } catch (error) {
      console.error('Failed to crop image:', error);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current) return;
    
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      draw(e);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
  };

  const handleApplyMask = async () => {
    if (!maskCanvasRef.current || !cropDetails || !croppedImageX) {
      alert('Please create a crop and draw a mask first');
      return;
    }

    try {
      const blendedImage = await ImageProcessor.applyMask(
        image.upscaledUrl!,
        croppedImageX,
        maskCanvasRef.current,
        cropDetails
      );
      
      setActiveImage(blendedImage);
      setIsFinalImageReady(true);
      
      // Clear the mask canvas after applying
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
    } catch (error) {
      console.error('Failed to apply mask:', error);
      alert('Failed to apply mask. Please try again.');
    }
  };

  const clearMask = () => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
    }
  };

  // Simulate nanoBananaResultY for testing (temporary)
  const handleTestComposite = async () => {
    if (!cropDetails) return;
    
    try {
      // Create a simple colored square as placeholder replacement
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff6b6b'; // Red color as placeholder
        ctx.fillRect(0, 0, 1024, 1024);
        const placeholderDataUrl = canvas.toDataURL('image/png');
        
        const compositedImage = await ImageProcessor.replaceArea(
          image.upscaledUrl!,
          placeholderDataUrl,
          cropDetails
        );
        
        setActiveImage(compositedImage);
        setIsFinalImageReady(false); // Reset since this is just a test composite
      }
    } catch (error) {
      console.error('Failed to composite image:', error);
    }
  };

  const handleDownloadFinalImage = () => {
    const filename = `${image.originalName}_jewelryfree_edited.png`;
    ImageProcessor.downloadImage(activeImage, filename);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-6xl max-h-[90vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Refine Image: {image.originalName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Image Display */}
        <div className="p-6 bg-gray-50">
          <div className="flex justify-center items-center mb-4">
            <div className="relative max-w-full max-h-[60vh] overflow-hidden rounded-lg shadow-lg">
              <img
                ref={imgRef}
                src={activeImage}
                alt={`Upscaled ${image.originalName}`}
                className="max-w-full max-h-full object-contain cursor-crosshair"
                onClick={handleImageClick}
              />
              <canvas
                ref={maskCanvasRef}
                className="absolute top-0 left-0 cursor-crosshair"
                style={{ pointerEvents: croppedImageX ? 'auto' : 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          </div>
          
          {/* Masking Controls */}
          {croppedImageX && (
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <Brush className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Brush Size:</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-gray-600 w-8">{brushSize}</span>
              </div>
              
              <button
                onClick={clearMask}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Mask
              </button>
              
              <button
                onClick={handleApplyMask}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Apply Mask
              </button>
            </div>
          )}
        </div>
        
        {/* Instructions */}
        {croppedImageX && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Paint over the areas where you want to keep the generated content. 
              The mask will create a soft, feathered blend between the original and generated images.
            </p>
          </div>
        )}
        
        {/* Cropped Image Preview */}
        {croppedImageX && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cropped Selection (1024x1024)</h3>
            <div className="flex justify-center items-center space-x-6">
              <div className="w-64 h-64 border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <img
                  src={croppedImageX}
                  alt="Cropped selection"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Temporary test button for compositing */}
              <button
                onClick={handleTestComposite}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={!cropDetails}
              >
                Test Composite (Red Square)
              </button>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={handleDownloadFinalImage}
              disabled={!isFinalImageReady}
              className={`px-6 py-2 font-medium rounded-md transition-colors ${
                isFinalImageReady
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Download Final Image
            </button>
            <img
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};