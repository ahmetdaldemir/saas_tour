<template>
  <div class="campaigns-view">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-h6">Kampanyalar</span>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openCreateDialog"
              >
                Yeni Kampanya
              </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-data-table
                :headers="tableHeaders"
                :items="campaigns"
                :loading="loading"
                item-value="id"
                class="elevation-0"
              >
                <template #item.name="{ item }">
                  <div class="d-flex align-center gap-2">
                    <v-icon icon="mdi-tag" size="small" color="primary" />
                    <span class="font-weight-medium">{{ item.name }}</span>
                  </div>
                </template>

                <template #item.pickupLocation="{ item }">
                  <v-chip size="small" color="info" variant="tonal">
                    {{ item.pickupLocation?.location?.name || 'N/A' }}
                  </v-chip>
                </template>

                <template #item.target="{ item }">
                  <div v-if="item.vehicle">
                    <v-chip size="small" color="primary" variant="flat">
                      <v-icon start icon="mdi-car" size="small" />
                      {{ item.vehicle.name }}
                    </v-chip>
                  </div>
                  <div v-else-if="item.category">
                    <v-chip size="small" color="secondary" variant="flat">
                      <v-icon start icon="mdi-tag" size="small" />
                      {{ item.category.name }}
                    </v-chip>
                  </div>
                  <div v-else>
                    <v-chip size="small" color="grey" variant="tonal">
                      Tüm Araçlar
                    </v-chip>
                  </div>
                </template>

                <template #item.discount="{ item }">
                  <div class="d-flex align-center gap-2">
                    <v-chip
                      v-if="item.discountType === 'percentage'"
                      size="small"
                      color="success"
                      variant="flat"
                    >
                      %{{ item.discountPercent }}
                    </v-chip>
                    <v-chip
                      v-else-if="item.discountType === 'fixed'"
                      size="small"
                      color="success"
                      variant="flat"
                    >
                      {{ formatPrice(item.discountFixed) }} {{ currencyCode }}
                    </v-chip>
                  </div>
                </template>

                <template #item.dateRange="{ item }">
                  <div class="text-caption">
                    <div>{{ formatDate(item.startDate) }}</div>
                    <div class="text-grey">{{ formatDate(item.endDate) }}</div>
                  </div>
                </template>

                <template #item.minRentalDays="{ item }">
                  <v-chip
                    v-if="item.minRentalDays"
                    size="small"
                    color="warning"
                    variant="tonal"
                  >
                    Min {{ item.minRentalDays }} gün
                  </v-chip>
                  <span v-else class="text-grey text-caption">-</span>
                </template>

                <template #item.priority="{ item }">
                  <v-chip size="small" :color="getPriorityColor(item.priority)" variant="tonal">
                    {{ item.priority }}
                  </v-chip>
                </template>

                <template #item.isActive="{ item }">
                  <v-switch
                    :model-value="item.isActive"
                    color="success"
                    hide-details
                    density="compact"
                    @update:model-value="toggleActive(item.id, $event)"
                  />
                </template>

                <template #item.actions="{ item }">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    @click="editCampaign(item)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click="deleteCampaign(item.id)"
                  />
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title>
          {{ editingCampaign ? 'Kampanya Düzenle' : 'Yeni Kampanya Oluştur' }}
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="form.name"
              label="Kampanya Adı"
              required
              :rules="[v => !!v || 'Kampanya adı gereklidir']"
              class="mb-4"
            />

            <label class="form-label">Açıklama</label>
            <v-textarea
              v-model="form.description"
              placeholder="Açıklama giriniz"
              rows="3"
              class="mb-4"
            />

            <!-- Pickup Location (Required) -->
            <v-select
              v-model="form.pickupLocationId"
              :items="locations"
              item-title="name"
              item-value="id"
              label="Alış Lokasyonu *"
              required
              :rules="[v => !!v || 'Alış lokasyonu seçilmelidir']"
              prepend-icon="mdi-map-marker"
              class="mb-4"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon icon="mdi-map-marker" />
                  </template>
                  <v-list-item-title>{{ item.raw.location?.name || item.raw.name }}</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>

            <!-- Target: Vehicle OR Category -->
            <v-radio-group v-model="targetType" class="mb-4">
              <v-radio label="Belirli Araç" value="vehicle" />
              <v-radio label="Araç Kategorisi" value="category" />
              <v-radio label="Tüm Araçlar" value="all" />
            </v-radio-group>

            <v-select
              v-if="targetType === 'vehicle'"
              v-model="form.vehicleId"
              :items="vehicles"
              item-title="name"
              item-value="id"
              label="Araç Seç"
              prepend-icon="mdi-car"
              class="mb-4"
            />

            <v-select
              v-if="targetType === 'category'"
              v-model="form.categoryId"
              :items="categories"
              item-title="name"
              item-value="id"
              label="Kategori Seç"
              prepend-icon="mdi-tag"
              class="mb-4"
            />

            <!-- Min Rental Days -->
            <v-text-field
              v-model.number="form.minRentalDays"
              label="Minimum Kiralama Günü"
              type="number"
              min="0"
              hint="Boş bırakılırsa minimum gün şartı yoktur"
              prepend-icon="mdi-calendar-range"
              class="mb-4"
            />

            <!-- Discount Type -->
            <v-radio-group v-model="form.discountType" class="mb-4">
              <v-radio label="Yüzde İndirim" value="percentage" />
              <v-radio label="Sabit Tutar İndirim" value="fixed" />
            </v-radio-group>

            <v-text-field
              v-if="form.discountType === 'percentage'"
              v-model.number="form.discountPercent"
              label="İndirim Yüzdesi (%)"
              type="number"
              min="0"
              max="100"
              required
              :rules="[
                v => v !== null && v !== undefined || 'İndirim yüzdesi gereklidir',
                v => v >= 0 && v <= 100 || 'İndirim yüzdesi 0-100 arasında olmalıdır'
              ]"
              prepend-icon="mdi-percent"
              suffix="%"
              class="mb-4"
            />

            <v-text-field
              v-if="form.discountType === 'fixed'"
              v-model.number="form.discountFixed"
              label="İndirim Tutarı"
              type="number"
              min="0"
              required
              :rules="[
                v => v !== null && v !== undefined || 'İndirim tutarı gereklidir',
                v => v >= 0 || 'İndirim tutarı 0 veya pozitif olmalıdır'
              ]"
              prepend-icon="mdi-currency-try"
              class="mb-4"
            />

            <!-- Date Range -->
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.startDate"
                  label="Başlangıç Tarihi *"
                  type="date"
                  required
                  :rules="[v => !!v || 'Başlangıç tarihi gereklidir']"
                  prepend-icon="mdi-calendar-start"
                  class="mb-4"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.endDate"
                  label="Bitiş Tarihi *"
                  type="date"
                  required
                  :rules="[
                    v => !!v || 'Bitiş tarihi gereklidir',
                    v => !form.startDate || v >= form.startDate || 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
                  ]"
                  prepend-icon="mdi-calendar-end"
                  class="mb-4"
                />
              </v-col>
            </v-row>

            <!-- Priority -->
            <v-text-field
              v-model.number="form.priority"
              label="Öncelik"
              type="number"
              min="0"
              hint="Yüksek öncelikli kampanyalar çakışma durumunda önceliklidir"
              prepend-icon="mdi-star"
              class="mb-4"
            />

            <!-- Active Toggle -->
            <v-switch
              v-model="form.isActive"
              label="Aktif"
              color="success"
              class="mb-4"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn
            color="primary"
            @click="saveCampaign"
            :loading="saving"
            :disabled="!formValid"
          >
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { http } from '../services/api.service';
import { useAuthStore } from '../stores/auth';
import { useSnackbar } from '../composables/useSnackbar';

