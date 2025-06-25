import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: false,
    allowedHosts: [
      'localhost',
      '.replit.dev',
      '.picard.replit.dev',
      '68b60832-bfbe-49fc-8d66-bf56a1b38c56-00-1k535ykx4530y.picard.replit.dev'
    ],
    cors: {
      origin: true,
      credentials: true
    },
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});