<template>
  <div>
    <v-alert type="warning" variant="tonal" class="mb-4" v-if="!isTourTenant">
      Bu modül yalnızca tur operatörü tenantlar için aktiftir.
    </v-alert>

    <v-row v-if="isTourTenant" dense>
      <v-col cols="12" md="6">
        <v-card elevation="2" class="pa-6 mb-4">
          <h2 class="text-h6 font-weight-bold mb-4">Tur Oluştur</h2>
          <v-form @submit.prevent="handleCreate" ref="formRef" v-model="isValid">
            <v-text-field v-model="form.destinationId" label="Destination ID" prepend-inner-icon="mdi-map-marker" required />
            <v-text-field v-model="form.title" label="Tur Başlığı" prepend-inner-icon="mdi-airballoon" required />
            <v-text-field v-model="form.slug" label="Slug" prepend-inner-icon="mdi-link-variant" required />
            <v-text-field v-model.number="form.basePrice" label="Baz Fiyat" type="number" prepend-inner-icon="mdi-currency-eur" />

            <v-btn type="submit" color="primary" class="mt-4" :loading="loading">
              Tur Oluştur
            </v-btn>
          </v-form>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="2" class="pa-6 mb-4">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">Turlar</h2>
            <v-btn icon="mdi-refresh" variant="text" @click="loadTours" />
          </div>

          <v-list lines="two" v-if="tours.length">
            <v-list-item
              v-for="tour in tours"
              :key="tour.id"
              :title="tour.title"
              :subtitle="`${tour.slug} - ${tour.basePrice} ${tour.currencyCode}`"
              prepend-icon="mdi-compass"
            />
          </v-list>
          <v-alert v-else type="info" variant="tonal">Henüz tur kaydı bulunmuyor.</v-alert>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';

interface TourDto {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  currencyCode: string;
}

const auth = useAuthStore();
const isTourTenant = computed(() => auth.tenant?.category === 'tour');

const form = reactive({
  destinationId: '',
  title: '',
  slug: '',
  basePrice: 0,
});

const tours = ref<TourDto[]>([]);
const loading = ref(false);
const formRef = ref();
const isValid = ref(false);

const loadTours = async () => {
  if (!auth.tenant) return;
  const { data } = await http.get<TourDto[]>('/tours', { params: { tenantId: auth.tenant.id } });
  tours.value = data;
};

const handleCreate = async () => {
  if (!auth.tenant) return;
  const validation = await formRef.value?.validate();
  if (!validation?.valid) return;

  loading.value = true;
  try {
    await http.post('/tours', {
      tenantId: auth.tenant.id,
      destinationId: form.destinationId,
      title: form.title,
      slug: form.slug,
      basePrice: form.basePrice,
    });
    await loadTours();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (isTourTenant.value) {
    loadTours();
  }
});
</script>
