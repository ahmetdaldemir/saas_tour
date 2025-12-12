import { CurrencyService } from '../modules/shared/services/currency.service';

let updateInterval: NodeJS.Timeout | null = null;

/**
 * Currency güncelleme scheduler'ı başlatır
 * Her gün saat 00:00'da otomatik güncelleme yapar
 */
export const startCurrencyScheduler = () => {
  // İlk çalıştırmada hemen güncelle
  CurrencyService.updateExchangeRates().catch((error) => {
    console.error('Initial currency update failed:', error);
  });

  // 24 saatte bir (86400000 ms) güncelleme yap
  const updateIntervalMs = 24 * 60 * 60 * 1000; // 24 saat

  updateInterval = setInterval(async () => {
    try {
      console.log(`[${new Date().toISOString()}] Starting scheduled currency update...`);
      await CurrencyService.updateExchangeRates();
      console.log(`[${new Date().toISOString()}] Scheduled currency update completed`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Scheduled currency update failed:`, (error as Error).message);
    }
  }, updateIntervalMs);

  console.log('✅ Currency scheduler started (updates every 24 hours)');
};

/**
 * Currency scheduler'ı durdurur
 */
export const stopCurrencyScheduler = () => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('Currency scheduler stopped');
  }
};

