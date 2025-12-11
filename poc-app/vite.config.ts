import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      "/api/solar": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
      "/api/ocr": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
