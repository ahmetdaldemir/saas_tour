import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  // Check for environment variable first
  if (Constants.expoConfig?.extra?.apiBaseUrl) {
    return Constants.expoConfig.extra.apiBaseUrl;
  }
  
  // Production API base URL
  return 'https://api.saastour360.com/api';
};

export const config = {
  apiBaseUrl: getApiBaseUrl(),
};

