import React from 'react';
import { Gem, Sparkles } from 'lucide-react';
import { Auth } from './Auth';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Gem className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">JewelryFree</h1>
                <p className="text-xs text-gray-500">AI-Powered Image Processing</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Jewelry Removal & Upscaling</span>
            </div>
            <Auth />
          </div>
        </div>
      </div>
    </header>
  );
};