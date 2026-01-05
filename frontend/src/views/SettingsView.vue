<template>
  <div>
    <v-card elevation="2" class="mb-4">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center">
        <v-icon icon="mdi-cog" class="mr-2" />
        Ayarlar
      </v-card-title>
      <v-divider />
      
      <v-tabs v-model="activeTab" show-arrows>
        <v-tab value="site">
          <v-icon start icon="mdi-web" />
          Site Ayarları
        </v-tab>
        <v-tab value="mail">
          <v-icon start icon="mdi-email" />
          Mail Ayarları
        </v-tab>
        <v-tab value="payment">
          <v-icon start icon="mdi-credit-card" />
          Ödeme Ayarları
        </v-tab>
        <v-tab value="invoice">
          <v-icon start icon="mdi-file-document-edit" />
          Fatura Ayarları
        </v-tab>
      </v-tabs>
      
      <v-divider />
      
      <v-window v-model="activeTab" class="pa-6">
        <!-- Site Ayarları -->
        <v-window-item value="site">
          <v-alert
            v-if="siteMessage.text"
            :type="siteMessage.type"
            variant="tonal"
            closable
            @click:close="siteMessage.text = ''"
            class="mb-4"
          >
            {{ siteMessage.text }}
          </v-alert>
          <v-form ref="siteFormRef" v-model="siteFormValid" @submit.prevent="saveSiteSettings">
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">Site Genel Ayarları</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="siteForm.siteName"
                      label="Site Adı"
                      prepend-inner-icon="mdi-text"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || 'Site adı gereklidir']"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="tenantForm.defaultCurrencyId"
                      :items="currencies"
                      item-title="name"
                      item-value="id"
                      label="Varsayılan Para Birimi"
                      prepend-inner-icon="mdi-currency-usd"
                      variant="outlined"
                      density="comfortable"
                    >
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template #prepend>
                            <v-chip size="small" variant="flat" color="primary" class="mr-2">
                              {{ item.raw.code }}
                            </v-chip>
                          </template>
                        </v-list-item>
                      </template>
                      <template #selection="{ item }">
                        <v-chip size="small" variant="flat" color="primary" class="mr-2">
                          {{ item.raw.code }}
                        </v-chip>
                        {{ item.raw.name }}
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      v-model="siteForm.siteDescription"
                      label="Site Açıklaması"
                      prepend-inner-icon="mdi-text-box"
                      variant="outlined"
                      density="comfortable"
                      rows="3"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">Şirket Bilgileri</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="siteForm.companyName"
                      label="Şirket Adı"
                      prepend-inner-icon="mdi-office-building"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      v-model="siteForm.companyAddress"
                      label="Şirket Adresi"
                      prepend-inner-icon="mdi-map-marker"
                      variant="outlined"
                      density="comfortable"
                      rows="3"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="siteForm.companyEmail"
                      label="Şirket E-posta"
                      prepend-inner-icon="mdi-email"
                      variant="outlined"
                      density="comfortable"
                      type="email"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="siteForm.companyPhone"
                      label="Şirket Telefon"
                      prepend-inner-icon="mdi-phone"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="siteForm.companyWebsite"
                      label="Şirket Web Sitesi"
                      prepend-inner-icon="mdi-web"
                      variant="outlined"
                      density="comfortable"
                      type="url"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="siteForm.companyTaxNumber"
                      label="Vergi Numarası"
                      prepend-inner-icon="mdi-receipt"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">Görsel Ayarlar</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <div>
                      <v-file-input
                        v-model="logoFile"
                        label="Logo Yükle"
                        prepend-inner-icon="mdi-image"
                        variant="outlined"
                        density="comfortable"
                        accept="image/*"
                        :rules="[(v: any) => {
                          if (!v) return true;
                          if (v && typeof v === 'object' && 'size' in v) {
                            return v.size < 5000000 || 'Dosya boyutu 5MB\'dan küçük olmalıdır';
                          }
                          return true;
                        }]"
                        :loading="uploadingLogo"
                        show-size
                        clearable
                      />
                      <v-btn
                        v-if="logoFile && !uploadingLogo"
                        color="primary"
                        size="small"
                        prepend-icon="mdi-upload"
                        @click="handleLogoUpload"
                        class="mt-2"
                      >
                        Logo Yükle
                      </v-btn>
                      <v-img
                        v-if="uploadedLogoUrl"
                        :src="getImageUrl(uploadedLogoUrl)"
                        max-height="100"
                        max-width="200"
                        contain
                        class="mt-2 rounded"
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div>
                      <v-file-input
                        v-model="faviconFile"
                        label="Favicon Yükle"
                        prepend-inner-icon="mdi-image-filter-center-focus"
                        variant="outlined"
                        density="comfortable"
                        accept="image/*,.ico"
                        :rules="[(v: any) => {
                          if (!v) return true;
                          if (v && typeof v === 'object' && 'size' in v) {
                            return v.size < 5000000 || 'Dosya boyutu 5MB\'dan küçük olmalıdır';
                          }
                          return true;
                        }]"
                        :loading="uploadingFavicon"
                        show-size
                        clearable
                      />
                      <v-btn
                        v-if="faviconFile && !uploadingFavicon"
                        color="primary"
                        size="small"
                        prepend-icon="mdi-upload"
                        @click="handleFaviconUpload"
                        class="mt-2"
                      >
                        Favicon Yükle
                      </v-btn>
                      <v-img
                        v-if="uploadedFaviconUrl"
                        :src="getImageUrl(uploadedFaviconUrl)"
                        max-height="32"
                        max-width="32"
                        contain
                        class="mt-2 rounded"
                      />
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <div class="d-flex justify-end gap-2">
              <v-btn
                color="primary"
                prepend-icon="mdi-content-save"
                @click="saveSiteSettings"
                :loading="savingSite"
                :disabled="!siteFormValid"
              >
                Kaydet
              </v-btn>
            </div>
          </v-form>
        </v-window-item>

        <!-- Mail Ayarları -->
        <v-window-item value="mail">
          <v-form ref="mailFormRef" v-model="mailFormValid" @submit.prevent="saveMailSettings">
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">SMTP Sunucu Ayarları</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="mailForm.smtpHost"
                      label="SMTP Sunucu"
                      prepend-inner-icon="mdi-server-network"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || 'SMTP sunucu gereklidir']"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="mailForm.smtpPort"
                      label="SMTP Port"
                      prepend-inner-icon="mdi-numeric"
                      variant="outlined"
                      density="comfortable"
                      type="number"
                      :rules="[v => !!v || 'Port gereklidir', v => (v > 0 && v < 65536) || 'Geçerli bir port giriniz']"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="mailForm.smtpUser"
                      label="SMTP Kullanıcı Adı"
                      prepend-inner-icon="mdi-account"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || 'Kullanıcı adı gereklidir']"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="mailForm.smtpPassword"
                      label="SMTP Şifre"
                      prepend-inner-icon="mdi-lock"
                      variant="outlined"
                      density="comfortable"
                      type="password"
                      :rules="[v => !!v || 'Şifre gereklidir']"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-switch
                      v-model="mailForm.smtpSecure"
                      label="TLS/SSL Kullan"
                      color="primary"
                      inset
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">Gönderen Bilgileri</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="mailForm.fromEmail"
                      label="Gönderen E-posta"
                      prepend-inner-icon="mdi-email"
                      variant="outlined"
                      density="comfortable"
                      type="email"
                      :rules="[v => !!v || 'E-posta gereklidir', v => /.+@.+\..+/.test(v) || 'Geçerli bir e-posta adresi giriniz']"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="mailForm.fromName"
                      label="Gönderen Adı"
                      prepend-inner-icon="mdi-account-circle"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || 'Gönderen adı gereklidir']"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <div class="d-flex justify-end gap-2">
              <v-btn
                color="primary"
                prepend-icon="mdi-content-save"
                @click="saveMailSettings"
                :loading="savingMail"
                :disabled="!mailFormValid"
              >
                Kaydet
              </v-btn>
            </div>
          </v-form>
        </v-window-item>

        <!-- Ödeme Ayarları -->
        <v-window-item value="payment">
          <v-form ref="paymentFormRef" v-model="paymentFormValid" @submit.prevent="savePaymentSettings">
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">Ödeme Yöntemi Ayarları</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-select
                      v-model="paymentForm.paymentDefaultMethodId"
                      :items="paymentMethods"
                      item-title="displayName"
                      item-value="id"
                      label="Varsayılan Ödeme Yöntemi"
                      prepend-inner-icon="mdi-credit-card-multiple"
                      variant="outlined"
                      density="comfortable"
                      clearable
                      hint="Rezervasyonlarda varsayılan olarak kullanılacak ödeme yöntemi"
                      persistent-hint
                    >
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template #prepend>
                            <v-chip
                              :color="item.raw.isActive ? 'success' : 'grey'"
                              size="small"
                              variant="flat"
                              class="mr-2"
                            >
                              {{ item.raw.provider }}
                            </v-chip>
                          </template>
                        </v-list-item>
                      </template>
                      <template #selection="{ item }">
                        <v-chip
                          :color="item.raw.isActive ? 'success' : 'grey'"
                          size="small"
                          variant="flat"
                          class="mr-2"
                        >
                          {{ item.raw.provider }}
                        </v-chip>
                        {{ item.raw.displayName }}
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">Mevcut Ödeme Yöntemleri</v-card-title>
              <v-card-text>
                <v-data-table
                  :headers="paymentMethodHeaders"
                  :items="paymentMethods"
                  :items-per-page="10"
                  density="comfortable"
                >
                  <template #item.provider="{ item }">
                    <v-chip
                      :color="item.isActive ? 'success' : 'grey'"
                      size="small"
                      variant="flat"
                    >
                      {{ item.provider }}
                    </v-chip>
                  </template>
                  <template #item.isActive="{ item }">
                    <v-chip
                      :color="item.isActive ? 'success' : 'error'"
                      size="small"
                      variant="tonal"
                    >
                      {{ item.isActive ? 'Aktif' : 'Pasif' }}
                    </v-chip>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>

            <div class="d-flex justify-end gap-2">
              <v-btn
                color="primary"
                prepend-icon="mdi-content-save"
                @click="savePaymentSettings"
                :loading="savingPayment"
                :disabled="!paymentFormValid"
              >
                Kaydet
              </v-btn>
            </div>
          </v-form>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { http } from '../modules/http';

