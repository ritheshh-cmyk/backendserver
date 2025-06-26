import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      "/api": {
        target: "https://backendmobile-4swg.onrender.com",
        changeOrigin: true,
        secure: true,
      },
      "/socket.io": {
        target: "https://backendmobile-4swg.onrender.com",
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
