import { create } from 'zustand';
import apiService from '../services/api';

interface FeaturesState {
  features: string[];
  initialized: boolean;
  hasFeature: (feature: string) => boolean;
  initialize: () => Promise<void>;
}

export const useFeaturesStore = create<FeaturesState>((set, get) => ({
  features: [],
  initialized: false,

  hasFeature: (feature: string) => {
    return get().features.includes(feature);
  },

  initialize: async () => {
    if (get().initialized) return;
    
    try {
      // Fetch features from API or use defaults
      // For now, we'll set default features
      const features = ['finance', 'vehicleTracking', 'chat'];
      set({ features, initialized: true });
    } catch (error) {
      set({ features: [], initialized: true });
    }
  },
}));

