// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// IMPORTANT: Replace '<YOUR_REPO_NAME>' with the actual name of your GitHub repository
const repoName = 'tapfit-app'; // <--- MAKE SURE THIS MATCHES YOUR REPO NAME

// https://vitejs.dev/config/
export default defineConfig({
  base: `/${repoName}/`,
  plugins: [
    react(),
    basicSsl(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        // --- ADD THIS LINE ---
        // Increase limit to 3 MiB (3 * 1024 * 1024 bytes)
        maximumFileSizeToCacheInBytes: 3145728,
        // ---------------------
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'TapFit Pose Measurement',
        short_name: 'TapFit',
        description: 'Capture your pose and get estimated body measurements based on height.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: `/${repoName}/`,
        start_url: `/${repoName}/`,
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module',
      }
    })
  ],
  server: {
    host: true,
    https: true
  }
})
