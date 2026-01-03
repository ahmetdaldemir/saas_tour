import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { http } from '../modules/http';

export interface TenantFeatures {
  finance?: boolean;
  vehicleTracking?: boolean;
  chat?: boolean;
  ai?: boolean;
}

export const useFeaturesStore = defineStore('features', () => {
  const features = ref<TenantFeatures>({
    finance: false,
    vehicleTracking: false,
    chat: false,
    ai: false,
  });
  const loading = ref(false);
  const initialized = ref(false);

  const hasFeature = (feature: keyof TenantFeatures): boolean => {
    return features.value[feature] ?? false;
  };

  const loadFeatures = async () => {
    if (loading.value) return;
    loading.value = true;
    try {
      const { data } = await http.get<TenantFeatures>('/settings/features');
      features.value = {
        finance: data.finance ?? false,
        vehicleTracking: data.vehicleTracking ?? false,
        chat: data.chat ?? false,
        ai: data.ai ?? false,
      };
      initialized.value = true;
    } catch (error) {
      console.error('Failed to load features:', error);
      // Default to false on error
      features.value = {
        finance: false,
        vehicleTracking: false,
        chat: false,
        ai: false,
      };
      initialized.value = true;
    } finally {
      loading.value = false;
    }
  };

  const initialize = async () => {
    if (initialized.value) return;
    await loadFeatures();
  };

  return {
    features,
    loading,
    initialized,
    hasFeature,
    loadFeatures,
    initialize,
  };
});

