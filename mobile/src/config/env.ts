import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

const getApiBaseUrl = () => {
  // Check for environment variable first
  if (Constants.expoConfig?.extra?.apiBaseUrl) {
    let baseUrl = Constants.expoConfig.extra.apiBaseUrl;
    
    // Android emülatör için özel IP adresi
    // Android emülatörde localhost yerine 10.0.2.2 kullanılmalı
    if (Platform.OS === 'android' && Device.isDevice === false) {
      // Emülatör kullanılıyor
      // IP adresini 10.0.2.2 ile değiştir
      baseUrl = baseUrl.replace(/http:\/\/(\d+\.\d+\.\d+\.\d+)/, 'http://10.0.2.2');
      baseUrl = baseUrl.replace(/http:\/\/localhost/, 'http://10.0.2.2');
      baseUrl = baseUrl.replace(/http:\/\/127\.0\.0\.1/, 'http://10.0.2.2');
      console.log('[Config] Android emülatör tespit edildi, API URL güncellendi:', baseUrl);
    }
    
    return baseUrl;
  }
  
  // Production API base URL
  return 'https://api.saastour360.com/api';
};

export const config = {
  apiBaseUrl: getApiBaseUrl(),
};

