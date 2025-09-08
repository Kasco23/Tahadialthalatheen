/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";
import tailwindcss from "@tailwindcss/vite";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss(), compression({
    algorithm: "brotliCompress"
  })],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/react|framer-motion|jotai/.test(id)) return "vendor-react";
          if (/@supabase/.test(id)) return "vendor-supabase";
          if (/@daily-co/.test(id)) return "vendor-daily";
          return "vendor";
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
  }
});