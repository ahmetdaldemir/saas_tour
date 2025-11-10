import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export const vuetify = createVuetify({
  defaults: {
    VBtn: {
      rounded: 'lg',
      color: 'primary',
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#f4f6fb',
          primary: '#2563EB',
          secondary: '#38BDF8',
          surface: '#ffffff',
          success: '#22C55E',
          warning: '#F97316',
          error: '#EF4444',
        },
      },
      dark: {
        dark: true,
        colors: {
          background: '#0f172a',
          surface: '#1e293b',
          primary: '#38BDF8',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
});
