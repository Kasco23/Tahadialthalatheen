import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import bundlesize from 'vite-plugin-bundlesize';

export default defineConfig({
  plugins: [
    react(), // Only add Sentry plugin if auth token is available
    bundlesize({
      limits: [
        // Main entry bundle should stay small
        { name: 'assets/index-*.js', limit: '200 kB' },
        // React ecosystem chunks
        { name: 'assets/vendor-react-dom-*.js', limit: '300 kB' },
        { name: 'assets/vendor-react-*.js', limit: '200 kB' },
        // Large vendor libraries
        { name: 'assets/vendor-framer-*.js', limit: '200 kB' },
        { name: 'assets/vendor-misc-*.js', limit: '400 kB' },
        { name: 'assets/vendor-state-*.js', limit: '100 kB' },
        // Supabase
        { name: 'assets/supabase-*.js', limit: '50 kB' },
        // Application chunks
        { name: 'assets/translations-*.js', limit: '50 kB' },
        // Page chunks should be reasonable
        { name: 'assets/*-*.js', limit: '100 kB' },
      ],
    }),
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: 'kasco-ul',
            project: 'tahadialthalatheen',
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              assets: './dist/**', // upload all compiled assets
            },
            // Disable telemetry to reduce noise
            telemetry: false,
          }),
        ]
      : []),
    sentryVitePlugin({
      org: 'kasco-ul',
      project: 'tahadialthalatheen',
    }),
    sentryVitePlugin({
      org: 'kasco-ul',
      project: 'tahadialthalatheen',
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
          // React ecosystem - be more conservative to avoid initialization issues
          if (id.includes('react-dom')) return 'vendor-react-dom';
          if (id.includes('react') && !id.includes('react-dom'))
            return 'vendor-react';
          if (id.includes('react-router')) return 'vendor-react';

          // Supabase - large and independent
          if (id.includes('@supabase/supabase-js')) return 'supabase';

          // Split large vendor libraries
          if (id.includes('node_modules')) {
            // Framer Motion is very large, separate it
            if (id.includes('framer-motion')) return 'vendor-framer';

            // State management libraries
            if (id.includes('jotai')) return 'vendor-state';

            // Everything else goes to vendor-misc
            return 'vendor-misc';
          }

          // Application code - minimal chunking
          if (id.includes('lib/translations') || id.includes('i18n'))
            return 'translations';
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
