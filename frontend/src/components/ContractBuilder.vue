<template>
  <div class="contract-builder">
    <v-alert
      type="info"
      variant="tonal"
      class="mb-4"
      prominent
    >
      <v-alert-title>Canlı Sözleşme Oluşturucu</v-alert-title>
      <div class="text-body-2 mt-2">
        Sözleşme içeriği girdilerinize göre canlı olarak güncellenir. Yasal çekirdek bölümler kilitlidir ve düzenlenemez.
      </div>
    </v-alert>

    <v-row>
      <!-- Left Panel: Form -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Sözleşme Bilgileri</v-card-title>
          <v-divider />
          <v-card-text>
            <v-form ref="formRef">
              <!-- Template Selection -->
              <v-select
                v-model="selectedTemplateId"
                :items="templates"
                item-title="name"
                item-value="id"
                label="Şablon Seç"
                prepend-icon="mdi-file-document"
                class="mb-4"
                @update:model-value="loadTemplate"
              />

              <!-- Variables -->
              <div v-if="templateVariables.length > 0" class="mb-4">
                <div class="text-subtitle-2 mb-2">Değişkenler</div>
                <v-text-field
                  v-for="variable in templateVariables"
                  :key="variable.key"
                  v-model="contractVariables[variable.key]"
                  :label="variable.label"
                  :required="variable.required"
                  density="compact"
                  class="mb-2"
                  @update:model-value="updatePreview"
                />
              </div>

              <!-- Customer Info -->
              <v-divider class="my-4" />
              <div class="text-subtitle-2 mb-2">Müşteri Bilgileri</div>
              <v-text-field
                v-model="contractData.customerName"
                label="Müşteri Adı"
                required
                density="compact"
                class="mb-2"
                @update:model-value="updatePreview"
              />
              <v-text-field
                v-model="contractData.customerEmail"
                label="E-posta"
                type="email"
                density="compact"
                class="mb-2"
                @update:model-value="updatePreview"
              />
              <v-text-field
                v-model="contractData.customerPhone"
                label="Telefon"
                density="compact"
                class="mb-2"
                @update:model-value="updatePreview"
              />
              <v-text-field
                v-model="contractData.customerIdNumber"
                label="TC/Passaport No"
                density="compact"
                class="mb-2"
                @update:model-value="updatePreview"
              />

              <!-- Optional Blocks -->
              <v-divider class="my-4" />
              <div v-if="optionalBlocks.length > 0" class="mb-4">
                <div class="text-subtitle-2 mb-2">Opsiyonel Bölümler</div>
                <v-checkbox
                  v-for="block in optionalBlocks"
                  :key="block.id"
                  v-model="block.isEnabled"
                  :label="block.title"
                  density="compact"
                  @update:model-value="updatePreview"
                />
              </div>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              :loading="saving"
              :disabled="!canSave"
              @click="saveContract"
            >
              Kaydet
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Signature Section (if contract exists) -->
        <v-card v-if="contractId && contractStatus === 'draft'" class="mb-4">
          <v-card-title>İmza</v-card-title>
          <v-divider />
          <v-card-text>
            <v-text-field
              v-model="signatureData.customerName"
              label="Müşteri Adı"
              required
              density="compact"
              class="mb-2"
            />
            <v-textarea
              v-model="signatureData.signatureImage"
              label="İmza (Base64 veya URL)"
              rows="3"
              density="compact"
              class="mb-2"
            />
            <v-btn
              color="success"
              block
              :loading="signing"
              @click="signContract"
            >
              Sözleşmeyi İmzala
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Panel: Live Preview -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Canlı Önizleme</span>
            <div class="d-flex gap-2">
              <v-btn
                icon="mdi-printer"
                variant="text"
                @click="printContract"
                :disabled="!previewHtml"
              />
              <v-btn
                icon="mdi-download"
                variant="text"
                @click="downloadPDF"
                :loading="generatingPDF"
                :disabled="!contractId"
              />
              <v-btn
                icon="mdi-printer-thermal"
                variant="text"
                @click="downloadThermalPDF"
                :loading="generatingThermalPDF"
                :disabled="!contractId"
              />
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <div
              v-if="previewHtml"
              class="contract-preview"
              v-html="previewHtml"
            />
            <div v-else class="text-center pa-8 text-medium-emphasis">
              Şablon seçin ve bilgileri doldurun
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '../services/api.service';
import { useSnackbar } from '../composables/useSnackbar';

