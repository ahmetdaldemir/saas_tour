import { create } from 'zustand';

const useFeaturesStore = create((set, get) => ({
  features: [],
  initialized: false,

  setFeatures: (features) => {
    set({ features, initialized: true });
  },

  hasFeature: (featureName) => {
    const { features } = get();
    return features.includes(featureName);
  },

  initialize: async () => {
    try {
      // TODO: API call to get features
      set({ features: [], initialized: true });
    } catch (error) {
      set({ features: [], initialized: true });
    }
  },
}));

export { useFeaturesStore };