interface CurrencyDto {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  rateToTry: number;
  isBaseCurrency: boolean;
  isActive: boolean;
}

interface PaymentMethodDto {
  id: string;
  displayName: string;
  provider: string;
  isActive: boolean;
}

interface SiteSettingsDto {
  id?: string;
  siteName?: string;
  siteDescription?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTaxNumber?: string;
}

interface TenantDto {
  id: string;
  defaultCurrencyId?: string | null;
  defaultCurrency?: {
    id: string;
    code: string;
    symbol?: string;
  } | null;
}

interface MailSettingsDto {
  id?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  fromEmail?: string;
  fromName?: string;
}

interface PaymentSettingsDto {
  id?: string;
  paymentDefaultMethodId?: string | null;
}

const auth = useAuthStore();
const activeTab = ref('site');

// Forms
const siteFormRef = ref();
const mailFormRef = ref();
const paymentFormRef = ref();

const siteFormValid = ref(false);
const mailFormValid = ref(false);
const paymentFormValid = ref(true);

const siteForm = ref<SiteSettingsDto>({
  siteName: '',
  siteDescription: '',
  companyName: '',
  companyAddress: '',
  companyEmail: '',
  companyPhone: '',
  companyWebsite: '',
  companyTaxNumber: '',
});

const tenantForm = ref<{
  defaultCurrencyId: string | null;
}>({
  defaultCurrencyId: null,
});

