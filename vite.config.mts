import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          // Remove the dynamic import if you don't need the plugin locally
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "@radix-ui/react-tooltip",
        "@radix-ui/react-label",
        "@radix-ui/react-separator",
        "@radix-ui/react-tabs",
        "@radix-ui/react-toast",
        "@radix-ui/react-switch",
        "class-variance-authority"
      ]
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
