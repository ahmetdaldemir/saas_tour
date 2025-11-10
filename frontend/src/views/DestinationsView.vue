<template>
  <div>
    <v-card elevation="2" class="pa-6 mb-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Destinasyonlar</h1>
          <p class="text-body-2 text-medium-emphasis">
            Global turizm bolgelerini yonetin ve vitrine cikarmak istediklerinizi belirleyin.
          </p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-map-plus" @click="openCreate">
          Yeni Destinasyon
        </v-btn>
      </div>

      <v-data-table
        :headers="headers"
        :items="destinations"
        :loading="loading"
        item-key="id"
        density="comfortable"
        class="elevation-0"
      >
        <template #item.city="{ item }">
          <span class="font-weight-medium">{{ item.city }}</span>
        </template>
        <template #item.country="{ item }">
          <span>{{ item.country }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" @click="startEdit(item)" />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            color="error"
            :loading="removing === item.id"
            @click="removeDestination(item.id)"
          />
        </template>
        <template #no-data>
          <v-alert type="info" variant="tonal" class="ma-4">Henuz destinasyon bulunmuyor.</v-alert>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="540" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h6">{{ dialogTitle }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" variant="tonal" class="mb-4">{{ formError }}</v-alert>
          <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubmit">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="form.name" label="Ad" prepend-inner-icon="mdi-map-marker" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.country" label="Ulke" prepend-inner-icon="mdi-earth" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.city" label="Sehir" prepend-inner-icon="mdi-city" required />
              </v-col>
            </v-row>

            <div class="d-flex justify-end gap-3 mt-6">
              <v-btn variant="text" @click="closeDialog">Iptal</v-btn>
              <v-btn color="primary" type="submit" :loading="submitting">
                {{ editingId ? 'Guncelle' : 'Kaydet' }}
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

interface Destination {
  id: string;
  name: string;
  country: string;
  city: string;
}

const headers = [
  { title: 'Ad', key: 'name' },
  { title: 'Sehir', key: 'city' },
  { title: 'Ulke', key: 'country' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const destinations = ref<Destination[]>([]);
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
  country: '',
  city: '',
});

const dialogTitle = computed(() => (editingId.value ? 'Destinasyonu duzenle' : 'Yeni destinasyon'));

const loadDestinations = async () => {
  loading.value = true;
  try {
    const { data } = await http.get<Destination[]>('/destinations');
    destinations.value = data;
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.name = '';
  form.country = '';
  form.city = '';
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
      await http.patch(`/destinations/${editingId.value}`, {
        name: form.name,
        country: form.country,
        city: form.city,
      });
    } else {
      await http.post('/destinations', {
        name: form.name,
        country: form.country,
        city: form.city,
      });
    }
    await loadDestinations();
    closeDialog();
  } catch (err) {
    formError.value = (err as Error).message ?? 'Islem basarisiz';
  } finally {
    submitting.value = false;
  }
};

const removeDestination = async (id: string) => {
  removing.value = id;
  try {
    await http.delete(`/destinations/${id}`);
    await loadDestinations();
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

const startEdit = (destination: Destination) => {
  editingId.value = destination.id;
  form.name = destination.name;
  form.country = destination.country;
  form.city = destination.city;
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
  await loadDestinations();
});
</script>