// Uploaded file URLs (for preview only, not saved to form)
const uploadedLogoUrl = ref<string>('');
const uploadedFaviconUrl = ref<string>('');

const mailForm = ref<MailSettingsDto>({
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpSecure: true,
  fromEmail: '',
  fromName: '',
});

const paymentForm = ref<PaymentSettingsDto>({
  paymentDefaultMethodId: null,
});

// Data
const currencies = ref<CurrencyDto[]>([]);
const paymentMethods = ref<PaymentMethodDto[]>([]);

// Loading states
const savingSite = ref(false);
const savingMail = ref(false);
const savingPayment = ref(false);

// Notification messages
const siteMessage = ref<{ type: 'success' | 'error'; text: string }>({ type: 'success', text: '' });
const mailMessage = ref<{ type: 'success' | 'error'; text: string }>({ type: 'success', text: '' });
const paymentMessage = ref<{ type: 'success' | 'error'; text: string }>({ type: 'success', text: '' });

// File uploads
const logoFile = ref<File | null>(null);
const faviconFile = ref<File | null>(null);
const uploadingLogo = ref(false);
const uploadingFavicon = ref(false);

// Payment method table headers
const paymentMethodHeaders = [
  { title: 'Görünen Ad', key: 'displayName' },
  { title: 'Sağlayıcı', key: 'provider' },
  { title: 'Durum', key: 'isActive' },
];

