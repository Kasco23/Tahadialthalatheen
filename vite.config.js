import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), compression({ algorithm: "brotliCompress" })],
    build: {
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes("node_modules"))
                        return;
                    if (/react|framer-motion|jotai/.test(id))
                        return "vendor-react";
                    if (/@supabase/.test(id))
                        return "vendor-supabase";
                    if (/@daily-co/.test(id))
                        return "vendor-daily";
                    return "vendor";
                },
            },
        },
    },
});
