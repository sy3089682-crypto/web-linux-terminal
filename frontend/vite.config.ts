import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } },
          },
        ],
      },
      manifest: {
        name: 'V-Cloud PC — Full Linux Desktop in Browser',
        short_name: 'V-Cloud PC',
        description: 'Complete Linux PC replacement in your browser. Terminal, IDE, Desktop, File Manager, and more.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'any',
        categories: ['productivity', 'development', 'utilities'],
        screenshots: [
          { src: 'screenshot-desktop.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide' },
          { src: 'screenshot-mobile.png', sizes: '375x812', type: 'image/png', form_factor: 'narrow' },
        ],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/collaboration': { target: 'ws://localhost:3001', ws: true },
      '/clipboard': { target: 'ws://localhost:3001', ws: true },
      '/stats': { target: 'ws://localhost:3001', ws: true },
    },
  },
});
