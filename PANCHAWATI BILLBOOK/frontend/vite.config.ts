import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true,
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Panchawati BillBook',
        short_name: 'BillBook',
        description: 'Advanced Inventory & Billing Software',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    watch: {
      ignored: ['**/cloudflared.exe']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5555',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5555',
        ws: true,
      }
    }
  }
})