// Load data
const loadCurrencies = async () => {
  try {
    const { data } = await http.get<CurrencyDto[]>('/currencies');
    currencies.value = data.filter(c => c.isActive);
  } catch (error) {
    console.error('Failed to load currencies:', error);
  }
};

const loadPaymentMethods = async () => {
  if (!auth.tenant) return;
  try {
    // Payment methods endpoint'i henüz yok, placeholder
    // const { data } = await http.get<PaymentMethodDto[]>('/payment-methods', {
    //   params: { tenantId: auth.tenant.id },
    // });
    // paymentMethods.value = data;
    paymentMethods.value = [];
  } catch (error) {
    console.error('Failed to load payment methods:', error);
  }
};

const loadSiteSettings = async () => {
  try {
    // Ensure auth session is initialized
    await auth.ensureSession();
    
    if (!auth.tenant) {
      console.warn('Tenant not found, cannot load site settings');
      return;
    }

    // Load site settings (siteName, siteDescription, logo, favicon, companyEmail, companyPhone)
    const { data: siteData } = await http.get<SiteSettingsDto & { logoUrl?: string; faviconUrl?: string }>('/settings/site', {
      params: { tenantId: auth.tenant.id },
    });
    if (siteData && siteData.id) {
      siteForm.value = {
        siteName: siteData.siteName || '',
        siteDescription: siteData.siteDescription || '',
        companyName: siteData.companyName || '',
        companyAddress: siteData.companyAddress || '',
        companyEmail: siteData.companyEmail || '',
        companyPhone: siteData.companyPhone || '',
        companyWebsite: siteData.companyWebsite || '',
        companyTaxNumber: siteData.companyTaxNumber || '',
      };
      // Load logo and favicon URLs for preview (they're stored in backend but not in form)
      if (siteData.logoUrl) {
        uploadedLogoUrl.value = siteData.logoUrl;
      }
      if (siteData.faviconUrl) {
        uploadedFaviconUrl.value = siteData.faviconUrl;
      }
    }

    // Load tenant data (defaultCurrencyId)
    if (auth.tenant) {
      const { data: tenantData } = await http.get<TenantDto>(`/tenants/${auth.tenant.id}`);
      if (tenantData) {
        tenantForm.value = {
          defaultCurrencyId: tenantData.defaultCurrencyId || null,
        };
      }
    }
  } catch (error) {
    console.error('Failed to load site settings:', error);
  }
};

const loadMailSettings = async () => {
  try {
    // Ensure auth session is initialized
    await auth.ensureSession();
    
    if (!auth.tenant) {
      console.warn('Tenant not found, cannot load mail settings');
      return;
    }

    const { data } = await http.get<MailSettingsDto>('/settings/mail', {
      params: { tenantId: auth.tenant.id },
    });
    if (data && data.id) {
      mailForm.value = {
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort || 587,
        smtpUser: data.smtpUser || '',
        smtpPassword: '', // Don't load password, user must re-enter
        smtpSecure: data.smtpSecure !== undefined ? data.smtpSecure : true,
        fromEmail: data.fromEmail || '',
        fromName: data.fromName || '',
      };
    }
  } catch (error) {
    console.error('Failed to load mail settings:', error);
  }
};

const loadPaymentSettings = async () => {
  try {
    // Ensure auth session is initialized
    await auth.ensureSession();
    
    if (!auth.tenant) {
      console.warn('Tenant not found, cannot load payment settings');
      return;
    }

    const { data } = await http.get<PaymentSettingsDto>('/settings/payment', {
      params: { tenantId: auth.tenant.id },
    });
    if (data && data.id) {
      paymentForm.value = {
        paymentDefaultMethodId: data.paymentDefaultMethodId || null,
      };
    }
  } catch (error) {
    console.error('Failed to load payment settings:', error);
  }
};

