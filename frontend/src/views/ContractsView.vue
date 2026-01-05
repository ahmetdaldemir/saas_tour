<template>
  <div class="contracts-view">
    <v-container fluid>
      <v-row>
        <!-- Şablon Yönetimi -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span>Sözleşme Şablonları</span>
              <v-btn
                color="primary"
                icon="mdi-plus"
                size="small"
                @click="openTemplateDialog"
              />
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list v-if="templates.length > 0" density="compact">
                <v-list-item
                  v-for="template in templates"
                  :key="template.id"
                  :title="template.name"
                  :subtitle="template.description || 'Açıklama yok'"
                  :active="selectedTemplateId === template.id"
                  @click="selectTemplate(template.id)"
                >
                  <template #prepend>
                    <v-icon :icon="template.isDefault ? 'mdi-star' : 'mdi-file-document'" :color="template.isDefault ? 'primary' : 'grey'" />
                  </template>
                  <template #append>
                    <v-menu>
                      <template #activator="{ props }">
                        <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" @click.stop />
                      </template>
                      <v-list>
                        <v-list-item @click="editTemplate(template)">
                          <v-list-item-title>Düzenle</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="setDefaultTemplate(template.id)" v-if="!template.isDefault">
                          <v-list-item-title>Varsayılan Yap</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="deleteTemplate(template.id)" class="text-error">
                          <v-list-item-title>Sil</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert v-else type="info" variant="tonal">
                Henüz şablon oluşturulmamış. İlk şablonunuzu oluşturun.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Sözleşme Oluşturucu -->
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span>Sözleşme Oluşturucu</span>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openNewContractDialog"
              >
                Yeni Sözleşme
              </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <ContractBuilder
                v-if="showBuilder"
                :reservation-id="selectedReservationId"
                :vehicle-id="selectedVehicleId"
                :template-id="selectedTemplateId"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Şablon Ekleme/Düzenleme Dialog -->
    <v-dialog v-model="showTemplateDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title>
          {{ editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon Oluştur' }}
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="templateFormRef">
            <v-text-field
              v-model="templateForm.name"
              label="Şablon Adı"
              required
              class="mb-4"
            />
            <v-textarea
              v-model="templateForm.description"
              label="Açıklama"
              rows="3"
              class="mb-4"
            />
            <v-alert type="info" variant="tonal" class="mb-4">
              Şablon içeriğini oluşturduktan sonra düzenleme sayfasından detaylı olarak yapılandırabilirsiniz.
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeTemplateDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveTemplate" :loading="savingTemplate">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { http } from '../services/api.service';
import { useSnackbar } from '../composables/useSnackbar';
import ContractBuilder from '../components/ContractBuilder.vue';

const route = useRoute();
const { showSnackbar } = useSnackbar();

const showBuilder = ref(true);
const selectedReservationId = ref<string | undefined>(route.query.reservationId as string | undefined);
const selectedVehicleId = ref<string | undefined>(route.query.vehicleId as string | undefined);
const selectedTemplateId = ref<string | undefined>(undefined);

const templates = ref<any[]>([]);
const showTemplateDialog = ref(false);
const editingTemplate = ref<any | null>(null);
const savingTemplate = ref(false);
const templateFormRef = ref();
const templateForm = ref({
  name: '',
  description: '',
});

const loadTemplates = async () => {
  try {
    const response = await http.get('/rentacar/contracts/templates');
    templates.value = response.data.data || [];
    // Varsayılan şablonu seç
    const defaultTemplate = templates.value.find(t => t.isDefault);
    if (defaultTemplate) {
      selectedTemplateId.value = defaultTemplate.id;
    } else if (templates.value.length > 0) {
      selectedTemplateId.value = templates.value[0].id;
    }
  } catch (error) {
    console.error('Şablonlar yüklenemedi:', error);
  }
};

const selectTemplate = (templateId: string) => {
  selectedTemplateId.value = templateId;
};

const openTemplateDialog = () => {
  editingTemplate.value = null;
  templateForm.value = { name: '', description: '' };
  showTemplateDialog.value = true;
};

const editTemplate = (template: any) => {
  editingTemplate.value = template;
  templateForm.value = {
    name: template.name,
    description: template.description || '',
  };
  showTemplateDialog.value = true;
};

const closeTemplateDialog = () => {
  showTemplateDialog.value = false;
  editingTemplate.value = null;
  templateForm.value = { name: '', description: '' };
};

const saveTemplate = async () => {
  if (!templateForm.value.name.trim()) {
    showSnackbar('Şablon adı gereklidir', 'error');
    return;
  }

  savingTemplate.value = true;
  try {
    if (editingTemplate.value) {
      await http.put(`/rentacar/contracts/templates/${editingTemplate.value.id}`, templateForm.value);
      showSnackbar('Şablon güncellendi', 'success');
    } else {
      await http.post('/rentacar/contracts/templates', templateForm.value);
      showSnackbar('Şablon oluşturuldu', 'success');
    }
    closeTemplateDialog();
    await loadTemplates();
  } catch (error: any) {
    showSnackbar(error.response?.data?.message || 'Bir hata oluştu', 'error');
  } finally {
    savingTemplate.value = false;
  }
};

const setDefaultTemplate = async (templateId: string) => {
  try {
    await http.post(`/rentacar/contracts/templates/${templateId}/set-default`);
    showSnackbar('Varsayılan şablon güncellendi', 'success');
    await loadTemplates();
  } catch (error: any) {
    showSnackbar(error.response?.data?.message || 'Bir hata oluştu', 'error');
  }
};

const deleteTemplate = async (templateId: string) => {
  if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
    return;
  }

  try {
    await http.delete(`/rentacar/contracts/templates/${templateId}`);
    showSnackbar('Şablon silindi', 'success');
    await loadTemplates();
  } catch (error: any) {
    showSnackbar(error.response?.data?.message || 'Bir hata oluştu', 'error');
  }
};

const openNewContractDialog = () => {
  selectedReservationId.value = undefined;
  selectedVehicleId.value = undefined;
  showBuilder.value = false;
  setTimeout(() => {
    showBuilder.value = true;
  }, 100);
};

onMounted(() => {
  loadTemplates();
});
</script>

<style scoped>
.contracts-view {
  width: 100%;
  height: 100%;
}
</style>

