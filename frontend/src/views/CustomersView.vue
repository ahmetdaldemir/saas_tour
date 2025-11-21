<template>
  <div>
    <!-- Müşteri Listesi -->
    <v-card elevation="0" class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between px-4 py-3">
        <span class="text-h6 font-weight-bold">Müşteriler</span>
        <div class="d-flex align-center gap-2">
          <v-btn icon="mdi-refresh" variant="text" @click="loadCustomers" :loading="loadingCustomers" />
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCustomerDialog">
            Yeni Ekle
          </v-btn>
        </div>
      </v-card-title>
      <v-divider />
      
      <!-- Arama/Filtre Bölümü -->
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchFilters.email"
              label="Email"
              prepend-inner-icon="mdi-email"
              density="compact"
              hide-details
              variant="outlined"
              @keyup.enter="searchCustomers"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchFilters.name"
              label="İsim Soyisim"
              prepend-inner-icon="mdi-account"
              density="compact"
              hide-details
              variant="outlined"
              @keyup.enter="searchCustomers"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchFilters.phone"
              label="Telefon"
              prepend-inner-icon="mdi-phone"
              density="compact"
              hide-details
              variant="outlined"
              @keyup.enter="searchCustomers"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-magnify"
              @click="searchCustomers"
            >
              Müşteri Ara
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-divider />
      
      <!-- Müşteri Tablosu -->
      <v-card-text class="pa-0">
        <v-data-table
          :headers="customerTableHeaders"
          :items="customers"
          :loading="loadingCustomers"
          item-value="id"
          class="elevation-0 customer-table"
          density="compact"
        >
          <template #item.index="{ index }">
            <span>{{ index + 1 }}</span>
          </template>

          <template #item.fullName="{ item }">
            <span class="font-weight-medium">{{ item.fullName || '-' }}</span>
          </template>

          <template #item.gender="{ item }">
            <v-chip size="small" color="info" variant="tonal">
              {{ getGenderLabel(item.gender) }}
            </v-chip>
          </template>

          <template #item.phone="{ item }">
            <span>{{ item.phone || '-' }}</span>
          </template>

          <template #item.email="{ item }">
            <span>{{ item.email || '-' }}</span>
          </template>

          <template #item.status="{ item }">
            <v-chip
              size="small"
              :color="item.isActive ? 'success' : 'error'"
              variant="flat"
            >
              {{ item.isActive ? 'Aktif' : 'Pasif' }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex align-center gap-1">
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                color="warning"
                @click.stop="editCustomer(item)"
              />
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click.stop="deleteCustomer(item.id)"
              />
              <v-btn
                color="info"
                variant="text"
                size="small"
                prepend-icon="mdi-account-off"
                @click.stop="blacklistCustomer(item)"
              >
                Kara Liste
              </v-btn>
              <v-btn
                color="info"
                variant="text"
                size="small"
                prepend-icon="mdi-note-plus"
                @click.stop="addNoteToCustomer(item)"
              >
                Not Ekle
              </v-btn>
              <v-btn
                color="warning"
                variant="text"
                size="small"
                prepend-icon="mdi-calendar"
                @click.stop="viewReservations(item)"
              >
                Rezervasyonlar
              </v-btn>
              <v-btn
                color="warning"
                variant="text"
                size="small"
                prepend-icon="mdi-star"
                @click.stop="viewLoyaltyPoints(item)"
              >
                ParaPuan
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Müşteri Ekleme/Düzenleme Dialog -->
    <v-dialog v-model="showCustomerDialog" max-width="1400" fullscreen scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-account-plus" size="24" />
            <span class="text-h6">{{ editingCustomer ? 'Müşteri Düzenle' : 'Müşteri Ekleme Formu' }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeCustomerDialog" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-form ref="customerFormRef" v-model="customerFormValid">
            <v-tabs v-model="customerFormTab" show-arrows class="px-4 pt-4">
              <v-tab value="personal">
                <v-icon start icon="mdi-account" />
                Kişisel Bilgiler
              </v-tab>
              <v-tab value="personal-continued">
                <v-icon start icon="mdi-account-details" />
                Kişisel Bilgiler (Devam)
              </v-tab>
              <v-tab value="identity">
                <v-icon start icon="mdi-card-account-details" />
                Kimlik / Pasaport Bilgileri
              </v-tab>
              <v-tab value="license">
                <v-icon start icon="mdi-license" />
                Ehliyet Bilgileri
              </v-tab>
            </v-tabs>
            <v-divider />
            <v-window v-model="customerFormTab" class="pa-6">
              <!-- Kişisel Bilgiler Sekmesi -->
              <v-window-item value="personal">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.firstName"
                      label="Adı"
                      prepend-inner-icon="mdi-account"
                      required
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.lastName"
                      label="Soyadı"
                      prepend-inner-icon="mdi-account"
                      required
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.birthPlace"
                      label="Doğum Yeri"
                      prepend-inner-icon="mdi-map-marker"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.birthDate"
                      label="Doğum Tarihi"
                      type="date"
                      prepend-inner-icon="mdi-calendar"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12">
                    <div class="mb-2">
                      <label class="text-body-2 mb-2 d-block">Cinsiyet</label>
                      <v-radio-group v-model="customerForm.gender" inline>
                        <v-radio label="Erkek" value="male" />
                        <v-radio label="Kadın" value="female" />
                      </v-radio-group>
                    </div>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Kişisel Bilgiler (Devam) Sekmesi -->
              <v-window-item value="personal-continued">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="customerForm.languageId"
                      :items="availableLanguages"
                      item-title="name"
                      item-value="id"
                      label="Dil"
                      prepend-inner-icon="mdi-translate"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="customerForm.country"
                      :items="countries"
                      item-title="name"
                      item-value="code"
                      label="Ülke"
                      prepend-inner-icon="mdi-earth"
                      @update:model-value="onCountryChange"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.mobilePhone"
                      label="Cep Telefonu"
                      class="mb-2"
                    >
                      <template #prepend-inner>
                        <v-icon icon="mdi-phone" class="mr-2" />
                        <span class="text-body-2 font-weight-medium">{{ selectedCountry?.dialCode || '' }}</span>
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.homePhone"
                      label="Ev/İş Telefonu (Yedek)"
                      prepend-inner-icon="mdi-phone"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.taxOffice"
                      label="Vergi Dairesi"
                      prepend-inner-icon="mdi-office-building"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.taxNumber"
                      label="Vergi No"
                      prepend-inner-icon="mdi-identifier"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.email"
                      label="Email"
                      type="email"
                      prepend-inner-icon="mdi-email"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.password"
                      label="Şifre"
                      type="password"
                      prepend-inner-icon="mdi-lock"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-textarea
                      v-model="customerForm.homeAddress"
                      label="Ev Adresi"
                      prepend-inner-icon="mdi-home"
                      rows="3"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-textarea
                      v-model="customerForm.workAddress"
                      label="İş Adresi"
                      prepend-inner-icon="mdi-office-building"
                      rows="3"
                      class="mb-2"
                    />
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Kimlik / Pasaport Bilgileri Sekmesi -->
              <v-window-item value="identity">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="customerForm.idType"
                      :items="idTypeOptions"
                      item-title="label"
                      item-value="value"
                      label="Kimlik Türü"
                      prepend-inner-icon="mdi-card-account-details"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.idNumber"
                      :label="customerForm.idType === 'tc' ? 'TCKN' : 'Passport No'"
                      prepend-inner-icon="mdi-card-account-details"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.idIssuePlace"
                      label="Verildiği Yer"
                      prepend-inner-icon="mdi-map-marker"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.idIssueDate"
                      label="Veriliş Tarihi"
                      type="date"
                      prepend-inner-icon="mdi-calendar"
                      class="mb-2"
                    />
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Ehliyet Bilgileri Sekmesi -->
              <v-window-item value="license">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.licenseNumber"
                      label="No"
                      prepend-inner-icon="mdi-card-account-details"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.licenseClass"
                      label="Sınıfı"
                      prepend-inner-icon="mdi-format-list-bulleted"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.licenseIssuePlace"
                      label="Verildiği Yer"
                      prepend-inner-icon="mdi-map-marker"
                      class="mb-2"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customerForm.licenseIssueDate"
                      label="Veriliş Tarihi"
                      type="date"
                      prepend-inner-icon="mdi-calendar"
                      class="mb-2"
                    />
                  </v-col>
                </v-row>
              </v-window-item>
            </v-window>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeCustomerDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveCustomer" :loading="savingCustomer" :disabled="!customerFormValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { http } from '../modules/http';
import { useAuthStore } from '../stores/auth';
import { COUNTRIES, type Country } from '../data/countries';

const auth = useAuthStore();

// Data
const customers = ref<CustomerDto[]>([]);
const availableLanguages = ref<LanguageDto[]>([]);

// UI State
const loadingCustomers = ref(false);
const showCustomerDialog = ref(false);
const savingCustomer = ref(false);
const editingCustomer = ref<CustomerDto | null>(null);
const customerFormTab = ref('personal');

// Search Filters
const searchFilters = reactive({
  email: '',
  name: '',
  phone: '',
});

// Form Refs
const customerFormRef = ref();
const customerFormValid = ref(false);

// Countries
const countries = COUNTRIES;

// Customer Form
const customerForm = reactive({
  firstName: '',
  lastName: '',
  birthPlace: '',
  birthDate: '',
  gender: 'male' as 'male' | 'female',
  languageId: '',
  mobilePhone: '',
  homePhone: '',
  taxOffice: '',
  taxNumber: '',
  email: '',
  password: '',
  country: 'TR',
  licenseNumber: '',
  licenseClass: '',
  licenseIssuePlace: '',
  licenseIssueDate: '',
  idNumber: '',
  idType: 'tc' as 'tc' | 'passport',
  idIssuePlace: '',
  idIssueDate: '',
  homeAddress: '',
  workAddress: '',
});

// Options
const idTypeOptions = [
  { label: 'T.C. Kimlik', value: 'tc' },
  { label: 'Passport', value: 'passport' },
];

// Computed
const selectedCountry = computed(() => {
  return countries.find(c => c.code === customerForm.country);
});

// Interfaces
interface LanguageDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface CustomerDto {
  id: string;
  fullName: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  email?: string;
  isActive: boolean;
}

// Table headers
const customerTableHeaders = [
  { title: '#', key: 'index', sortable: false, width: '50px' },
  { title: 'Müşteri İsim Soyisim', key: 'fullName', width: '200px' },
  { title: 'Cinsiyet', key: 'gender', width: '100px' },
  { title: 'Telefon', key: 'phone', width: '150px' },
  { title: 'Email', key: 'email', width: '200px' },
  { title: 'Durum', key: 'status', sortable: false, width: '100px' },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '600px' },
];

// Methods
const getGenderLabel = (gender?: string): string => {
  const labels: Record<string, string> = {
    male: 'Erkek',
    female: 'Kadın',
    other: 'Diğer',
  };
  return labels[gender || ''] || '-';
};

const loadCustomers = async () => {
  if (!auth.tenant) return;
  loadingCustomers.value = true;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // const { data } = await http.get<CustomerDto[]>('/crm/customers', {
    //   params: { tenantId: auth.tenant.id },
    // });
    // customers.value = data;
    
    // Örnek veri (görseldeki gibi)
    const sampleData: CustomerDto[] = [
      {
        id: '1',
        fullName: 'KARL ALEXANDER KROSTİNA',
        gender: 'male',
        phone: '(+49) 1704630767',
        email: 'kkroshina@googlemail.com',
        isActive: true,
      },
      {
        id: '2',
        fullName: 'OLEG BASALAEV',
        gender: 'male',
        phone: '(+7) 9633689689',
        email: 'laybol@yandex.ru',
        isActive: true,
      },
    ];
    
    // Silinen öğeleri filtrele ve eklenen öğeleri ekle
    const deletedIds = getDeletedCustomers();
    const addedCustomers = getAddedCustomers();
    const filteredSample = sampleData.filter(item => !deletedIds.includes(item.id));
    customers.value = [...filteredSample, ...addedCustomers];
  } catch (error) {
    console.error('Failed to load customers:', error);
  } finally {
    loadingCustomers.value = false;
  }
};