const auth = useAuthStore();
const { showSnackbar } = useSnackbar();

interface Campaign {
  id: string;
  name: string;
  description?: string;
  pickupLocationId: string;
  pickupLocation?: {
    id: string;
    location?: {
      name: string;
    };
  };
  vehicleId?: string | null;
  vehicle?: {
    id: string;
    name: string;
  } | null;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  minRentalDays?: number | null;
  discountType: 'percentage' | 'fixed';
  discountPercent?: number | null;
  discountFixed?: number | null;
  startDate: string;
  endDate: string;
  priority: number;
  isActive: boolean;
}

interface Location {
  id: string;
  name: string;
  location?: {
    name: string;
  };
}

interface Vehicle {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

const campaigns = ref<Campaign[]>([]);
const locations = ref<Location[]>([]);
const vehicles = ref<Vehicle[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const editingCampaign = ref<Campaign | null>(null);
const formRef = ref();
const formValid = ref(false);
const targetType = ref<'vehicle' | 'category' | 'all'>('all');
const currencyCode = ref('TRY');

const form = ref({
  name: '',
  description: '',
  pickupLocationId: '',
  vehicleId: null as string | null,
  categoryId: null as string | null,
  minRentalDays: null as number | null,
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountPercent: null as number | null,
  discountFixed: null as number | null,
  startDate: '',
  endDate: '',
  priority: 0,
  isActive: true,
});

const tableHeaders = [
  { title: 'Kampanya Adı', key: 'name', sortable: true },
  { title: 'Alış Lokasyonu', key: 'pickupLocation', sortable: false },
  { title: 'Hedef', key: 'target', sortable: false },
  { title: 'İndirim', key: 'discount', sortable: false },
  { title: 'Tarih Aralığı', key: 'dateRange', sortable: false },
  { title: 'Min Gün', key: 'minRentalDays', sortable: false },
  { title: 'Öncelik', key: 'priority', sortable: true },
  { title: 'Aktif', key: 'isActive', sortable: false },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const loadCampaigns = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const response = await http.get('/rentacar/campaigns');
    campaigns.value = response.data.data || [];
  } catch (error: any) {
    showSnackbar(error.response?.data?.message || 'Kampanyalar yüklenemedi', 'error');
  } finally {
    loading.value = false;
  }
};

const loadLocations = async () => {
  if (!auth.tenant) return;
  try {
    const response = await http.get('/rentacar/locations', {
      params: { tenantId: auth.tenant.id },
    });
    locations.value = response.data.data || [];
  } catch (error: any) {
    console.error('Locations yüklenemedi:', error);
  }
};

const loadVehicles = async () => {
  if (!auth.tenant) return;
  try {
    const response = await http.get('/rentacar/vehicles', {
      params: { tenantId: auth.tenant.id },
    });
    vehicles.value = response.data.data || [];
  } catch (error: any) {
    console.error('Vehicles yüklenemedi:', error);
  }
};

const loadCategories = async () => {
  if (!auth.tenant) return;
  try {
    const response = await http.get('/rentacar/categories', {
      params: { tenantId: auth.tenant.id },
    });
    categories.value = response.data.data || [];
  } catch (error: any) {
    console.error('Categories yüklenemedi:', error);
  }
};

const openCreateDialog = () => {
  editingCampaign.value = null;
  resetForm();
  showDialog.value = true;
};

const editCampaign = (campaign: Campaign) => {
  editingCampaign.value = campaign;
  form.value = {
    name: campaign.name,
    description: campaign.description || '',
    pickupLocationId: campaign.pickupLocationId,
    vehicleId: campaign.vehicleId || null,
    categoryId: campaign.categoryId || null,
    minRentalDays: campaign.minRentalDays || null,
    discountType: campaign.discountType,
    discountPercent: campaign.discountPercent || null,
    discountFixed: campaign.discountFixed || null,
    startDate: campaign.startDate.split('T')[0],
    endDate: campaign.endDate.split('T')[0],
    priority: campaign.priority,
    isActive: campaign.isActive,
  };

  // Determine target type
  if (campaign.vehicleId) {
    targetType.value = 'vehicle';
  } else if (campaign.categoryId) {
    targetType.value = 'category';
  } else {
    targetType.value = 'all';
  }

  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editingCampaign.value = null;
  resetForm();
};

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    pickupLocationId: '',
    vehicleId: null,
    categoryId: null,
    minRentalDays: null,
    discountType: 'percentage',
    discountPercent: null,
    discountFixed: null,
    startDate: '',
    endDate: '',
    priority: 0,
    isActive: true,
  };
  targetType.value = 'all';
};

