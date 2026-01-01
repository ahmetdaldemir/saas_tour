<template>
  <div>
    <v-card class="mb-4">
      <v-card-title>Tarih Aralığı</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="localDateRange.from"
              type="date"
              label="Başlangıç"
              density="compact"
              @update:model-value="onDateRangeChange"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="localDateRange.to"
              type="date"
              label="Bitiş"
              density="compact"
              @update:model-value="onDateRangeChange"
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center gap-2">
            <v-btn @click="setThisMonth">Bu Ay</v-btn>
            <v-btn @click="setLastMonth">Geçen Ay</v-btn>
            <v-btn @click="setLast30Days">Son 30 Gün</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card>
      <v-card-title>Gelir/Gider Grafiği</v-card-title>
      <v-card-text>
        <div class="text-center text-medium-emphasis py-8">
          Grafik özelliği yakında eklenecek
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  summary: any;
  dateRange: { from: string | null; to: string | null };
}>();

const emit = defineEmits<{
  (e: 'update-date-range', range: { from: string | null; to: string | null }): void;
  (e: 'refresh'): void;
}>();

const localDateRange = ref({ ...props.dateRange });

const onDateRangeChange = () => {
  emit('update-date-range', localDateRange.value);
  emit('refresh');
};

const setThisMonth = () => {
  const now = new Date();
  localDateRange.value.from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  localDateRange.value.to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  onDateRangeChange();
};

const setLastMonth = () => {
  const now = new Date();
  localDateRange.value.from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  localDateRange.value.to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
  onDateRangeChange();
};

const setLast30Days = () => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  localDateRange.value.from = from.toISOString().split('T')[0];
  localDateRange.value.to = now.toISOString().split('T')[0];
  onDateRangeChange();
};

watch(() => props.dateRange, (newVal) => {
  localDateRange.value = { ...newVal };
}, { deep: true });
</script>

