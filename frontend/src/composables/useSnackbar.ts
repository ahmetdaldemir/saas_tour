import { ref } from 'vue';
import { useDisplay } from 'vuetify';

interface SnackbarState {
  show: boolean;
  text: string;
  color: 'success' | 'error' | 'warning' | 'info';
  timeout: number;
}

const snackbarState = ref<SnackbarState>({
  show: false,
  text: '',
  color: 'info',
  timeout: 3000,
});

export function useSnackbar() {
  const showSnackbar = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', timeout: number = 3000) => {
    snackbarState.value = {
      show: true,
      text: message,
      color: type,
      timeout,
    };
  };

  const showSuccess = (message: string) => {
    showSnackbar(message, 'success', 3000);
  };

  const showError = (message: string) => {
    showSnackbar(message, 'error', 4000);
  };

  const showInfo = (message: string) => {
    showSnackbar(message, 'info', 3000);
  };

  const showWarning = (message: string) => {
    showSnackbar(message, 'warning', 3000);
  };

  return {
    snackbarState,
    showSnackbar,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
