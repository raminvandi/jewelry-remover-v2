import React from 'react';
import { UploadedImage } from '../types';
import { Image, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface StatisticsProps {
  images: UploadedImage[];
}

export const Statistics: React.FC<StatisticsProps> = ({ images }) => {
  const totalImages = images.length;
  const completedImages = images.filter(img => img.status === 'completed').length;
  const errorImages = images.filter(img => img.status === 'error').length;
  const processingImages = images.filter(img => 
    img.status === 'processing-stage1' || img.status === 'processing-stage2'
  ).length;

  const stats = [
    {
      label: 'Total Images',
      value: totalImages,
      icon: Image,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      label: 'Processing',
      value: processingImages,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Completed',
      value: completedImages,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Errors',
      value: errorImages,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  if (totalImages === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};