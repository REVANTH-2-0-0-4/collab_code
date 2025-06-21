// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import coi from 'vite-plugin-coi'    // optional helper plugin

export default defineConfig({
  plugins: [
    coi(),          // injects the two headers + shim to make COI work in dev
    react()
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy':  'same-origin',
      'Cross-Origin-Embedder-Policy':'require-corp'
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy':  'same-origin',
      'Cross-Origin-Embedder-Policy':'require-corp'
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
