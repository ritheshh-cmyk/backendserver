import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: [
      '68b60832-bfbe-49fc-8d66-bf56a1b38c56-00-1k535ykx4530y.picard.replit.dev'
    ],
    strictPort: false,
    cors: true,
  },
}) 