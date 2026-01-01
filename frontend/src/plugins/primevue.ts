import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';

export const primevue = PrimeVue;

export const primevueConfig = {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false,
      cssLayer: false,
    },
  },
};

