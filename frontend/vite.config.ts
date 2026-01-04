import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const proxyTarget =
    env.VITE_PROXY_TARGET ||
    (mode === 'development' ? 'http://localhost:4001' : 'http://backend:3000');

  return {
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
        styles: {
          configFile: 'src/styles/settings.scss',
        },
      }),
    ],
    server: {
      port: 9001,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Ensure TinyMCE language files are properly handled
          assetFileNames: 'assets/[name].[ext]',
          // Manual chunks for better code splitting
          manualChunks: (id) => {
            // TinyMCE and its plugins - separate chunk
            if (id.includes('tinymce')) {
              return 'tinymce';
            }
            // Vue core and ecosystem
            if (id.includes('node_modules/vue') && !id.includes('node_modules/vue-router') && !id.includes('node_modules/pinia')) {
              return 'vue-core';
            }
            // Vue Router and Pinia
            if (id.includes('node_modules/vue-router') || id.includes('node_modules/pinia')) {
              return 'vue-vendor';
            }
            // Vuetify
            if (id.includes('node_modules/vuetify')) {
              return 'vuetify';
            }
            // Chart.js
            if (id.includes('node_modules/chart.js') || id.includes('node_modules/vue-chartjs')) {
              return 'chart-vendor';
            }
            // Leaflet (map library)
            if (id.includes('node_modules/leaflet')) {
              return 'leaflet';
            }
            // Socket.io
            if (id.includes('node_modules/socket.io-client')) {
              return 'socketio';
            }
            // Axios
            if (id.includes('node_modules/axios')) {
              return 'axios';
            }
            // All other node_modules
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
      // Ensure TinyMCE files are properly bundled
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      // Increase chunk size warning limit (TinyMCE is large, but we've split it)
      chunkSizeWarningLimit: 1500,
    },
    // Optimize TinyMCE dependencies
    optimizeDeps: {
      include: ['tinymce', '@tinymce/tinymce-vue'],
      exclude: [],
    },
    logLevel: 'warn', // Sadece uyarıları ve hataları göster (Sass deprecation uyarılarını azaltır)
  };
});