// Save functions
const saveSiteSettings = async () => {
  if (!siteFormValid.value || !auth.tenant) return;
  savingSite.value = true;
  siteMessage.value = { type: 'success', text: '' };
  try {
    // Save site settings (siteName, siteDescription, logo, favicon)
    await http.put('/settings/site', {
      ...siteForm.value,
    });
    
    // Save tenant defaultCurrencyId separately (always send, including null)
    const { data } = await http.patch(`/tenants/${auth.tenant.id}/default-currency`, {
      defaultCurrencyId: tenantForm.value.defaultCurrencyId ?? null,
    });
    
    // Verify the update was successful
    if (data && data.defaultCurrencyId !== (tenantForm.value.defaultCurrencyId ?? null)) {
      throw new Error('Para birimi güncellenemedi. Lütfen tekrar deneyin.');
    }
    
    siteMessage.value = { type: 'success', text: 'Site ayarları başarıyla kaydedildi.' };
    setTimeout(() => {
      siteMessage.value = { type: 'success', text: '' };
    }, 5000);
  } catch (error: any) {
    console.error('Failed to save site settings:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Ayarlar kaydedilirken bir hata oluştu.';
    siteMessage.value = { type: 'error', text: errorMessage };
  } finally {
    savingSite.value = false;
  }
};

const saveMailSettings = async () => {
  if (!mailFormValid.value) return;
  savingMail.value = true;
  try {
    await http.put('/settings/mail', {
      ...mailForm.value,
    });
    // Success notification
  } catch (error) {
    console.error('Failed to save mail settings:', error);
  } finally {
    savingMail.value = false;
  }
};

const savePaymentSettings = async () => {
  savingPayment.value = true;
  try {
    await http.put('/settings/payment', {
      ...paymentForm.value,
    });
    // Success notification
  } catch (error) {
    console.error('Failed to save payment settings:', error);
  } finally {
    savingPayment.value = false;
  }
};

// File upload handlers
const handleLogoUpload = async () => {
  if (!logoFile.value || !(logoFile.value instanceof File)) {
    return;
  }
  
  uploadingLogo.value = true;
  try {
    const formData = new FormData();
    formData.append('file', logoFile.value);

    const { data } = await http.post('/settings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (data.url) {
      uploadedLogoUrl.value = data.url;
      // Save to settings
      await http.put('/settings/site', {
        tenantId: auth.tenant!.id,
        ...siteForm.value,
        logoUrl: data.url, // Save URL to backend
      });
      logoFile.value = null; // Clear file input after successful upload
      alert('Logo başarıyla yüklendi');
    }
  } catch (error: any) {
    console.error('Failed to upload logo:', error);
    const errorMessage = error.response?.data?.message || 'Logo yüklenirken bir hata oluştu';
    alert(errorMessage);
  } finally {
    uploadingLogo.value = false;
  }
};

const handleFaviconUpload = async () => {
  if (!faviconFile.value || !(faviconFile.value instanceof File)) {
    return;
  }
  
  uploadingFavicon.value = true;
  try {
    const formData = new FormData();
    formData.append('file', faviconFile.value);

    const { data } = await http.post('/settings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (data.url) {
      uploadedFaviconUrl.value = data.url;
      // Save to settings
      await http.put('/settings/site', {
        tenantId: auth.tenant!.id,
        ...siteForm.value,
        faviconUrl: data.url, // Save URL to backend
      });
      faviconFile.value = null; // Clear file input after successful upload
      alert('Favicon başarıyla yüklendi');
    }
  } catch (error: any) {
    console.error('Failed to upload favicon:', error);
    const errorMessage = error.response?.data?.message || 'Favicon yüklenirken bir hata oluştu';
    alert(errorMessage);
  } finally {
    uploadingFavicon.value = false;
  }
};

// Get full image URL
const getImageUrl = (url: string): string => {
  if (!url) return '';
  // Eğer zaten full URL ise olduğu gibi döndür
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Relative URL ise - window.location.origin kullan (multi-tenant yapısında subdomain korunur)
  // Backend'de /uploads route'u express.static ile serve ediliyor
  const origin = window.location.origin;
  
  // URL zaten / ile başlıyorsa direkt ekle
  if (url.startsWith('/')) {
    return origin + url;
  }
  return origin + '/' + url;
};

onMounted(() => {
  loadCurrencies();
  loadPaymentMethods();
  loadSiteSettings();
  loadMailSettings();
  loadPaymentSettings();
});
</script>

<style scoped>
.v-window {
  min-height: 400px;
}
</style>

