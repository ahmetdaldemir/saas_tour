import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export const vuetify = createVuetify({
  defaults: {
    VBtn: {
      rounded: 'lg',
      color: 'primary',
      size: 'small',
      density: 'compact',
    },
    VCard: {
      elevation: 0,
      variant: 'outlined',
    },
    VCardTitle: {
      style: 'font-size: 0.75rem; font-weight: 600; padding: 8px 12px;',
    },
    VCardText: {
      style: 'padding: 8px 12px;',
    },
    VTextField: {
      density: 'compact',
      variant: 'outlined',
      hideDetails: 'auto',
    },
    VSelect: {
      density: 'compact',
      variant: 'outlined',
      hideDetails: 'auto',
    },
    VTextarea: {
      density: 'compact',
      variant: 'outlined',
      hideDetails: 'auto',
    },
    VChip: {
      size: 'small',
      density: 'comfortable',
    },
    VDataTable: {
      density: 'compact',
    },
    VList: {
      density: 'compact',
    },
    VListItem: {
      density: 'compact',
    },
    VDialog: {
      scrim: true,
      scrimOpacity: 0.6,
    },
    VOverlay: {
      scrim: true,
      scrimOpacity: 0.6,
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
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});