const saveCampaign = async () => {
  const validated = await formRef.value?.validate();
  if (!validated?.valid) return;

  // Validation: vehicleId and categoryId cannot both be set
  if (targetType.value === 'vehicle' && !form.value.vehicleId) {
    showSnackbar('Araç seçilmelidir', 'error');
    return;
  }
  if (targetType.value === 'category' && !form.value.categoryId) {
    showSnackbar('Kategori seçilmelidir', 'error');
    return;
  }

  // Clear the other target if one is selected
  if (targetType.value === 'vehicle') {
    form.value.categoryId = null;
  } else if (targetType.value === 'category') {
    form.value.vehicleId = null;
  } else {
    form.value.vehicleId = null;
    form.value.categoryId = null;
  }

  saving.value = true;
  try {
    const payload = {
      ...form.value,
      vehicleId: form.value.vehicleId || null,
      categoryId: form.value.categoryId || null,
    };

    if (editingCampaign.value) {
      await http.put(`/rentacar/campaigns/${editingCampaign.value.id}`, payload);
      showSnackbar('Kampanya güncellendi', 'success');
    } else {
      await http.post('/rentacar/campaigns', payload);
      showSnackbar('Kampanya oluşturuldu', 'success');
    }

    closeDialog();
    await loadCampaigns();
  } catch (error: any) {
    showSnackbar(error.response?.data?.message || 'Kampanya kaydedilemedi', 'error');
  } finally {
    saving.value = false;
  }
};

const deleteCampaign = async (id: string) => {
  if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) {
    return;
  }

  try {
    await http.delete(`/rentacar/campaigns/${id}`);
    showSnackbar('Kampanya silindi', 'success');
    await loadCampaigns();
  } catch (error: any) {
    showSnackbar(error.response?.data?.message || 'Kampanya silinemedi', 'error');
  }
};

const toggleActive = async (id: string, isActive: boolean) => {
  try {
    await http.put(`/rentacar/campaigns/${id}`, { isActive });
    showSnackbar('Kampanya durumu güncellendi', 'success');
    await loadCampaigns();
  } catch (error: any) {
    showSnackbar(error.response?.data?.message || 'Kampanya durumu güncellenemedi', 'error');
    // Revert on error
    await loadCampaigns();
  }
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('tr-TR');
};

const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return '0';
  return Number(price).toFixed(2);
};

const getPriorityColor = (priority: number): string => {
  if (priority >= 10) return 'error';
  if (priority >= 5) return 'warning';
  return 'info';
};

onMounted(() => {
  loadCampaigns();
  loadLocations();
  loadVehicles();
  loadCategories();
});
</script>

<style scoped>
.campaigns-view {
  width: 100%;
}
</style>