const searchCustomers = async () => {
  if (!auth.tenant) return;
  loadingCustomers.value = true;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // const { data } = await http.get<CustomerDto[]>('/crm/customers', {
    //   params: {
    //     tenantId: auth.tenant.id,
    //     email: searchFilters.email,
    //     name: searchFilters.name,
    //     phone: searchFilters.phone,
    //   },
    // });
    // customers.value = data;
    
    // Şimdilik sadece yükleme simülasyonu
    await loadCustomers();
  } catch (error) {
    console.error('Failed to search customers:', error);
  } finally {
    loadingCustomers.value = false;
  }
};

const loadLanguages = async () => {
  try {
    const { data } = await http.get<LanguageDto[]>('/languages');
    availableLanguages.value = data.filter(lang => lang.isActive);
    
    // Set default language (Turkish)
    const defaultLang = availableLanguages.value.find(l => l.code === 'tr' || l.isDefault) || availableLanguages.value[0];
    if (defaultLang) {
      customerForm.languageId = defaultLang.id;
    }
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
};

const onCountryChange = (countryCode: string) => {
  // Ülke değiştiğinde telefon kodu otomatik güncellenir (computed property ile)
  // Cep telefonu alanına prefix olarak eklenir
};

const openCustomerDialog = () => {
  editingCustomer.value = null;
  resetCustomerForm();
  showCustomerDialog.value = true;
};

const closeCustomerDialog = () => {
  showCustomerDialog.value = false;
  resetCustomerForm();
};

const resetCustomerForm = () => {
  customerFormTab.value = 'personal';
  customerForm.firstName = '';
  customerForm.lastName = '';
  customerForm.birthPlace = '';
  customerForm.birthDate = '';
  customerForm.gender = 'male';
  customerForm.languageId = availableLanguages.value.find(l => l.code === 'tr' || l.isDefault)?.id || '';
  customerForm.mobilePhone = '';
  customerForm.homePhone = '';
  customerForm.taxOffice = '';
  customerForm.taxNumber = '';
  customerForm.email = '';
  customerForm.password = '';
  customerForm.country = 'TR';
  customerForm.licenseNumber = '';
  customerForm.licenseClass = '';
  customerForm.licenseIssuePlace = '';
  customerForm.licenseIssueDate = '';
  customerForm.idNumber = '';
  customerForm.idType = 'tc';
  customerForm.idIssuePlace = '';
  customerForm.idIssueDate = '';
  customerForm.homeAddress = '';
  customerForm.workAddress = '';
};

const saveCustomer = async () => {
  if (!auth.tenant) return;
  
  const validated = await customerFormRef.value?.validate();
  if (!validated?.valid) return;
  
  savingCustomer.value = true;
  try {
    const customerData = {
      tenantId: auth.tenant.id,
      firstName: customerForm.firstName,
      lastName: customerForm.lastName,
      fullName: `${customerForm.firstName} ${customerForm.lastName}`,
      birthPlace: customerForm.birthPlace,
      birthDate: customerForm.birthDate,
      gender: customerForm.gender,
      languageId: customerForm.languageId,
      mobilePhone: customerForm.mobilePhone ? `${selectedCountry.value?.dialCode || ''} ${customerForm.mobilePhone}`.trim() : '',
      homePhone: customerForm.homePhone,
      taxOffice: customerForm.taxOffice,
      taxNumber: customerForm.taxNumber,
      email: customerForm.email,
      password: customerForm.password,
      country: customerForm.country,
      licenseNumber: customerForm.licenseNumber,
      licenseClass: customerForm.licenseClass,
      licenseIssuePlace: customerForm.licenseIssuePlace,
      licenseIssueDate: customerForm.licenseIssueDate,
      idNumber: customerForm.idNumber,
      idType: customerForm.idType,
      idIssuePlace: customerForm.idIssuePlace,
      idIssueDate: customerForm.idIssueDate,
      homeAddress: customerForm.homeAddress,
      workAddress: customerForm.workAddress,
      isActive: true,
    };
    
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // if (editingCustomer.value) {
    //   await http.put(`/crm/customers/${editingCustomer.value.id}`, customerData);
    // } else {
    //   await http.post('/crm/customers', customerData);
    // }
    
    // Örnek veri için local state'e ekleme
    if (!editingCustomer.value) {
      const newCustomer: CustomerDto = {
        id: Date.now().toString(),
        fullName: customerData.fullName,
        gender: customerData.gender,
        phone: customerData.mobilePhone,
        email: customerData.email,
        isActive: true,
      };
      customers.value.push(newCustomer);
      
      // localStorage'a kaydet
      const addedCustomers = getAddedCustomers();
      addedCustomers.push(newCustomer);
      saveAddedCustomers(addedCustomers);
    } else {
      // Düzenlenen müşteriyi localStorage'da güncelle
      const addedCustomers = getAddedCustomers();
      const index = addedCustomers.findIndex(c => c.id === editingCustomer.value?.id);
      if (index !== -1) {
        addedCustomers[index] = {
          ...addedCustomers[index],
          fullName: customerData.fullName,
          gender: customerData.gender,
          phone: customerData.mobilePhone,
          email: customerData.email,
        };
        saveAddedCustomers(addedCustomers);
      }
    }
    
    // loadCustomers() çağrılmıyor çünkü zaten local state güncellendi
    // await loadCustomers();
    closeCustomerDialog();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Müşteri kaydedilirken bir hata oluştu');
  } finally {
    savingCustomer.value = false;
  }
};

const editCustomer = (customer: CustomerDto) => {
  // TODO: Müşteri düzenleme dialog'u eklenecek
  alert(`Müşteri düzenleme: ${customer.fullName}`);
};

const deleteCustomer = async (id: string) => {
  if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;
  try {
    // TODO: Backend API endpoint'i eklendiğinde buraya entegre edilecek
    // await http.delete(`/crm/customers/${id}`);
    
    // Örnek veri için local state'ten silme
    const index = customers.value.findIndex(c => c.id === id);
    if (index !== -1) {
      customers.value.splice(index, 1);
    }
    
    // Silinen ID'yi localStorage'a kaydet
    const deletedIds = getDeletedCustomers();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveDeletedCustomers(deletedIds);
    }
    
    // Eklenen öğelerden de sil
    const addedCustomers = getAddedCustomers();
    const addedIndex = addedCustomers.findIndex(c => c.id === id);
    if (addedIndex !== -1) {
      addedCustomers.splice(addedIndex, 1);
      saveAddedCustomers(addedCustomers);
    }
    
    // Backend API hazır olduğunda yukarıdaki satırı kaldırıp loadCustomers() kullanılacak
    // await loadCustomers();
  } catch (error: any) {
    alert(error.response?.data?.message || 'Müşteri silinirken bir hata oluştu');
  }
};