interface ContractTemplate {
  id: string;
  name: string;
  sections: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    isLocked: boolean;
    order: number;
    isVisible: boolean;
  }>;
  variables?: Record<string, {
    label: string;
    defaultValue?: string;
    required: boolean;
  }>;
  optionalBlocks?: Array<{
    id: string;
    title: string;
    content: string;
    isEnabled: boolean;
    order: number;
  }>;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  status: string;
  content: {
    sections: Array<any>;
    variables: Record<string, string>;
    styling: any;
  };
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerIdNumber?: string;
}

const props = defineProps<{
  reservationId?: string;
  vehicleId?: string;
}>();

const { showSnackbar } = useSnackbar();

const templates = ref<ContractTemplate[]>([]);
const selectedTemplateId = ref<string | null>(null);
const template = ref<ContractTemplate | null>(null);
const contractVariables = ref<Record<string, string>>({});
const contractData = ref({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerIdNumber: '',
});
const optionalBlocks = ref<Array<{ id: string; isEnabled: boolean }>>([]);
const previewHtml = ref<string>('');
const contractId = ref<string | null>(null);
const contractStatus = ref<string>('draft');
const saving = ref(false);
const signing = ref(false);
const generatingPDF = ref(false);
const generatingThermalPDF = ref(false);
const signatureData = ref({
  customerName: '',
  signatureImage: '',
});

const templateVariables = computed(() => {
  if (!template.value?.variables) return [];
  return Object.entries(template.value.variables).map(([key, value]) => ({
    key,
    label: value.label,
    required: value.required,
    defaultValue: value.defaultValue,
  }));
});

const canSave = computed(() => {
  return selectedTemplateId.value && contractData.value.customerName;
});

const loadTemplates = async () => {
  try {
    const response = await api.get('/rentacar/contracts/templates');
    templates.value = response.data.data || [];
    
    // Select default template
    const defaultTemplate = templates.value.find(t => t.isDefault);
    if (defaultTemplate) {
      selectedTemplateId.value = defaultTemplate.id;
      await loadTemplate();
    }
  } catch (error: any) {
    console.error('Failed to load templates:', error);
    showSnackbar('Şablonlar yüklenirken hata oluştu', 'error');
  }
};

const loadTemplate = async () => {
  if (!selectedTemplateId.value) return;

  try {
    const response = await api.get(`/rentacar/contracts/templates/${selectedTemplateId.value}`);
    template.value = response.data.data;
    
    // Initialize variables
    if (template.value.variables) {
      for (const [key, value] of Object.entries(template.value.variables)) {
        if (!contractVariables.value[key]) {
          contractVariables.value[key] = value.defaultValue || '';
        }
      }
    }

    // Initialize optional blocks
    if (template.value.optionalBlocks) {
      optionalBlocks.value = template.value.optionalBlocks.map(block => ({
        id: block.id,
        isEnabled: block.isEnabled,
      }));
    }

    await updatePreview();
  } catch (error: any) {
    console.error('Failed to load template:', error);
    showSnackbar('Şablon yüklenirken hata oluştu', 'error');
  }
};

const updatePreview = async () => {
  if (!selectedTemplateId.value) return;

  try {
    const response = await api.post('/rentacar/contracts/preview', {
      templateId: selectedTemplateId.value,
      variables: {
        ...contractVariables.value,
        customerName: contractData.value.customerName,
        customerEmail: contractData.value.customerEmail,
        customerPhone: contractData.value.customerPhone,
        customerIdNumber: contractData.value.customerIdNumber,
      },
      optionalBlocks: optionalBlocks.value,
    });

    previewHtml.value = response.data.data.html;
  } catch (error: any) {
    console.error('Failed to update preview:', error);
  }
};

