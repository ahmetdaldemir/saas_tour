<template>
  <div class="master-locations-view">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-map-marker" size="28" />
          <span class="text-h5">Master Lokasyonlar</span>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          Yeni Lokasyon Ekle
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="locations"
          :loading="loading"
          item-key="id"
          :items-per-page="50"
          class="elevation-1"
        >
          <template #item.name="{ item }">
            <div class="d-flex align-center gap-2">
              <v-icon
                :icon="getLocationIcon(item.type)"
                :color="getLocationColor(item.type)"
                size="20"
              />
              <span :style="{ paddingLeft: item.parentId ? '24px' : '0' }">
                {{ item.name }}
                <span v-if="item.parentId" class="text-caption text-grey ml-2">
                  (Alt lokasyon)
                </span>
              </span>
            </div>
          </template>

          <template #item.type="{ item }">
            <v-chip
              :color="getLocationColor(item.type)"
              size="small"
              variant="tonal"
            >
              {{ getLocationTypeLabel(item.type) }}
            </v-chip>
          </template>

          <template #item.parent="{ item }">
            <span>{{ item.parent?.name || '-' }}</span>
          </template>

          <template #item.children="{ item }">
            <v-chip
              v-if="item.children && item.children.length > 0"
              size="small"
              color="info"
              variant="tonal"
            >
              {{ item.children.length }} alt lokasyon
            </v-chip>
            <span v-else class="text-grey">-</span>
          </template>

          <template #item.createdAt="{ item }">
            {{ new Date(item.createdAt).toLocaleDateString('tr-TR') }}
          </template>

          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="primary"
              @click="editLocation(item)"
            />
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              :loading="deletingLocation === item.id"
              @click="deleteLocation(item.id)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">
            {{ editingLocation ? 'Lokasyon Düzenle' : 'Yeni Lokasyon Ekle' }}
          </span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6 admin-form-scope">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <label class="form-label">Lokasyon Adı <span class="required">*</span></label>
                <v-text-field
                  v-model="form.name"
                  placeholder="Lokasyon adını giriniz"
                  hide-details="auto"
                  :rules="[rules.required]"
                  
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12">
                <label class="form-label">Lokasyon Tipi <span class="required">*</span></label>
                <v-select
                  v-model="form.type"
                  :items="locationTypeOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Tip seçiniz"
                  hide-details="auto"
                  :rules="[rules.required]"
                  
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12">
                <label class="form-label">Üst Lokasyon (Opsiyonel)</label>
                <v-select
                  v-model="form.parentId"
                  :items="parentLocationOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Üst lokasyon seçiniz"
                  hide-details="auto"
                  clearable
                  
                  density="comfortable"
                  :disabled="!!editingLocation"
                >
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template #title>
                        <span :style="{ paddingLeft: item.raw.parentId ? '20px' : '0' }">
                          {{ item.raw.label }}
                        </span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
                <v-alert
                  v-if="editingLocation"
                  type="info"
                  density="compact"
                  class="mt-2"
                >
                  Üst lokasyon düzenleme sırasında değiştirilemez.
                </v-alert>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="saveLocation"
          >
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { http } from '../modules/http';

interface MasterLocation {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: MasterLocation | null;
  type: 'merkez' | 'otel' | 'havalimani' | 'adres';
  createdAt: string;
  updatedAt: string;
  children?: MasterLocation[];
}

const loading = ref(false);
const saving = ref(false);
const deletingLocation = ref<string | null>(null);
const locations = ref<MasterLocation[]>([]);
const showDialog = ref(false);
const editingLocation = ref<MasterLocation | null>(null);
const formRef = ref();
const formValid = ref(false);

const form = ref({
  name: '',
  type: 'merkez' as 'merkez' | 'otel' | 'havalimani' | 'adres',
  parentId: null as string | null | undefined,
});

const headers = [
  { title: 'Lokasyon Adı', key: 'name', sortable: true },
  { title: 'Tip', key: 'type', sortable: true },
  { title: 'Üst Lokasyon', key: 'parent', sortable: false },
  { title: 'Alt Lokasyonlar', key: 'children', sortable: false },
  { title: 'Oluşturulma', key: 'createdAt', sortable: true },
  { title: 'İşlemler', key: 'actions', sortable: false, align: 'end' },
];