const blacklistCustomer = (customer: CustomerDto) => {
  // TODO: Kara liste özelliği eklenecek
  alert(`Kara listeye ekleme: ${customer.fullName}`);
};

const addNoteToCustomer = (customer: CustomerDto) => {
  // TODO: Not ekleme özelliği eklenecek
  alert(`Not ekleme: ${customer.fullName}`);
};

const viewReservations = (customer: CustomerDto) => {
  // TODO: Rezervasyonlar görüntüleme özelliği eklenecek
  alert(`Rezervasyonlar: ${customer.fullName}`);
};

const viewLoyaltyPoints = (customer: CustomerDto) => {
  // TODO: ParaPuan görüntüleme özelliği eklenecek
  alert(`ParaPuan: ${customer.fullName}`);
};

// Helper functions for localStorage
const getDeletedCustomers = (): string[] => {
  try {
    const deleted = localStorage.getItem('crm_deleted_customers');
    return deleted ? JSON.parse(deleted) : [];
  } catch {
    return [];
  }
};

const saveDeletedCustomers = (deletedIds: string[]) => {
  try {
    localStorage.setItem('crm_deleted_customers', JSON.stringify(deletedIds));
  } catch (error) {
    console.error('Failed to save deleted customers:', error);
  }
};

const getAddedCustomers = (): CustomerDto[] => {
  try {
    const added = localStorage.getItem('crm_added_customers');
    return added ? JSON.parse(added) : [];
  } catch {
    return [];
  }
};

const saveAddedCustomers = (customers: CustomerDto[]) => {
  try {
    localStorage.setItem('crm_added_customers', JSON.stringify(customers));
  } catch (error) {
    console.error('Failed to save added customers:', error);
  }
};

onMounted(async () => {
  await Promise.all([
    loadLanguages(),
    loadCustomers(),
  ]);
});
</script>

<style scoped>
.customer-table {
  width: 100%;
}

.customer-table :deep(th),
.customer-table :deep(td) {
  white-space: nowrap;
  padding: 10px 12px !important;
  vertical-align: middle;
}

.customer-table :deep(th) {
  font-weight: 600;
  font-size: 0.875rem;
}

.customer-table :deep(.v-data-table-header) {
  background-color: rgba(var(--v-theme-surface), 1);
}

.customer-table :deep(.v-btn) {
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}
</style>

