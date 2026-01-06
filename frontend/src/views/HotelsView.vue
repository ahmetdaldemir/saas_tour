<template>
  <div>
    <v-card elevation="2" class="pa-6 mb-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Oteller</h1>
          <p class="text-body-2 text-medium-emphasis">
            Destinasyonlara bagli global otel envanterinizi duzenleyin ve guncel tutun.
          </p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-hotel-plus" @click="openCreate">
          Yeni Otel
        </v-btn>
      </div>

      <v-data-table
        :headers="headers"
        :items="hotels"
        :loading="loading"
        item-key="id"
        density="comfortable"
        class="elevation-0"
      >
        <template #item.destination="{ item }">
          {{ item.destination?.name ?? '-' }}
        </template>
        <template #item.location="{ item }">
          <span>{{ item.city }}, {{ item.country }}</span>
        </template>
        <template #item.starRating="{ item }">
          <v-chip size="small" color="amber-darken-2" variant="tonal" prepend-icon="mdi-star">
            {{ item.starRating }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" @click="startEdit(item)" />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            color="error"
            :loading="removing === item.id"
            @click="removeHotel(item.id)"
          />
          <v-btn
            v-if="item.locationUrl"
            icon="mdi-open-in-new"
            variant="text"
            :href="item.locationUrl ?? undefined"
            target="_blank"
            rel="noopener"
          />
        </template>
        <template #no-data>
          <v-alert type="info" variant="tonal" class="ma-4">Henuz otel bulunmuyor.</v-alert>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="720" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">{{ dialogTitle }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>
        <v-card-text class="admin-form-scope">
          <v-alert v-if="formError" type="error" variant="tonal" class="mb-4">{{ formError }}</v-alert>
          <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubmit">
            <v-row>
              <v-col cols="12" md="6">
                <label class="form-label">Otel Adı <span class="required">*</span></label>
                <v-text-field 
                  v-model="form.name" 
                  placeholder="Otel adını giriniz"
                  hide-details="auto"
                  
                  density="comfortable"
                  required 
                />
              </v-col>
              <v-col cols="12" md="3">
                <label class="form-label">Yıldız Sayısı</label>
                <v-text-field
                  v-model.number="form.starRating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  placeholder="0-5"
                  hide-details="auto"
                  
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="3">
                <label class="form-label">Destinasyon <span class="required">*</span></label>
                <v-select
                  v-model="form.destinationId"
                  :items="destinationOptions"
                  item-value="id"
                  item-title="label"
                  placeholder="Seçiniz"
                  hide-details="auto"
                  
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12">
                <label class="form-label">Adres <span class="required">*</span></label>
                <v-text-field 
                  v-model="form.address" 
                  placeholder="Otel adresini giriniz"
                  hide-details="auto"
                  
                  density="comfortable"
                  required 
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Şehir <span class="required">*</span></label>
                <v-text-field 
                  v-model="form.city" 
                  placeholder="Şehir adını giriniz"
                  hide-details="auto"
                  
                  density="comfortable"
                  required 
                />
              </v-col>
              <v-col cols="12" md="6">
                <label class="form-label">Ülke <span class="required">*</span></label>
                <v-text-field 
                  v-model="form.country" 
                  placeholder="Ülke adını giriniz"
                  hide-details="auto"
                  
                  density="comfortable"
                  required 
                />
              </v-col>
              <v-col cols="12">
                <label class="form-label">Açıklama</label>
                <v-textarea 
                  v-model="form.description" 
                  rows="3" 
                  placeholder="Otel hakkında açıklama giriniz"
                  hide-details="auto"
                  
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <label class="form-label">Konum URL</label>
                <v-text-field 
                  v-model="form.locationUrl" 
                  placeholder="Google Maps veya benzeri konum URL'si"
                  hide-details="auto"
                  
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <div class="d-flex justify-end gap-3 mt-6">
              <v-btn variant="text" @click="closeDialog">İptal</v-btn>
              <v-btn color="primary" type="submit" :loading="submitting">
                {{ editingId ? 'Güncelle' : 'Kaydet' }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { http } from '../modules/http';

interface DestinationOption {
  id: string;
  label: string;
}

interface Hotel {
  id: string;
  name: string;
  starRating: number;
  address: string;
  city: string;
  country: string;
  description?: string | null;
  locationUrl?: string | null;
  destination?: { id: string; name: string } | null;
}

const headers = [
  { title: 'Otel', key: 'name' },
  { title: 'Destinasyon', key: 'destination', sortable: false },
  { title: 'Konum', key: 'location' },
  { title: 'Yildiz', key: 'starRating', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const destinations = ref<DestinationOption[]>([]);
const hotels = ref<Hotel[]>([]);
const loading = ref(false);
const submitting = ref(false);
const removing = ref<string | null>(null);
const formError = ref('');
const formRef = ref();
const isValid = ref(false);
const editingId = ref<string | null>(null);
const dialog = ref(false);

const form = reactive({
  name: '',
  starRating: 0,
  destinationId: '',
  address: '',
  city: '',
  country: '',
  description: '' as string | null,
  locationUrl: '' as string | null,
});

const dialogTitle = computed(() => (editingId.value ? 'Oteli duzenle' : 'Yeni otel'));
const destinationOptions = computed(() => destinations.value);

const loadDestinations = async () => {
  const { data } = await http.get<Array<{ id: string; name: string; city: string; country: string }>>('/destinations');
  destinations.value = data.map((dest) => ({
    id: dest.id,
    label: `${dest.name} (${dest.city}, ${dest.country})`,
  }));
};

const loadHotels = async () => {
  loading.value = true;
  try {
    const { data } = await http.get<Hotel[]>('/hotels');
    hotels.value = data;
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.name = '';
  form.starRating = 0;
  form.destinationId = '';
  form.address = '';
  form.city = '';
  form.country = '';
  form.description = '';
  form.locationUrl = '';
  editingId.value = null;
  formRef.value?.resetValidation();
};

const handleSubmit = async () => {
  const validation = await formRef.value?.validate();
  if (!validation?.valid) {
    return;
  }

  submitting.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await http.patch(`/hotels/${editingId.value}`, {
        name: form.name,
        starRating: form.starRating,
        destinationId: form.destinationId,
        address: form.address,
        city: form.city,
        country: form.country,
        description: form.description || null,
        locationUrl: form.locationUrl || null,
      });
    } else {
      await http.post('/hotels', {
        name: form.name,
        starRating: form.starRating,
        destinationId: form.destinationId,
        address: form.address,
        city: form.city,
        country: form.country,
        description: form.description || undefined,
        locationUrl: form.locationUrl || undefined,
      });
    }
    await loadHotels();
    closeDialog();
  } catch (err) {
    formError.value = (err as Error).message ?? 'Islem basarisiz';
  } finally {
    submitting.value = false;
  }
};

const removeHotel = async (id: string) => {
  removing.value = id;
  try {
    await http.delete(`/hotels/${id}`);
    await loadHotels();
    if (editingId.value === id) {
      resetForm();
    }
  } finally {
    removing.value = null;
  }
};

const openCreate = () => {
  resetForm();
  formError.value = '';
  dialog.value = true;
};

const startEdit = (hotel: Hotel) => {
  editingId.value = hotel.id;
  form.name = hotel.name;
  form.starRating = hotel.starRating;
  form.destinationId = hotel.destination?.id ?? '';
  form.address = hotel.address;
  form.city = hotel.city;
  form.country = hotel.country;
  form.description = hotel.description ?? '';
  form.locationUrl = hotel.locationUrl ?? '';
  formError.value = '';
  dialog.value = true;
  formRef.value?.resetValidation();
};

const closeDialog = () => {
  dialog.value = false;
  resetForm();
  formError.value = '';
};

onMounted(async () => {
  await Promise.all([loadDestinations(), loadHotels()]);
});
</script>
