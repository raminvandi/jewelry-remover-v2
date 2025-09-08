export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing-stage1' | 'processing-stage2' | 'completed' | 'error';
  progress: number;
  error?: string;
  jewelryRemovedUrl?: string;
  upscaledUrl?: string;
  originalName: string;
  userId?: string;
  createdAt?: string;
}

export interface ProcessingResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text?: string;
        inline_data?: {
          mime_type: string;
          data: string;
        };
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }[];
    };
  }[];
}

export interface EnhancorResponse {
  success: boolean;
  requestId?: string; // Changed from 'data' object
  status?: string;
  result?: string; // The key for the final URL
  error?: string;
}