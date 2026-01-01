import { useDisplay } from 'vuetify';

export function useSnackbar() {
  // Simple alert-based implementation for now
  // Can be enhanced with Vuetify snackbar later
  const showSuccess = (message: string) => {
    alert(`✅ ${message}`);
  };

  const showError = (message: string) => {
    alert(`❌ ${message}`);
  };

  const showInfo = (message: string) => {
    alert(`ℹ️ ${message}`);
  };

  const showWarning = (message: string) => {
    alert(`⚠️ ${message}`);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}

