import React from 'react';
import { Download, AlertCircle, CheckCircle, Clock, Loader, Image, Sparkles } from 'lucide-react';
import { UploadedImage } from '../types';
import { ImageProcessor } from '../services/imageProcessor';

interface ProcessingQueueProps {
  images: UploadedImage[];
  onRefineImage: (image: UploadedImage) => void;
}

export const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ images, onRefineImage }) => {
  const getStatusIcon = (status: UploadedImage['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'processing-stage1':
      case 'processing-stage2':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: UploadedImage['status']) => {
    switch (status) {
      case 'pending':
        return 'Waiting to process';
      case 'processing-stage1':
        return 'Removing jewelry...';
      case 'processing-stage2':
        return 'Upscaling image...';
      case 'completed':
        return 'Processing complete';
      case 'error':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    window.open(imageUrl, '_blank');
  };

  const processingImages = images.filter(img => 
    img.status !== 'pending' || img.progress > 0
  );

  if (processingImages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Processing Queue</h3>
        <p className="text-sm text-gray-600">
          {processingImages.filter(img => img.status === 'completed').length} of {processingImages.length} completed
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {processingImages.map((image) => (
          <div key={image.id} className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={image.preview}
                    alt={image.originalName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {image.originalName}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(image.status)}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {getStatusText(image.status)}
                </p>
                
                {image.error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                    <p className="text-sm text-red-700">{image.error}</p>
                  </div>
                )}
                
                {(image.status === 'processing-stage1' || image.status === 'processing-stage2') && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${image.progress}%` }}
                    />
                  </div>
                )}
                
                {image.status === 'completed' && (
                  <div className="flex flex-wrap gap-2">
                    {image.jewelryRemovedUrl && (
                      <button
                        onClick={() => handleDownload(image.jewelryRemovedUrl!, `${image.originalName}_jewelry_removed.jpg`)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Jewelry Removed</span>
                      </button>
                    )}
                    
                    {image.upscaledUrl && (
                      <button
                        onClick={() => handleDownload(image.upscaledUrl!, `${image.originalName}_upscaled.jpg`)}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Upscaled</span>
                      </button>
                    )}
                    
                    {image.upscaledUrl && (
                      <button
                        onClick={() => onRefineImage(image)}
                        className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Refine Image</span>
                      </button>
                    )}
                  </div>
                )}
                
                {(image.jewelryRemovedUrl || image.upscaledUrl) && (
                  <div className="flex space-x-4 mt-4">
                    {image.jewelryRemovedUrl && (
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-700 mb-2">Jewelry Removed</p>
                        <div className="w-full h-24 rounded-md overflow-hidden border border-gray-200">
                          <img
                            src={image.jewelryRemovedUrl}
                            alt="Jewelry removed"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    {image.upscaledUrl && (
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-700 mb-2">Upscaled</p>
                        <div className="w-full h-24 rounded-md overflow-hidden border border-gray-200">
                          <img
                            src={image.upscaledUrl}
                            alt="Upscaled"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};