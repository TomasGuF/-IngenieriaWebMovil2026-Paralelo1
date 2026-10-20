/// <reference types="vitest" />

import { fileURLToPath } from 'node:url'
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  test: {
    globals: true,
    alias: { '@lit/react': fileURLToPath(new URL('./node_modules/@lit/react/index.js', import.meta.url)) },
    environment: 'jsdom',
    // Ionic 9 uses @lit/react: load its browser event bindings in jsdom.
    server: { deps: { inline: [/@ionic\/react/, /@stencil\/react-output-target/, /@lit\/react/] } },
    setupFiles: './src/setupTests.ts',
  }
})
