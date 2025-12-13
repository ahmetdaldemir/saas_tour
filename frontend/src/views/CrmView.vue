<template>
  <div>
    <!-- Ana Tab Bar -->
    <v-card elevation="2" class="mb-4 main-container">
      <v-tabs v-model="mainTab" show-arrows>
        <v-tab value="extras">
          <v-icon start icon="mdi-package-variant" />
          Ekstralar
        </v-tab>
        <v-tab value="campaigns">
          <v-icon start icon="mdi-tag" />
          Kampanyalar
        </v-tab>
        <v-tab value="kapis">
          <v-icon start icon="mdi-bell-alert" />
          KAPİS Bildirim
        </v-tab>
        <v-tab value="penalty">
          <v-icon start icon="mdi-gavel" />
          Ceza Sorgulama (Tüzel)
        </v-tab>
        <v-tab value="penalty-person">
          <v-icon start icon="mdi-account-alert" />
          Ceza Sorgulama (Kişi)
        </v-tab>
        <v-tab value="hgs">
          <v-icon start icon="mdi-road-variant" />
          HGS Sorgulama
        </v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="mainTab" class="window-content">
        <!-- Ekstralar Sekmesi -->
        <v-window-item value="extras">
          <!-- Ekstra Ürünler Listesi -->
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">Ekstra ürünler</span>
              <div class="d-flex align-center gap-2">
                <v-btn icon="mdi-refresh" variant="text" @click="loadExtras" :loading="loadingExtras" />
                <v-btn color="primary" prepend-icon="mdi-plus" @click="openExtraDialog">
                  Yeni Ekle
                </v-btn>
              </div>
            </v-card-title>
            <v-divider />
            
            <!-- Ekstra Ürünler Tablosu -->
            <v-card-text class="pa-0">
              <v-data-table
                :headers="extraTableHeaders"
                :items="extras"
                :loading="loadingExtras"
                item-value="id"
                class="elevation-0 extra-table"
                density="compact"
              >
                <template #item.index="{ index }">
                  <span>{{ index + 1 }}</span>
                </template>

                <template #item.name="{ item }">
                  <span class="font-weight-medium">{{ item.name || '-' }}</span>
                </template>

                <template #item.price="{ item }">
                  <span>{{ item.price || 0 }} ₺</span>
                </template>

                <template #item.isMandatory="{ item }">
                  <v-chip
                    size="small"
                    :color="item.isMandatory ? 'success' : 'error'"
                    variant="flat"
                  >
                    {{ item.isMandatory ? 'EVET' : 'HAYIR' }}
                  </v-chip>
                </template>

                <template #item.status="{ item }">
                  <v-chip
                    size="small"
                    :color="item.isActive ? 'success' : 'error'"
                    variant="flat"
                  >
                    {{ item.isActive ? 'Aktif' : 'Pasif' }}
                  </v-chip>
                </template>

                <template #item.actions="{ item }">
                  <div class="d-flex align-center gap-1" @click.stop>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      size="small"
                      color="primary"
                      @click.stop="editExtra(item)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      @click.stop="deleteExtra(item.id)"
                    />
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Kampanyalar Sekmesi -->
        <v-window-item value="campaigns">
          <!-- Kampanya Listesi -->
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">Kampanyalar</span>
              <div class="d-flex align-center gap-2">
                <v-btn icon="mdi-refresh" variant="text" @click="loadCampaigns" :loading="loadingCampaigns" />
                <v-btn color="primary" prepend-icon="mdi-plus" @click="openCampaignDialog">
                  Yeni Kampanya Ekle
                </v-btn>
              </div>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-0">
              <v-data-table
                :headers="campaignTableHeaders"
                :items="campaigns"
                :loading="loadingCampaigns"
                item-value="id"
                class="elevation-0 campaign-table"
                density="compact"
              >
                <template #item.index="{ index }">
                  <span>{{ index + 1 }}</span>
                </template>

                <template #item.vehicleName="{ item }">
                  <span class="font-weight-medium">{{ item.vehicleName || '-' }}</span>
                </template>

                <template #item.currency="{ item }">
                  <span>{{ item.currency || '-' }}</span>
                </template>

                <template #item.startDate="{ item }">
                  <span>{{ formatDate(item.startDate) }}</span>
                </template>

                <template #item.endDate="{ item }">
                  <span>{{ formatDate(item.endDate) }}</span>
                </template>

                <template #item.status="{ item }">
                  <v-chip
                    size="small"
                    :color="item.isActive ? 'success' : 'error'"
                    variant="flat"
                  >
                    {{ item.isActive ? 'Aktif' : 'Pasif' }}
                  </v-chip>
                </template>

                <template #item.actions="{ item }">
                  <div class="d-flex align-center gap-1" @click.stop>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      size="small"
                      color="primary"
                      @click.stop="editCampaign(item)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      @click.stop="deleteCampaign(item.id)"
                    />
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- KAPİS Bildirim Sekmesi -->
        <v-window-item value="kapis">
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">KAPİS Bildirim</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-8 d-flex align-center justify-center" style="height: calc(100vh - 300px); min-height: 600px;">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-open-in-new"
                @click="openKapisInNewTab"
              >
                Yeni Sekmede Aç
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Ceza Sorgulama (Tüzel) Sekmesi -->
        <v-window-item value="penalty">
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">Ceza Sorgulama (Tüzel)</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-8 d-flex align-center justify-center" style="height: calc(100vh - 300px); min-height: 600px;">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-open-in-new"
                @click="openPenaltyInNewTab"
              >
                Yeni Sekmede Aç
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Ceza Sorgulama (Kişi) Sekmesi -->
        <v-window-item value="penalty-person">
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">Ceza Sorgulama (Kişi)</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-8 d-flex align-center justify-center" style="height: calc(100vh - 300px); min-height: 600px;">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-open-in-new"
                @click="openPenaltyPersonInNewTab"
              >
                Yeni Sekmede Aç
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- HGS Sorgulama Sekmesi -->
        <v-window-item value="hgs">
          <v-card elevation="0" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
              <span class="text-h6 font-weight-bold">HGS Sorgulama</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-8 d-flex align-center justify-center" style="height: calc(100vh - 300px); min-height: 600px;">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-open-in-new"
                @click="openHgsInNewTab"
              >
                Yeni Sekmede Aç
              </v-btn>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Kampanya Ekleme/Düzenleme Dialog -->
    <v-dialog v-model="showCampaignDialog" max-width="1400" fullscreen scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-tag-plus" size="24" />
            <span class="text-h6">{{ editingCampaign ? 'Kampanya Düzenle' : 'Kampanya Ekleme Formu' }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeCampaignDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-form ref="campaignFormRef" v-model="campaignFormValid">
            <div class="pa-6">
              <v-row>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="campaignForm.vehicleId"
                    :items="vehicles"
                    item-title="name"
                    item-value="id"
                    label="Araç"
                    prepend-inner-icon="mdi-car"
                    :loading="loadingVehicles"
                    class="mb-2"
                  >
                    <template #item="{ item, props }">
                      <v-list-item v-bind="props">
                        <template #title>
                          {{ getVehicleDisplayName(item.raw) }}
                        </template>
                      </v-list-item>
                    </template>
                    <template #selection="{ item }">
                      {{ getVehicleDisplayName(item) }}
                    </template>
                  </v-select>
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="campaignForm.currency"
                    :items="currencyOptions"
                    item-title="label"
                    item-value="value"
                    label="Para Birimi"
                    prepend-inner-icon="mdi-currency-usd"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="campaignForm.region"
                    :items="regionOptions"
                    item-title="label"
                    item-value="value"
                    label="Yayınlanacağı Bölge"
                    prepend-inner-icon="mdi-earth"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="campaignForm.validCities"
                    :items="locationOptions"
                    item-title="label"
                    item-value="value"
                    label="Geçerli Şehirler"
                    prepend-inner-icon="mdi-map-marker-multiple"
                    multiple
                    chips
                    closable-chips
                    :loading="loadingLocations"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model.number="campaignForm.price1to3"
                    label="1-3 Gün"
                    type="number"
                    prepend-inner-icon="mdi-currency-try"
                    suffix="₺"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model.number="campaignForm.price4to6"
                    label="4-6 Gün"
                    type="number"
                    prepend-inner-icon="mdi-currency-try"
                    suffix="₺"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model.number="campaignForm.price7to13"
                    label="7-13 Gün"
                    type="number"
                    prepend-inner-icon="mdi-currency-try"
                    suffix="₺"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    v-model.number="campaignForm.price14to30"
                    label="14-30 Gün"
                    type="number"
                    prepend-inner-icon="mdi-currency-try"
                    suffix="₺"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="campaignForm.startDate"
                    label="Başlangıç Tarihi"
                    type="date"
                    prepend-inner-icon="mdi-calendar"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="campaignForm.endDate"
                    label="Bitiş Tarihi"
                    type="date"
                    prepend-inner-icon="mdi-calendar"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-select
                    v-model="campaignForm.validityDays"
                    :items="validityDaysOptions"
                    item-title="label"
                    item-value="value"
                    label="Geçerlilik Süresi"
                    prepend-inner-icon="mdi-calendar-range"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-select
                    v-model="campaignForm.customerType"
                    :items="customerTypeOptions"
                    item-title="label"
                    item-value="value"
                    label="Müşteri Tipi"
                    prepend-inner-icon="mdi-account"
                    class="mb-2"
                  />
                </v-col>
              </v-row>

              <!-- Dil Sekmeleri -->
              <div class="mt-4">
                <label class="text-body-1 font-weight-medium mb-2 d-block">Kampanya Adı</label>
                <v-tabs v-model="campaignNameLanguageTab" show-arrows>
                  <v-tab
                    v-for="lang in availableLanguages"
                    :key="lang.id"
                    :value="lang.id"
                  >
                    {{ lang.name }}
                  </v-tab>
                </v-tabs>
                <v-window v-model="campaignNameLanguageTab">
                  <v-window-item
                    v-for="lang in availableLanguages"
                    :key="lang.id"
                    :value="lang.id"
                  >
                    <v-text-field
                      v-model="campaignForm.nameTranslations[lang.id]"
                      :label="`Kampanya Adı (${lang.name})`"
                      :placeholder="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için kampanya adı'"
                      prepend-inner-icon="mdi-tag"
                      :hint="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için kampanya adı'"
                      persistent-hint
                      class="mt-2"
                    />
                  </v-window-item>
                </v-window>
              </div>

              <div class="mt-4">
                <label class="text-body-1 font-weight-medium mb-2 d-block">Kampanya Açıklaması</label>
                <v-tabs v-model="campaignDescriptionLanguageTab" show-arrows>
                  <v-tab
                    v-for="lang in availableLanguages"
                    :key="lang.id"
                    :value="lang.id"
                  >
                    {{ lang.name }}
                  </v-tab>
                </v-tabs>
                <v-window v-model="campaignDescriptionLanguageTab">
                  <v-window-item
                    v-for="lang in availableLanguages"
                    :key="lang.id"
                    :value="lang.id"
                  >
                    <v-textarea
                      v-model="campaignForm.descriptionTranslations[lang.id]"
                      :label="`Kampanya Açıklaması (${lang.name})`"
                      :placeholder="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için kampanya açıklaması'"
                      prepend-inner-icon="mdi-text"
                      rows="8"
                      :hint="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için kampanya açıklaması'"
                      persistent-hint
                      class="mt-2"
                    />
                  </v-window-item>
                </v-window>
              </div>
            </div>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeCampaignDialog">Kapat</v-btn>
          <v-btn color="primary" @click="saveCampaign" :loading="savingCampaign" :disabled="!campaignFormValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Ekstra Ürün Ekleme/Düzenleme Dialog -->
    <v-dialog v-model="showExtraDialog" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-package-variant-plus" size="24" />
            <span class="text-h6">{{ editingExtra ? 'Ekstra Ürün Düzenle' : 'Ekstra Ürün Ekleme Formu' }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeExtraDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-form ref="extraFormRef" v-model="extraFormValid">
            <!-- Ürün Adı - Dil Sekmeleri -->
            <div class="pa-4">
              <label class="text-body-1 font-weight-medium mb-2 d-block">Ürün Adı</label>
              <v-tabs v-model="extraLanguageTab" show-arrows>
                <v-tab
                  v-for="lang in availableLanguages"
                  :key="lang.id"
                  :value="lang.id"
                >
                  {{ lang.name }}
                </v-tab>
              </v-tabs>
              <v-window v-model="extraLanguageTab">
                <v-window-item
                  v-for="lang in availableLanguages"
                  :key="lang.id"
                  :value="lang.id"
                >
                  <v-text-field
                    v-model="extraForm.translations[lang.id]"
                    :label="`Ürün Adı (${lang.name})`"
                    :placeholder="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için ürün adı'"
                    prepend-inner-icon="mdi-package-variant"
                    :hint="lang.isDefault ? 'Varsayılan dil - diğer dillere otomatik çevrilecek' : 'Bu dil için ürün adı'"
                    persistent-hint
                    class="mt-2"
                  />
                </v-window-item>
              </v-window>
            </div>

            <v-divider />

            <v-row class="pa-4">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="extraForm.price"
                  label="Fiyat"
                  type="number"
                  prepend-inner-icon="mdi-currency-try"
                  suffix="₺"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="extraForm.isMandatory"
                  :items="yesNoOptions"
                  item-title="label"
                  item-value="value"
                  label="Kontratta Zorunlumu"
                  prepend-inner-icon="mdi-check-circle"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="extraForm.canIncreaseQuantity"
                  :items="yesNoOptions"
                  item-title="label"
                  item-value="value"
                  label="Adet Arttırma"
                  prepend-inner-icon="mdi-plus-circle"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="extraForm.image"
                  label="Resim"
                  prepend-inner-icon="mdi-image"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="extraForm.value"
                  label="Değer"
                  prepend-inner-icon="mdi-numeric"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="extraForm.inputName"
                  label="Input Name"
                  prepend-inner-icon="mdi-form-textbox"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="extraForm.type"
                  :items="extraTypeOptions"
                  item-title="label"
                  item-value="value"
                  label="Tipi"
                  prepend-inner-icon="mdi-format-list-bulleted-type"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="extraForm.salesType"
                  :items="salesTypeOptions"
                  item-title="label"
                  item-value="value"
                  label="Satış Tipi"
                  prepend-inner-icon="mdi-cash-multiple"
                  class="mb-2"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeExtraDialog">Kapat</v-btn>
          <v-btn color="primary" @click="saveExtra" :loading="savingExtra" :disabled="!extraFormValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';
import { translateText } from '../services/deepl';

const auth = useAuthStore();

// Data
const availableLanguages = ref<LanguageDto[]>([]);
const extras = ref<ExtraDto[]>([]);
const campaigns = ref<CampaignDto[]>([]);
const vehicles = ref<VehicleDto[]>([]);
const locations = ref<LocationDto[]>([]);

// UI State
const mainTab = ref('extras');
const loadingExtras = ref(false);
const loadingCampaigns = ref(false);
const loadingVehicles = ref(false);
const loadingLocations = ref(false);
const kapisUrl = 'https://arackiralama.egm.gov.tr/my.policy';
const penaltyUrl = 'https://www.turkiye.gov.tr/egm-arac-plakasina-yazilan-ceza-sorgulama-tuzel-kisi';
const penaltyPersonUrl = 'https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama';
const hgsUrl = 'https://webihlaltakip.kgm.gov.tr/WebIhlalSorgulama/Sayfalar/Sorgulama';
const showExtraDialog = ref(false);
const savingExtra = ref(false);
const editingExtra = ref<ExtraDto | null>(null);
const extraLanguageTab = ref('');
const showCampaignDialog = ref(false);
const savingCampaign = ref(false);
const editingCampaign = ref<CampaignDto | null>(null);
const campaignNameLanguageTab = ref('');
const campaignDescriptionLanguageTab = ref('');

// Form Refs
const extraFormRef = ref();
const extraFormValid = ref(false);
const campaignFormRef = ref();
const campaignFormValid = ref(false);

// Options
const yesNoOptions = [
  { label: 'Evet', value: true },
  { label: 'Hayır', value: false },
];

const extraTypeOptions = [
  { label: 'Sigorta', value: 'insurance' },
  { label: 'Ekstra', value: 'extra' },
];

const salesTypeOptions = [
  { label: 'Günlük', value: 'daily' },
  { label: 'Kiralama Başı', value: 'per_rental' },
];

const currencyOptions = [
  { label: 'TRY', value: 'TRY' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
];

const regionOptions = [
  { label: 'Yurt İçi', value: 'domestic' },
  { label: 'Yurt Dışı', value: 'international' },
];

const validityDaysOptions = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1} Gün`,
  value: i + 1,
})).concat([{ label: '30+ Gün', value: 31 }]);

const customerTypeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Özel Müşteri', value: 'special' },
];

// Computed
const locationOptions = computed(() => {
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  return locations.value.map(loc => {
    let name = loc.name || '';
    if (!name && loc.translations && defaultLang) {
      const translation = loc.translations.find(t => t.languageId === defaultLang.id);
      name = translation?.name || '';
    }
    if (!name && loc.province) {
      name = loc.district ? `${loc.province} - ${loc.district}` : loc.province;
    }
    return {
      label: name || 'İsimsiz Lokasyon',
      value: loc.id,
    };
  });
});

const campaignDefaultLanguageId = computed(() => {
  return availableLanguages.value.find(l => l.isDefault)?.id || availableLanguages.value[0]?.id;
});

// Interfaces
interface LanguageDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface ExtraDto {
  id: string;
  name: string;
  price: number;
  isMandatory: boolean;
  isActive: boolean;
  canIncreaseQuantity?: boolean;
  image?: string;
  value?: string;
  inputName?: string;
  type?: 'insurance' | 'extra';
  salesType?: 'daily' | 'per_rental';
}

interface VehicleDto {
  id: string;
  name: string;
  brand?: { name: string } | null;
  brandName?: string;
  model?: { name: string } | null;
  modelName?: string;
  year?: number;
}

interface LocationDto {
  id: string;
  name?: string;
  province?: string;
  district?: string;
  translations?: Array<{ languageId: string; name: string }>;
}

interface CampaignDto {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  currency: string;
  region: string;
  validCities: string[];
  price1to3: number;
  price4to6: number;
  price7to13: number;
  price14to30: number;
  startDate: string;
  endDate: string;
  validityDays: number;
  customerType: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  isActive: boolean;
}

// Extra Form
const extraForm = reactive<{
  translations: Record<string, string>;
  price: number | null;
  isMandatory: boolean;
  canIncreaseQuantity: boolean;
  image: string;
  value: string;
  inputName: string;
  type: 'insurance' | 'extra';
  salesType: 'daily' | 'per_rental';
}>({
  translations: {},
  price: null,
  isMandatory: false,
  canIncreaseQuantity: false,
  image: '',
  value: '',
  inputName: 'default',
  type: 'extra',
  salesType: 'daily',
});

// Campaign Form
const campaignForm = reactive<{
  vehicleId: string;
  currency: string;
  region: string;
  validCities: string[];
  price1to3: number | null;
  price4to6: number | null;
  price7to13: number | null;
  price14to30: number | null;
  startDate: string;
  endDate: string;
  validityDays: number;
  customerType: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
}>({
  vehicleId: '',
  currency: 'TRY',
  region: 'domestic',
  validCities: [],
  price1to3: null,
  price4to6: null,
  price7to13: null,
  price14to30: null,
  startDate: '',
  endDate: '',
  validityDays: 7,
  customerType: 'normal',
  nameTranslations: {},
  descriptionTranslations: {},
});

// Table headers
const extraTableHeaders = [
  { title: '#', key: 'index', sortable: false, width: '50px' },
  { title: 'Ürün Adı', key: 'name', width: '250px' },
  { title: 'Fiyat', key: 'price', width: '100px' },
  { title: 'Zorunlumu', key: 'isMandatory', sortable: false, width: '120px' },
  { title: 'Durum', key: 'status', sortable: false, width: '100px' },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '120px' },
];

const campaignTableHeaders = [
  { title: '#', key: 'index', sortable: false, width: '50px' },
  { title: 'Araç', key: 'vehicleName', width: '200px' },
  { title: 'Para Birimi', key: 'currency', width: '100px' },
  { title: 'Başlangıç Tarihi', key: 'startDate', width: '150px' },
  { title: 'Bitiş Tarihi', key: 'endDate', width: '150px' },
  { title: 'Durum', key: 'status', sortable: false, width: '100px' },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '120px' },
];

// Helper functions for localStorage
const getDeletedExtras = (): string[] => {
  try {
    const deleted = localStorage.getItem('crm_deleted_extras');
    return deleted ? JSON.parse(deleted) : [];
  } catch {
    return [];
  }
};

const saveDeletedExtras = (deletedIds: string[]) => {
  try {
    localStorage.setItem('crm_deleted_extras', JSON.stringify(deletedIds));
  } catch (error) {
    console.error('Failed to save deleted extras:', error);
  }
};

const getAddedExtras = (): ExtraDto[] => {
  try {
    const added = localStorage.getItem('crm_added_extras');
    return added ? JSON.parse(added) : [];
  } catch {
    return [];
  }
};

const saveAddedExtras = (extras: ExtraDto[]) => {
  try {
    localStorage.setItem('crm_added_extras', JSON.stringify(extras));
  } catch (error) {
    console.error('Failed to save added extras:', error);
  }
};

// Extra Products Methods
const loadExtras = async () => {
  if (!auth.tenant) return;
  loadingExtras.value = true;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // const { data } = await http.get<ExtraDto[]>('/crm/extras', {
    //   params: { tenantId: auth.tenant.id },
    // });
    // extras.value = data;
    
    // Örnek veri (görseldeki gibi)
    const sampleData: ExtraDto[] = [
      {
        id: '1',
        name: 'Mini Hasar Paketi',
        price: 2,
        isMandatory: true,
        isActive: true,
      },
      {
        id: '4',
        name: 'Navigasyon',
        price: 3,
        isMandatory: false,
        isActive: true,
      },
      {
        id: '7',
        name: 'Kış Lastiği',
        price: 2,
        isMandatory: false,
        isActive: false,
      },
      {
        id: '8',
        name: 'Hızlı Geciş HGS',
        price: 19,
        isMandatory: false,
        isActive: true,
      },
      {
        id: '9',
        name: 'Çocuk Koltuğu',
        price: 3,
        isMandatory: false,
        isActive: true,
      },
      {
        id: '11',
        name: 'Kar Lastik Paleti',
        price: 2,
        isMandatory: false,
        isActive: false,
      },
      {
        id: '12',
        name: 'Kapsamlı Sigorta',
        price: 3,
        isMandatory: true,
        isActive: true,
      },
      {
        id: '13',
        name: 'Ek 400 Km Paketi',
        price: 39,
        isMandatory: false,
        isActive: true,
      },
      {
        id: '14',
        name: 'Çocuk Koltuk Yükseltici',
        price: 3,
        isMandatory: false,
        isActive: true,
      },
      {
        id: '18',
        name: 'Wifi-İnternet',
        price: 4,
        isMandatory: false,
        isActive: true,
      },
    ];
    
    // Silinen öğeleri filtrele ve eklenen öğeleri ekle
    const deletedIds = getDeletedExtras();
    const addedExtras = getAddedExtras();
    const filteredSample = sampleData.filter(item => !deletedIds.includes(item.id));
    extras.value = [...filteredSample, ...addedExtras];
  } catch (error) {
    console.error('Failed to load extras:', error);
  } finally {
    loadingExtras.value = false;
  }
};

// Computed for extra form default language
const extraDefaultLanguageId = computed(() => {
  return availableLanguages.value.find(l => l.isDefault)?.id || availableLanguages.value[0]?.id;
});

// Auto-translate extra product name
watch(
  () => {
    const defaultLangId = extraDefaultLanguageId.value;
    if (!defaultLangId) return '';
    return extraForm.translations[defaultLangId] || '';
  },
  async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) return;
    
    const defaultLang = availableLanguages.value.find(l => l.id === extraDefaultLanguageId.value);
    if (!defaultLang) return;
    
    // Debounce translation
    setTimeout(async () => {
      for (const lang of availableLanguages.value) {
        if (lang.id === defaultLang.id) continue;
        if (extraForm.translations[lang.id] && extraForm.translations[lang.id] !== '') continue;
        
        try {
          const translated = await translateText(newValue, lang.code, defaultLang.code);
          extraForm.translations[lang.id] = translated;
        } catch (error) {
          console.error(`Failed to translate extra product name to ${lang.code}:`, error);
        }
      }
    }, 1500);
  }
);

// Auto-translate campaign name
watch(
  () => {
    const defaultLangId = campaignDefaultLanguageId.value;
    if (!defaultLangId) return '';
    return campaignForm.nameTranslations[defaultLangId] || '';
  },
  async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) return;
    
    const defaultLang = availableLanguages.value.find(l => l.id === campaignDefaultLanguageId.value);
    if (!defaultLang) return;
    
    // Debounce translation
    setTimeout(async () => {
      for (const lang of availableLanguages.value) {
        if (lang.id === defaultLang.id) continue;
        if (campaignForm.nameTranslations[lang.id] && campaignForm.nameTranslations[lang.id] !== '') continue;
        
        try {
          const translated = await translateText(newValue, lang.code, defaultLang.code);
          campaignForm.nameTranslations[lang.id] = translated;
        } catch (error) {
          console.error(`Failed to translate campaign name to ${lang.code}:`, error);
        }
      }
    }, 1500);
  }
);

// Auto-translate campaign description
watch(
  () => {
    const defaultLangId = campaignDefaultLanguageId.value;
    if (!defaultLangId) return '';
    return campaignForm.descriptionTranslations[defaultLangId] || '';
  },
  async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) return;
    
    const defaultLang = availableLanguages.value.find(l => l.id === campaignDefaultLanguageId.value);
    if (!defaultLang) return;
    
    // Debounce translation
    setTimeout(async () => {
      for (const lang of availableLanguages.value) {
        if (lang.id === defaultLang.id) continue;
        if (campaignForm.descriptionTranslations[lang.id] && campaignForm.descriptionTranslations[lang.id] !== '') continue;
        
        try {
          const translated = await translateText(newValue, lang.code, defaultLang.code);
          campaignForm.descriptionTranslations[lang.id] = translated;
        } catch (error) {
          console.error(`Failed to translate campaign description to ${lang.code}:`, error);
        }
      }
    }, 1500);
  }
);

const openExtraDialog = () => {
  editingExtra.value = null;
  resetExtraForm();
  showExtraDialog.value = true;
  
  // Set default language tab
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    extraLanguageTab.value = defaultLang.id;
  }
};

const closeExtraDialog = () => {
  showExtraDialog.value = false;
  resetExtraForm();
};

const resetExtraForm = () => {
  extraForm.translations = {};
  extraForm.price = null;
  extraForm.isMandatory = false;
  extraForm.canIncreaseQuantity = false;
  extraForm.image = '';
  extraForm.value = '';
  extraForm.inputName = 'default';
  extraForm.type = 'extra';
  extraForm.salesType = 'daily';
  
  // Initialize translations for all languages
  availableLanguages.value.forEach(lang => {
    extraForm.translations[lang.id] = '';
  });
};

const saveExtra = async () => {
  if (!auth.tenant) return;
  
  const validated = await extraFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingExtra.value = true;
  try {
    const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
    const defaultName = extraForm.translations[defaultLang?.id || ''] || '';
    
    if (!defaultName) {
      alert('Varsayılan dilde ürün adı girilmelidir');
      return;
    }
    
    const extraData = {
      tenantId: auth.tenant.id,
      name: defaultName,
      translations: availableLanguages.value.map(lang => ({
        languageId: lang.id,
        name: extraForm.translations[lang.id] || '',
      })),
      price: extraForm.price || 0,
      isMandatory: extraForm.isMandatory,
      canIncreaseQuantity: extraForm.canIncreaseQuantity,
      image: extraForm.image,
      value: extraForm.value,
      inputName: extraForm.inputName,
      type: extraForm.type,
      salesType: extraForm.salesType,
      isActive: true,
    };
    
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // if (editingExtra.value) {
    //   await http.put(`/crm/extras/${editingExtra.value.id}`, extraData);
    // } else {
    //   await http.post('/crm/extras', extraData);
    // }
    
    // Örnek veri için local state'e ekleme
    if (!editingExtra.value) {
      const newExtra: ExtraDto = {
        id: Date.now().toString(),
        name: defaultName,
        price: extraForm.price || 0,
        isMandatory: extraForm.isMandatory,
        isActive: true,
        canIncreaseQuantity: extraForm.canIncreaseQuantity,
        image: extraForm.image,
        value: extraForm.value,
        inputName: extraForm.inputName,
        type: extraForm.type,
        salesType: extraForm.salesType,
      };
      extras.value.push(newExtra);
      
      // localStorage'a kaydet
      const addedExtras = getAddedExtras();
      addedExtras.push(newExtra);
      saveAddedExtras(addedExtras);
    } else {
      // Update existing extra
      const index = extras.value.findIndex(e => e.id === editingExtra.value?.id);
      if (index !== -1) {
        extras.value[index] = {
          ...extras.value[index],
          name: defaultName,
          price: extraForm.price || 0,
          isMandatory: extraForm.isMandatory,
          canIncreaseQuantity: extraForm.canIncreaseQuantity,
          image: extraForm.image,
          value: extraForm.value,
          inputName: extraForm.inputName,
          type: extraForm.type,
          salesType: extraForm.salesType,
        };
      }
      
      // localStorage'da güncelle
      const addedExtras = getAddedExtras();
      const addedIndex = addedExtras.findIndex(e => e.id === editingExtra.value?.id);
      if (addedIndex !== -1) {
        addedExtras[addedIndex] = {
          ...addedExtras[addedIndex],
          name: defaultName,
          price: extraForm.price || 0,
          isMandatory: extraForm.isMandatory,
          canIncreaseQuantity: extraForm.canIncreaseQuantity,
          image: extraForm.image,
          value: extraForm.value,
          inputName: extraForm.inputName,
          type: extraForm.type,
          salesType: extraForm.salesType,
        };
        saveAddedExtras(addedExtras);
      }
    }
    
    // loadExtras() çağrılmıyor çünkü zaten local state güncellendi
    // await loadExtras();
    closeExtraDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Ekstra ürün kaydedilirken bir hata oluştu');
  } finally {
    savingExtra.value = false;
  }
};

const editExtra = (extra: ExtraDto) => {
  editingExtra.value = extra;
  
  // Reset form
  resetExtraForm();
  
  // Set form values
  extraForm.price = extra.price;
  extraForm.isMandatory = extra.isMandatory;
  extraForm.canIncreaseQuantity = extra.canIncreaseQuantity ?? false;
  extraForm.image = extra.image || '';
  extraForm.value = extra.value || '';
  extraForm.inputName = extra.inputName || 'default';
  extraForm.type = extra.type || 'extra';
  extraForm.salesType = extra.salesType || 'daily';
  
  // Set name in default language
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    extraForm.translations[defaultLang.id] = extra.name;
    extraLanguageTab.value = defaultLang.id;
  }
  
  showExtraDialog.value = true;
};

const deleteExtra = async (id: string) => {
  if (!confirm('Bu ekstra ürünü silmek istediğinizden emin misiniz?')) return;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // await http.delete(`/crm/extras/${id}`);
    
    // Örnek veri için local state'ten silme
    const index = extras.value.findIndex(e => e.id === id);
    if (index !== -1) {
      extras.value.splice(index, 1);
    }
    
    // Silinen ID'yi localStorage'a kaydet
    const deletedIds = getDeletedExtras();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveDeletedExtras(deletedIds);
    }
    
    // Eklenen öğelerden de sil
    const addedExtras = getAddedExtras();
    const addedIndex = addedExtras.findIndex(e => e.id === id);
    if (addedIndex !== -1) {
      addedExtras.splice(addedIndex, 1);
      saveAddedExtras(addedExtras);
    }
    
    // Backend API hazır olduğunda yukarıdaki satırı kaldırıp loadExtras() kullanılacak
    // await loadExtras();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Ekstra ürün silinirken bir hata oluştu');
  }
};

const openKapisInNewTab = () => {
  window.open(kapisUrl, '_blank', 'noopener,noreferrer');
};

const openPenaltyInNewTab = () => {
  window.open(penaltyUrl, '_blank', 'noopener,noreferrer');
};

const openPenaltyPersonInNewTab = () => {
  window.open(penaltyPersonUrl, '_blank', 'noopener,noreferrer');
};

const openHgsInNewTab = () => {
  window.open(hgsUrl, '_blank', 'noopener,noreferrer');
};

// Campaign Methods
const getVehicleDisplayName = (vehicle: VehicleDto): string => {
  const brand = vehicle.brand?.name || vehicle.brandName || '';
  const model = vehicle.model?.name || vehicle.modelName || '';
  const year = vehicle.year || '';
  if (brand && model && year) {
    return `${brand} - ${model} - ${year}`;
  }
  return vehicle.name || 'Araç';
};

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR');
  } catch {
    return date;
  }
};

const loadVehicles = async () => {
  if (!auth.tenant) return;
  loadingVehicles.value = true;
  try {
    const { data } = await http.get<VehicleDto[]>('/rentacar/vehicles', {
      params: { tenantId: auth.tenant.id },
    });
    vehicles.value = data;
  } catch (error) {
    console.error('Failed to load vehicles:', error);
  } finally {
    loadingVehicles.value = false;
  }
};

const loadLocations = async () => {
  if (!auth.tenant) return;
  loadingLocations.value = true;
  try {
    const { data } = await http.get<LocationDto[]>('/rentacar/locations', {
      params: { tenantId: auth.tenant.id },
    });
    locations.value = data.filter(loc => loc.province); // Sadece şehirleri al
  } catch (error) {
    console.error('Failed to load locations:', error);
  } finally {
    loadingLocations.value = false;
  }
};

const loadCampaigns = async () => {
  if (!auth.tenant) return;
  loadingCampaigns.value = true;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // const { data } = await http.get<CampaignDto[]>('/crm/campaigns', {
    //   params: { tenantId: auth.tenant.id },
    // });
    // campaigns.value = data;
    
    // Örnek veri
    campaigns.value = [];
  } catch (error) {
    console.error('Failed to load campaigns:', error);
  } finally {
    loadingCampaigns.value = false;
  }
};

const openCampaignDialog = () => {
  editingCampaign.value = null;
  resetCampaignForm();
  showCampaignDialog.value = true;
  
  // Set default language tabs
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    campaignNameLanguageTab.value = defaultLang.id;
    campaignDescriptionLanguageTab.value = defaultLang.id;
  }
};

const closeCampaignDialog = () => {
  showCampaignDialog.value = false;
  resetCampaignForm();
};

const resetCampaignForm = () => {
  campaignForm.vehicleId = '';
  campaignForm.currency = 'TRY';
  campaignForm.region = 'domestic';
  campaignForm.validCities = [];
  campaignForm.price1to3 = null;
  campaignForm.price4to6 = null;
  campaignForm.price7to13 = null;
  campaignForm.price14to30 = null;
  campaignForm.startDate = '';
  campaignForm.endDate = '';
  campaignForm.validityDays = 7;
  campaignForm.customerType = 'normal';
  campaignForm.nameTranslations = {};
  campaignForm.descriptionTranslations = {};
  
  // Initialize translations for all languages
  availableLanguages.value.forEach(lang => {
    campaignForm.nameTranslations[lang.id] = '';
    campaignForm.descriptionTranslations[lang.id] = '';
  });
};

const saveCampaign = async () => {
  if (!auth.tenant) return;
  
  const validated = await campaignFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingCampaign.value = true;
  try {
    const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
    const defaultName = campaignForm.nameTranslations[defaultLang?.id || ''] || '';
    
    if (!defaultName) {
      alert('Varsayılan dilde kampanya adı girilmelidir');
      return;
    }
    
    if (!campaignForm.vehicleId) {
      alert('Araç seçilmelidir');
      return;
    }
    
    const selectedVehicle = vehicles.value.find(v => v.id === campaignForm.vehicleId);
    const campaignData = {
      tenantId: auth.tenant.id,
      vehicleId: campaignForm.vehicleId,
      vehicleName: selectedVehicle ? getVehicleDisplayName(selectedVehicle) : '',
      currency: campaignForm.currency,
      region: campaignForm.region,
      validCities: campaignForm.validCities,
      price1to3: campaignForm.price1to3 || 0,
      price4to6: campaignForm.price4to6 || 0,
      price7to13: campaignForm.price7to13 || 0,
      price14to30: campaignForm.price14to30 || 0,
      startDate: campaignForm.startDate,
      endDate: campaignForm.endDate,
      validityDays: campaignForm.validityDays,
      customerType: campaignForm.customerType,
      nameTranslations: availableLanguages.value.map(lang => ({
        languageId: lang.id,
        name: campaignForm.nameTranslations[lang.id] || '',
      })),
      descriptionTranslations: availableLanguages.value.map(lang => ({
        languageId: lang.id,
        description: campaignForm.descriptionTranslations[lang.id] || '',
      })),
      isActive: true,
    };
    
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // if (editingCampaign.value) {
    //   await http.put(`/crm/campaigns/${editingCampaign.value.id}`, campaignData);
    // } else {
    //   await http.post('/crm/campaigns', campaignData);
    // }
    
    // Örnek veri için local state'e ekleme
    if (!editingCampaign.value) {
      const newCampaign: CampaignDto = {
        id: Date.now().toString(),
        ...campaignData,
        nameTranslations: campaignForm.nameTranslations,
        descriptionTranslations: campaignForm.descriptionTranslations,
      };
      campaigns.value.push(newCampaign);
    } else {
      const index = campaigns.value.findIndex(c => c.id === editingCampaign.value?.id);
      if (index !== -1) {
        campaigns.value[index] = {
          ...campaigns.value[index],
          ...campaignData,
          nameTranslations: campaignForm.nameTranslations,
          descriptionTranslations: campaignForm.descriptionTranslations,
        };
      }
    }
    
    closeCampaignDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Kampanya kaydedilirken bir hata oluştu');
  } finally {
    savingCampaign.value = false;
  }
};

const editCampaign = (campaign: CampaignDto) => {
  editingCampaign.value = campaign;
  
  // Reset form
  resetCampaignForm();
  
  // Set form values
  campaignForm.vehicleId = campaign.vehicleId;
  campaignForm.currency = campaign.currency;
  campaignForm.region = campaign.region;
  campaignForm.validCities = campaign.validCities;
  campaignForm.price1to3 = campaign.price1to3;
  campaignForm.price4to6 = campaign.price4to6;
  campaignForm.price7to13 = campaign.price7to13;
  campaignForm.price14to30 = campaign.price14to30;
  campaignForm.startDate = campaign.startDate;
  campaignForm.endDate = campaign.endDate;
  campaignForm.validityDays = campaign.validityDays;
  campaignForm.customerType = campaign.customerType;
  campaignForm.nameTranslations = { ...campaign.nameTranslations };
  campaignForm.descriptionTranslations = { ...campaign.descriptionTranslations };
  
  // Set default language tabs
  const defaultLang = availableLanguages.value.find(l => l.isDefault) || availableLanguages.value[0];
  if (defaultLang) {
    campaignNameLanguageTab.value = defaultLang.id;
    campaignDescriptionLanguageTab.value = defaultLang.id;
  }
  
  showCampaignDialog.value = true;
};

const deleteCampaign = async (id: string) => {
  if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // await http.delete(`/crm/campaigns/${id}`);
    
    const index = campaigns.value.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns.value.splice(index, 1);
    }
  } catch (error: any) {
    alert(error.response?.data?.message || 'Kampanya silinirken bir hata oluştu');
  }
};

const loadLanguages = async () => {
  try {
    const { data } = await http.get<LanguageDto[]>('/languages');
    availableLanguages.value = data.filter(lang => lang.isActive);
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

onMounted(async () => {
  await Promise.all([
    loadLanguages(),
    loadExtras(),
    loadCampaigns(),
    loadVehicles(),
    loadLocations(),
  ]);
  
  // Initialize extra form translations
  availableLanguages.value.forEach(lang => {
    extraForm.translations[lang.id] = '';
  });
  
  // Initialize campaign form translations
  availableLanguages.value.forEach(lang => {
    campaignForm.nameTranslations[lang.id] = '';
    campaignForm.descriptionTranslations[lang.id] = '';
  });
});
</script>

<style scoped>
.main-container {
  width: 100%;
  max-width: 100%;
}

.window-content {
  width: 100%;
}

.window-content :deep(.v-window-item) {
  width: 100%;
  padding: 0;
}

.extra-table {
  width: 100%;
}

.extra-table :deep(th),
.extra-table :deep(td) {
  white-space: nowrap;
  padding: 10px 12px !important;
  vertical-align: middle;
}

.extra-table :deep(th) {
  font-weight: 600;
  font-size: 0.875rem;
}

.extra-table :deep(.v-data-table-header) {
  background-color: rgba(var(--v-theme-surface), 1);
}

.extra-table :deep(.v-btn) {
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.campaign-table {
  width: 100%;
}

.campaign-table :deep(th),
.campaign-table :deep(td) {
  white-space: nowrap;
  padding: 10px 12px !important;
  vertical-align: middle;
}

.campaign-table :deep(th) {
  font-weight: 600;
  font-size: 0.875rem;
}

.campaign-table :deep(.v-data-table-header) {
  background-color: rgba(var(--v-theme-surface), 1);
}

.campaign-table :deep(.v-btn) {
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}
</style>
