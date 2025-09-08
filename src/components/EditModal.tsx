import React from 'react';
import { X } from 'lucide-react';
import { UploadedImage } from '../types';

interface EditModalProps {
  image: UploadedImage;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ image, onClose }) => {
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
        <div className="p-6 flex justify-center items-center bg-gray-50">
          <div className="max-w-full max-h-[70vh] overflow-hidden rounded-lg shadow-lg">
            <img
              src={image.upscaledUrl}
              alt={`Upscaled ${image.originalName}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};