const saveContract = async () => {
  if (!canSave.value) return;

  try {
    saving.value = true;
    const response = await api.post('/rentacar/contracts', {
      templateId: selectedTemplateId.value,
      vehicleId: props.vehicleId,
      reservationId: props.reservationId,
      variables: {
        ...contractVariables.value,
        customerName: contractData.value.customerName,
        customerEmail: contractData.value.customerEmail,
        customerPhone: contractData.value.customerPhone,
        customerIdNumber: contractData.value.customerIdNumber,
      },
      optionalBlocks: optionalBlocks.value,
      customerName: contractData.value.customerName,
      customerEmail: contractData.value.customerEmail,
      customerPhone: contractData.value.customerPhone,
      customerIdNumber: contractData.value.customerIdNumber,
    });

    contractId.value = response.data.data.id;
    contractStatus.value = response.data.data.status;
    showSnackbar('Sözleşme kaydedildi', 'success');
  } catch (error: any) {
    console.error('Failed to save contract:', error);
    showSnackbar(error.response?.data?.message || 'Sözleşme kaydedilemedi', 'error');
  } finally {
    saving.value = false;
  }
};

const signContract = async () => {
  if (!contractId.value) return;

  try {
    signing.value = true;
    const response = await api.post(`/rentacar/contracts/${contractId.value}/sign`, {
      customerSignature: {
        signerName: signatureData.value.customerName,
        signatureImage: signatureData.value.signatureImage,
      },
    });

    contractStatus.value = response.data.data.status;
    showSnackbar('Sözleşme imzalandı ve PDF oluşturuldu', 'success');
  } catch (error: any) {
    console.error('Failed to sign contract:', error);
    showSnackbar(error.response?.data?.message || 'Sözleşme imzalanamadı', 'error');
  } finally {
    signing.value = false;
  }
};

const printContract = () => {
  if (!previewHtml.value) return;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(previewHtml.value);
    printWindow.document.close();
    printWindow.print();
  }
};

const downloadPDF = async () => {
  if (!contractId.value) return;

  try {
    generatingPDF.value = true;
    const response = await api.post(`/rentacar/contracts/${contractId.value}/generate-pdf`, {}, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contract-${contractId.value}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
    showSnackbar('PDF indirildi', 'success');
  } catch (error: any) {
    console.error('Failed to generate PDF:', error);
    showSnackbar('PDF oluşturulamadı', 'error');
  } finally {
    generatingPDF.value = false;
  }
};

const downloadThermalPDF = async () => {
  if (!contractId.value) return;

  try {
    generatingThermalPDF.value = true;
    const response = await api.post(`/rentacar/contracts/${contractId.value}/generate-thermal-pdf`, {}, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contract-${contractId.value}-thermal.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
    showSnackbar('Termal PDF indirildi', 'success');
  } catch (error: any) {
    console.error('Failed to generate thermal PDF:', error);
    showSnackbar('Termal PDF oluşturulamadı', 'error');
  } finally {
    generatingThermalPDF.value = false;
  }
};

// Watch for changes and update preview
watch([contractVariables, contractData, optionalBlocks], () => {
  updatePreview();
}, { deep: true });

onMounted(() => {
  loadTemplates();
});
</script>

<style scoped>
.contract-builder {
  width: 100%;
}

.contract-preview {
  padding: 20px;
  background: white;
  min-height: 600px;
}

.contract-preview :deep(.contract-container) {
  max-width: 100%;
  margin: 0;
  padding: 20px;
}

.contract-preview :deep(.contract-section-legal_core) {
  background: #f5f5f5;
  padding: 15px;
  border-left: 4px solid #1976D2;
  margin: 15px 0;
}

.contract-preview :deep(.section-title) {
  color: #1976D2;
  font-size: 1.2em;
  margin-bottom: 10px;
  font-weight: bold;
}
</style>

