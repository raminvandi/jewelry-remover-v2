import React, { useRef, useState } from 'react';
import { Upload, Image, X } from 'lucide-react';
import { UploadedImage } from '../types';

interface FileUploadProps {
  onFilesSelected: (images: UploadedImage[]) => void;
  uploadedImages: UploadedImage[];
  onRemoveImage: (id: string) => void;
}

const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  uploadedImages,
  onRemoveImage
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return `${file.name}: Unsupported format. Please use JPG, PNG, or WEBP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Maximum size is 10MB.`;
    }
    return null;
  };

  const processFiles = (files: FileList) => {
    const validImages: UploadedImage[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
        return;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      
      validImages.push({
        id,
        file,
        preview,
        status: 'pending',
        progress: 0,
        originalName: file.name.replace(/\.[^/.]+$/, '')
      });
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validImages.length > 0) {
      onFilesSelected(validImages);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-gray-100 rounded-full">
            <Upload className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop your images here, or <span className="text-blue-600 underline cursor-pointer">browse</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports JPG, PNG, WEBP up to 10MB each
            </p>
          </div>
        </div>
      </div>

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {uploadedImages.map((image) => (
            <div
              key={image.id}
              className="relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(image.id);
                }}
                className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="aspect-square relative">
                <img
                  src={image.preview}
                  alt={image.originalName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {image.originalName}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Image className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {(image.file.size / (1024 * 1024)).toFixed(1)}MB
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};