const locationTypeOptions = [
  { label: 'Merkez', value: 'merkez' },
  { label: 'Otel', value: 'otel' },
  { label: 'Havalimanı', value: 'havalimani' },
  { label: 'Adres', value: 'adres' },
];

const rules = {
  required: (v: any) => !!v || 'Bu alan zorunludur',
};

// Flatten locations for dropdown
const flattenLocations = (locs: MasterLocation[], excludeId?: string): Array<{ value: string | null; label: string; parentId?: string | null }> => {
  const result: Array<{ value: string | null; label: string; parentId?: string | null }> = [];
  
  locs.forEach(loc => {
    // Exclude current location if editing
    if (excludeId && loc.id === excludeId) {
      return;
    }
    
    const label = loc.parentId ? `  ${loc.name}` : loc.name;
    result.push({
      value: loc.id,
      label,
      parentId: loc.parentId,
    });
    
    if (loc.children && loc.children.length > 0) {
      const childItems = flattenLocations(loc.children, excludeId);
      result.push(...childItems);
    }
  });
  
  return result;
};

const parentLocationOptions = computed(() => {
  const flat = flattenLocations(locations.value, editingLocation.value?.id);
  return [
    { value: null, label: 'Üst lokasyon yok (Ana lokasyon)' },
    ...flat,
  ];
});

const getLocationTypeLabel = (type: string) => {
  const option = locationTypeOptions.find(opt => opt.value === type);
  return option?.label || type;
};

const getLocationIcon = (type: string) => {
  switch (type) {
    case 'merkez':
      return 'mdi-map-marker';
    case 'havalimani':
      return 'mdi-airplane';
    case 'otel':
      return 'mdi-bed';
    case 'adres':
      return 'mdi-map-marker-outline';
    default:
      return 'mdi-map-marker';
  }
};

const getLocationColor = (type: string) => {
  switch (type) {
    case 'merkez':
      return 'primary';
    case 'havalimani':
      return 'info';
    case 'otel':
      return 'success';
    case 'adres':
      return 'warning';
    default:
      return 'grey';
  }
};

const loadLocations = async () => {
  loading.value = true;
  try {
    const { data } = await http.get<MasterLocation[]>('/master-locations');
    locations.value = data;
  } catch (error) {
    console.error('Failed to load master locations:', error);
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  editingLocation.value = null;
  form.value = {
    name: '',
    type: 'merkez',
    parentId: null,
  };
  showDialog.value = true;
};

const editLocation = (location: MasterLocation) => {
  editingLocation.value = location;
  form.value = {
    name: location.name,
    type: location.type,
    parentId: location.parentId || null,
  };
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editingLocation.value = null;
  form.value = {
    name: '',
    type: 'merkez',
    parentId: null,
  };
  formRef.value?.resetValidation();
};

const saveLocation = async () => {
  const validated = await formRef.value?.validate();
  if (!validated?.valid) return;

  saving.value = true;
  try {
    const locationData = {
      name: form.value.name.trim(),
      type: form.value.type,
      parentId: form.value.parentId || null,
    };

    if (editingLocation.value) {
      await http.put(`/master-locations/${editingLocation.value.id}`, locationData);
    } else {
      await http.post('/master-locations', locationData);
    }

    await loadLocations();
    closeDialog();
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lokasyon kaydedilirken bir hata oluştu';
    alert(errorMessage);
    console.error('Failed to save master location:', error);
  } finally {
    saving.value = false;
  }
};

const deleteLocation = async (id: string) => {
  if (!confirm('Bu master lokasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
    return;
  }

  deletingLocation.value = id;
  try {
    await http.delete(`/master-locations/${id}`);
    await loadLocations();
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lokasyon silinirken bir hata oluştu';
    alert(errorMessage);
    console.error('Failed to delete master location:', error);
  } finally {
    deletingLocation.value = null;
  }
};

onMounted(() => {
  loadLocations();
});
</script>

<style scoped>
.master-locations-view {
  padding: 24px;
}
</style>

