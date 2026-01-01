<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Kategoriler</span>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Yeni Kategori</v-btn>
      </v-card-title>
      <v-card-text>
        <!-- Filtreler -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedType"
              :items="typeOptions"
              label="Tip"
              clearable
              density="compact"
              @update:model-value="loadCategories"
            />
          </v-col>
        </v-row>

        <!-- Kategoriler Listesi -->
        <v-data-table
          :headers="headers"
          :items="categories"
          :loading="loading"
          item-value="id"
          class="elevation-0"
        >
          <template v-slot:item.type="{ item }">
            <v-chip :color="item.type === 'INCOME' ? 'success' : 'error'" size="small">
              {{ item.type === 'INCOME' ? 'Gelir' : 'Gider' }}
            </v-chip>
          </template>
          <template v-slot:item.color="{ item }">
            <v-chip
              :color="item.color || 'grey'"
              size="small"
              variant="flat"
              v-if="item.color"
            >
              <span style="color: white;">{{ item.color }}</span>
            </v-chip>
          </template>
          <template v-slot:item.isActive="{ item }">
            <v-chip :color="item.isActive ? 'success' : 'default'" size="small">
              {{ item.isActive ? 'Aktif' : 'Pasif' }}
            </v-chip>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon="mdi-pencil" variant="text" size="small" @click="editCategory(item)" />
            <v-btn icon="mdi-delete" variant="text" size="small" @click="deleteCategory(item)" />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Kategori Dialog -->
    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.type"
                  :items="typeOptions"
                  label="Tip *"
                  required
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.name"
                  label="Ad *"
                  required
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="form.parentId"
                  :items="parentCategoryOptions"
                  item-title="name"
                  item-value="id"
                  label="Üst Kategori"
                  clearable
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.color"
                  type="color"
                  label="Renk"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.sort"
                  type="number"
                  label="Sıra"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="form.isActive"
                  label="Aktif"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveCategory">Kaydet</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { http } from '../../modules/http';
import { useSnackbar } from '../../composables/useSnackbar';

const { showSuccess, showError } = useSnackbar();

const categories = ref<any[]>([]);
const loading = ref(false);
const dialog = ref(false);
const editingCategory = ref<any>(null);
const selectedType = ref<string | null>(null);
const formRef = ref();

const form = ref({
  type: 'INCOME',
  name: '',
  parentId: null as string | null,
  color: null as string | null,
  sort: 0,
  isActive: true,
});

const headers = [
  { title: 'Ad', key: 'name' },
  { title: 'Tip', key: 'type' },
  { title: 'Üst Kategori', key: 'parent.name' },
  { title: 'Renk', key: 'color' },
  { title: 'Sıra', key: 'sort' },
  { title: 'Durum', key: 'isActive' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const typeOptions = [
  { title: 'Gelir', value: 'INCOME' },
  { title: 'Gider', value: 'EXPENSE' },
];

const parentCategoryOptions = computed(() => {
  return categories.value
    .filter(c => c.type === form.value.type && c.id !== editingCategory.value?.id)
    .map(c => ({ id: c.id, name: c.name }));
});

const loadCategories = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (selectedType.value) params.type = selectedType.value;
    const { data } = await http.get('/finance/categories', { params });
    categories.value = data;
  } catch (error: any) {
    showError(error.response?.data?.message || 'Kategoriler yüklenemedi');
  } finally {
    loading.value = false;
  }
};

const openDialog = (category?: any) => {
  editingCategory.value = category || null;
  if (category) {
    form.value = {
      type: category.type,
      name: category.name,
      parentId: category.parentId,
      color: category.color,
      sort: category.sort,
      isActive: category.isActive,
    };
  } else {
    form.value = {
      type: 'INCOME',
      name: '',
      parentId: null,
      color: null,
      sort: 0,
      isActive: true,
    };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editingCategory.value = null;
};

const saveCategory = async () => {
  try {
    const payload = { ...form.value };
    if (!payload.color) payload.color = null;

    if (editingCategory.value) {
      await http.patch(`/finance/categories/${editingCategory.value.id}`, payload);
      showSuccess('Kategori güncellendi');
    } else {
      await http.post('/finance/categories', payload);
      showSuccess('Kategori eklendi');
    }

    closeDialog();
    loadCategories();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Kategori kaydedilemedi');
  }
};

const editCategory = (category: any) => {
  openDialog(category);
};

const deleteCategory = async (category: any) => {
  if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

  try {
    await http.delete(`/finance/categories/${category.id}`);
    showSuccess('Kategori silindi');
    loadCategories();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Kategori silinemedi');
  }
};

onMounted(() => {
  loadCategories();
});
</script>
