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
        },
      },
    },
    logLevel: 'warn', // Sadece uyarıları ve hataları göster (Sass deprecation uyarılarını azaltır)
  };
});
