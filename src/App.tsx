import React from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ProcessingQueue } from './components/ProcessingQueue';
import { EditModal } from './components/EditModal';
import { Statistics } from './components/Statistics';
import { useImageProcessing } from './hooks/useImageProcessing';
import { Play, Trash2 } from 'lucide-react';

function App() {
  const {
    images,
    isProcessing,
    editingImage,
    setEditingImage,
    addImages,
    removeImage,
    processAllPendingImages,
    clearAll
  } = useImageProcessing();

  const pendingImages = images.filter(img => img.status === 'pending');
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI-Powered Jewelry Removal & Image Upscaling
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Upload your images and let our advanced AI remove jewelry and enhance image quality. 
              Perfect for product photography, portraits, and professional image editing.
            </p>
          </div>

          {/* Statistics */}
          <Statistics images={images} />

          {/* File Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Upload Images</h3>
            <FileUpload 
              onFilesSelected={addImages}
              uploadedImages={images.filter(img => img.status === 'pending')}
              onRemoveImage={removeImage}
            />
          </div>

          {/* Action Buttons */}
          {hasImages && (
            <div className="flex flex-wrap gap-4 justify-center">
              {pendingImages.length > 0 && (
                <button
                  onClick={processAllPendingImages}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>
                    {isProcessing ? 'Processing...' : `Process ${pendingImages.length} Image${pendingImages.length !== 1 ? 's' : ''}`}
                  </span>
                </button>
              )}
              
              <button
                onClick={clearAll}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Clear All</span>
              </button>
            </div>
          )}

          {/* Processing Queue */}
          <ProcessingQueue 
            images={images} 
            onRefineImage={setEditingImage}
          />

          {/* Information Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Jewelry Removal</h4>
                    <p className="text-sm text-gray-600">
                      Our AI analyzes your images and intelligently removes all jewelry while preserving the natural appearance.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Image Upscaling</h4>
                    <p className="text-sm text-gray-600">
                      The processed images are then enhanced using advanced upscaling technology for superior quality.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Supported Formats</h4>
                  <p className="text-sm text-gray-600">JPG, PNG, WEBP (up to 10MB each)</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Processing Time</h4>
                  <p className="text-sm text-gray-600">Typically 30-60 seconds per image</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Edit Modal */}
      {editingImage && (
        <EditModal 
          image={editingImage} 
          onClose={() => setEditingImage(null)} 
        />
      )}
    </div>
  );
}

export default App;