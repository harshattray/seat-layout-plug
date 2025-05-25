/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@types': path.resolve(__dirname, 'src/types.ts'),
    },
  },
  test: { // Vitest configuration
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts', // Path to your setup file
    // css: true, // You might want to add this if you're using CSS modules or global CSS
  },
})