<template>
  <div>
    <v-row>
      <v-col cols="12" md="5">
        <v-card elevation="2" class="pa-6 mb-4">
          <h2 class="text-h6 font-weight-bold mb-4">Yeni Dil Ekle</h2>
          <v-form @submit.prevent="handleCreate" ref="formRef" v-model="isValid">
            <v-text-field v-model="form.code" label="Dil Kodu" placeholder="en" prepend-inner-icon="mdi-translate" required />
            <v-text-field v-model="form.name" label="Dil Adi" prepend-inner-icon="mdi-alphabetical" required />
            <v-switch v-model="form.isActive" color="primary" label="Aktif" inset />
            <v-btn color="primary" class="mt-4" :loading="creating" type="submit">Kaydet</v-btn>
          </v-form>
          <v-alert v-if="error" type="error" variant="tonal" class="mt-4">{{ error }}</v-alert>
        </v-card>
      </v-col>
      <v-col cols="12" md="7">
        <v-card elevation="2" class="pa-6 mb-4">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">Diller</h2>
            <v-btn icon="mdi-refresh" variant="text" @click="loadLanguages" :loading="loading" />
          </div>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Adi</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="language in languages" :key="language.id">
                <td>{{ language.code }}</td>
                <td>{{ language.name }}</td>
                <td>
                  <v-chip :color="language.isActive ? 'success' : 'warning'" size="small" variant="tonal">
                    {{ language.isActive ? 'Aktif' : 'Pasif' }}
                  </v-chip>
                </td>
                <td class="text-right">
                  <v-btn size="small" variant="text" :loading="toggling === language.id" @click="toggleActive(language)">
                    {{ language.isActive ? 'Pasif Yap' : 'Aktif Yap' }}
                  </v-btn>
                  <v-btn size="small" variant="text" color="error" :loading="removing === language.id" @click="removeLanguage(language.id)">
                    Sil
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-if="!languages.length && !loading" type="info" variant="tonal">Henuz dil bulunmuyor.</v-alert>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { http } from '../modules/http';

interface Language {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

const languages = ref<Language[]>([]);
const loading = ref(false);
const creating = ref(false);
const toggling = ref<string | null>(null);
const removing = ref<string | null>(null);
const error = ref('');
const formRef = ref();
const isValid = ref(false);

const form = reactive({
  code: '',
  name: '',
  isActive: true,
});

const loadLanguages = async () => {
  loading.value = true;
  try {
    const { data } = await http.get<Language[]>('/languages');
    languages.value = data;
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.code = '';
  form.name = '';
  form.isActive = true;
};

const handleCreate = async () => {
  const result = await formRef.value?.validate();
  if (!result?.valid) {
    return;
  }

  creating.value = true;
  error.value = '';
  try {
    await http.post('/languages', form);
    resetForm();
    await loadLanguages();
  } catch (err) {
    error.value = (err as Error).message ?? 'Kayit yapilamadi';
  } finally {
    creating.value = false;
  }
};

const toggleActive = async (language: Language) => {
  toggling.value = language.id;
  try {
    await http.patch(`/languages/${language.id}`, { isActive: !language.isActive });
    await loadLanguages();
  } finally {
    toggling.value = null;
  }
};

const removeLanguage = async (id: string) => {
  removing.value = id;
  try {
    await http.delete(`/languages/${id}`);
    await loadLanguages();
  } finally {
    removing.value = null;
  }
};

onMounted(() => {
  loadLanguages();
});
</script>
