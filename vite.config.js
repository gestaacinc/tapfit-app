// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl' // <-- Import the plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // <-- Add the plugin here
  ],
  server: {
    host: true, // <-- Ensure it listens on all hosts (needed for network access)
    https: true // <-- Enable HTTPS
  }
})