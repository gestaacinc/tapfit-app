// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
// 1. Import the PWA plugin
import { VitePWA } from 'vite-plugin-pwa'

// IMPORTANT: Replace '<YOUR_REPO_NAME>' with the actual name of your GitHub repository
// Example: If your repo URL is https://github.com/gestaacinc/tapfit-app
// then repoName should be 'tapfit-app'
const repoName = 'tapfit-app'; // <--- MAKE SURE THIS MATCHES YOUR REPO NAME

// https://vitejs.dev/config/
export default defineConfig({
  // 2. Set the base path for GitHub Pages deployment
  // It should be '/<YOUR_REPO_NAME>/'
  base: `/${repoName}/`,
  plugins: [
    react(),
    basicSsl(), // Keep for https development

    // 3. Add VitePWA plugin with configuration
    VitePWA({
      registerType: 'autoUpdate', // Automatically update service worker when new content is available
      injectRegister: 'auto', // Let the plugin handle registration script injection
      workbox: {
        // Workbox options for service worker generation
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'], // Files to cache
        runtimeCaching: [ // Optional: Cache API calls or other dynamic content
          // Example: Cache fonts from Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Add other runtime caching rules here if needed
        ],
      },
      // Manifest configuration
      manifest: {
        name: 'TapFit Pose Measurement',
        short_name: 'TapFit',
        description: 'Capture your pose and get estimated body measurements based on height.',
        theme_color: '#ffffff', // White theme color
        background_color: '#ffffff', // White background
        display: 'standalone', // Opens like a standalone app
        scope: `/${repoName}/`, // Scope matches the base path
        start_url: `/${repoName}/`, // Start URL matches the base path
        orientation: 'portrait', // Suggest portrait orientation
        icons: [
          // Make sure these paths match where your icons are in the public folder
          // Example: public/icons/icon-192x192.png
          {
            src: 'icons/icon-192x192.png', // Relative to public folder
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any' // Can be used for any purpose
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/maskable-icon-512x512.png', // Optional maskable
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // Icon adapts to different shapes
          }
        ]
      },
      // devOptions can be removed for production config, but fine to leave
      devOptions: {
        enabled: false, // PWA features usually tested in preview/production build
        type: 'module',
      }
    })
  ],
  server: {
    host: true, // Keep for network access during dev
    https: true // Keep for https during dev (needed for camera)
  }
})
