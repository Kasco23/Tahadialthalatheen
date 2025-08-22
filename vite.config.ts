import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import bundlesize from 'vite-plugin-bundlesize';

export default defineConfig({
  plugins: [
    react(),
    bundlesize({
      limits: [
        // Allow a little extra headroom so Netlify builds don't fail on
        // minor bundle size fluctuations while still keeping bundles small
        { name: '**/*.js', limit: '230 kB' },
      ],
    }),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion'],
          // Split SDKs into separate chunks for lazy loading
          supabase: ['@supabase/supabase-js'],
          // Daily SDK will be code-split automatically with lazy loading
          jotai: ['jotai'],
        },
      },
    },
    // Match the bundlesize limit above so Vite warns at the same threshold
    chunkSizeWarningLimit: 230, // kB
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'flag-icons',
    ],
  },
  define: {
    // Ensure environment variables are available at build time
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  // Add server configuration for development
  server: {
    port: 5173,
    host: true, // Allow external connections
    open: true,
    proxy: {
      // Proxy Netlify functions to the Netlify dev server
      '/.netlify/functions': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Preview configuration
  preview: {
    port: 3000,
    host: true,
  },
});
