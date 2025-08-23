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
        manualChunks: (id) => {
          // Vendor chunks for major libraries
          if (id.includes('react-dom')) return 'vendor';
          if (id.includes('react') && !id.includes('react-dom') && !id.includes('react-router')) return 'react';
          if (id.includes('react-router')) return 'router';
          
          // Theme system chunk (heavy dependencies)
          if (id.includes('node-vibrant') || id.includes('svgson')) return 'theme-heavy';
          if (id.includes('src/theme/') && (
            id.includes('palette') || 
            id.includes('background') ||
            id.includes('ThemeControls')
          )) return 'theme';
          
          // Translation chunk
          if (id.includes('lib/translations') || id.includes('i18n')) return 'translations';
          
          // UI framework chunk  
          if (id.includes('framer-motion')) return 'ui';
          if (id.includes('@supabase/supabase-js')) return 'supabase';
          if (id.includes('jotai')) return 'jotai';
          
          // Default behavior for other vendor modules
          if (id.includes('node_modules')) return 'vendor-misc';
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
