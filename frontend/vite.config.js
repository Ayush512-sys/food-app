import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'es2015'
  },
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 3000,
    allowedHosts: ['.lhr.life', '.loca.lt'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'ws://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
