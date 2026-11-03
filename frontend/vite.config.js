
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    proxy: {
      '/documents': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
});
