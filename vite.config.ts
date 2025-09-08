import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add this 'server' configuration block
  server: {
    proxy: {
      // Any request from your app to '/api-enhancor' will be forwarded to the target
      '/api-enhancor': {
        target: 'https://api.enhancor.ai',
        changeOrigin: true, // This is crucial for the proxy to work correctly
        rewrite: (path) => path.replace(/^\/api-enhancor/, ''), // Removes '/api-enhancor' from the request path
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
