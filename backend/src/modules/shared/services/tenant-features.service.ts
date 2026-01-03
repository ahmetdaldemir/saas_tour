import { TenantSettingsService } from './tenant-settings.service';
import { SettingsCategory } from '../entities/tenant-settings.entity';

export type TenantFeatures = {
  finance?: boolean;
  vehicleTracking?: boolean;
  chat?: boolean;
  ai?: boolean;
};

export class TenantFeaturesService {
  /**
   * Get tenant features from metadata
   */
  static async getFeatures(tenantId: string): Promise<TenantFeatures> {
    const settings = await TenantSettingsService.getByCategory(tenantId, SettingsCategory.GENERAL);
    const features = (settings?.metadata?.features as TenantFeatures) || {};
    
    return {
      finance: features.finance ?? false,
      vehicleTracking: features.vehicleTracking ?? false,
      chat: features.chat ?? false,
      ai: features.ai ?? false,
    };
  }

  /**
   * Update tenant features
   */
  static async updateFeatures(tenantId: string, features: Partial<TenantFeatures>): Promise<void> {
    const existingSettings = await TenantSettingsService.getByCategory(tenantId, SettingsCategory.GENERAL);
    
    const currentFeatures = (existingSettings?.metadata?.features as TenantFeatures) || {};
    const updatedFeatures = { ...currentFeatures, ...features };

    // Use repository directly to update metadata
    const repo = TenantSettingsService['repository']();
    let settingsToUpdate = await repo.findOne({
      where: { tenantId, category: SettingsCategory.GENERAL },
    });

    if (!settingsToUpdate) {
      settingsToUpdate = repo.create({
        tenantId,
        category: SettingsCategory.GENERAL,
        metadata: { features: updatedFeatures },
      });
    } else {
      settingsToUpdate.metadata = {
        ...(settingsToUpdate.metadata || {}),
        features: updatedFeatures,
      };
    }

    await repo.save(settingsToUpdate);
  }

  /**
   * Check if tenant has a specific feature
   */
  static async hasFeature(tenantId: string, feature: keyof TenantFeatures): Promise<boolean> {
    const features = await this.getFeatures(tenantId);
    return features[feature] ?? false;
  }
}

