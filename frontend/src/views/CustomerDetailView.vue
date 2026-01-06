<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center justify-space-between bg-primary text-white">
            <div class="d-flex align-center">
              <v-btn icon="mdi-arrow-left" variant="text" color="white" @click="goBack" class="mr-2" />
              <span class="text-h6 font-weight-bold">Müşteri Detayları</span>
            </div>
            <v-chip :color="customer?.isActive ? 'success' : 'error'" variant="flat" size="large">
              {{ customer?.isActive ? 'Aktif' : 'Pasif' }}
            </v-chip>
          </v-card-title>
          <v-divider />
          
          <v-card-text v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="mt-4 text-body-1">Yükleniyor...</p>
          </v-card-text>

          <v-card-text v-else-if="!customer" class="text-center py-8">
            <v-icon icon="mdi-alert-circle" size="64" color="error" />
            <p class="mt-4 text-body-1">Müşteri bulunamadı</p>
          </v-card-text>

          <v-card-text v-else>
            <!-- Müşteri Bilgileri -->
            <v-row>
              <v-col cols="12" md="6">
                <v-card  class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-account" class="mr-2" />
                    Kişisel Bilgiler
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>Ad Soyad</v-list-item-title>
                        <v-list-item-subtitle class="text-h6 font-weight-bold">{{ customer.fullName }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.firstName">
                        <v-list-item-title>Ad</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.firstName }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.lastName">
                        <v-list-item-title>Soyad</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.lastName }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.birthPlace">
                        <v-list-item-title>Doğum Yeri</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.birthPlace }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.birthDate">
                        <v-list-item-title>Doğum Tarihi</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(customer.birthDate) }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.gender">
                        <v-list-item-title>Cinsiyet</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip size="small" color="info" variant="tonal">
                            {{ getGenderLabel(customer.gender) }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.country">
                        <v-list-item-title>Ülke</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.country }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.language">
                        <v-list-item-title>Dil</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.language.name || customer.language.code }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card  class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-phone" class="mr-2" />
                    İletişim Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item v-if="customer.email">
                        <v-list-item-title>E-posta</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.email }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.mobilePhone">
                        <v-list-item-title>Cep Telefonu</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.mobilePhone }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.homePhone">
                        <v-list-item-title>Ev Telefonu</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.homePhone }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.homeAddress">
                        <v-list-item-title>Ev Adresi</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.homeAddress }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.workAddress">
                        <v-list-item-title>İş Adresi</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.workAddress }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Kimlik / Pasaport Bilgileri -->
            <v-row v-if="customer.idType || customer.idNumber">
              <v-col cols="12" md="6">
                <v-card  class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-card-account-details" class="mr-2" />
                    Kimlik / Pasaport Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item v-if="customer.idType">
                        <v-list-item-title>Kimlik Türü</v-list-item-title>
                        <v-list-item-subtitle>{{ getIdTypeLabel(customer.idType) }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.idNumber">
                        <v-list-item-title>Kimlik Numarası</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.idNumber }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.idIssuePlace">
                        <v-list-item-title>Veriliş Yeri</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.idIssuePlace }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.idIssueDate">
                        <v-list-item-title>Veriliş Tarihi</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(customer.idIssueDate) }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card  class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-license" class="mr-2" />
                    Ehliyet Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item v-if="customer.licenseNumber">
                        <v-list-item-title>Ehliyet Numarası</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.licenseNumber }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.licenseClass">
                        <v-list-item-title>Ehliyet Sınıfı</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.licenseClass }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.licenseIssuePlace">
                        <v-list-item-title>Veriliş Yeri</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.licenseIssuePlace }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.licenseIssueDate">
                        <v-list-item-title>Veriliş Tarihi</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(customer.licenseIssueDate) }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Vergi Bilgileri -->
            <v-row v-if="customer.taxNumber || customer.taxOffice">
              <v-col cols="12">
                <v-card  class="mb-4">
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-cash-register" class="mr-2" />
                    Vergi Bilgileri
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item v-if="customer.taxNumber">
                        <v-list-item-title>Vergi Numarası</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.taxNumber }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="customer.taxOffice">
                        <v-list-item-title>Vergi Dairesi</v-list-item-title>
                        <v-list-item-subtitle>{{ customer.taxOffice }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- ParaPuan Cüzdan -->
            <v-row>
              <v-col cols="12">
                <v-card  class="mb-4">
                  <v-card-title class="bg-grey-lighten-4 d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-wallet" class="mr-2" />
                      ParaPuan Cüzdan
                    </div>
                    <v-btn
                      color="primary"
                      size="small"
                      prepend-icon="mdi-plus"
                      @click="showWalletAdjustDialog = true"
                    >
                      Puan Ekle/Çıkar
                    </v-btn>
                  </v-card-title>
                  <v-card-text>
                    <div v-if="loadingWallet" class="text-center py-4">
                      <v-progress-circular indeterminate color="primary" size="32" />
                    </div>
                    <div v-else-if="wallet">
                      <v-row>
                        <v-col cols="12" md="4">
                          <v-card variant="flat" color="success" class="text-white">
                            <v-card-text>
                              <div class="text-caption">Mevcut Bakiye</div>
                              <div class="text-h4 font-weight-bold">{{ formatPrice(wallet.balance) }} PP</div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-card variant="flat" color="info" class="text-white">
                            <v-card-text>
                              <div class="text-caption">Toplam Kazanılan</div>
                              <div class="text-h4 font-weight-bold">{{ formatPrice(wallet.totalEarned) }} PP</div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-card variant="flat" color="warning" class="text-white">
                            <v-card-text>
                              <div class="text-caption">Toplam Harcanan</div>
                              <div class="text-h4 font-weight-bold">{{ formatPrice(wallet.totalSpent) }} PP</div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>

                      <v-divider class="my-4" />

                      <div class="d-flex align-center justify-space-between mb-2">
                        <span class="text-subtitle-1 font-weight-bold">İşlem Geçmişi</span>
                        <v-btn
                          size="small"
                          variant="text"
                          icon="mdi-refresh"
                          @click="loadWalletTransactions"
                        />
                      </div>
                      <v-data-table
                        :headers="transactionHeaders"
                        :items="transactions"
                        :loading="loadingTransactions"
                        item-value="id"
                        class="elevation-0"
                      >
                        <template #item.type="{ item }">
                          <v-chip
                            :color="item.type === 'credit' ? 'success' : 'error'"
                            size="small"
                            variant="flat"
                          >
                            {{ item.type === 'credit' ? 'Kazanç' : 'Harcama' }}
                          </v-chip>
                        </template>
                        <template #item.amount="{ item }">
                          <span :class="item.type === 'credit' ? 'text-success' : 'text-error'">
                            {{ item.type === 'credit' ? '+' : '-' }}{{ formatPrice(item.amount) }} PP
                          </span>
                        </template>
                        <template #item.source="{ item }">
                          <v-chip size="small" color="info" variant="tonal">
                            {{ getSourceLabel(item.source) }}
                          </v-chip>
                        </template>
                        <template #item.createdAt="{ item }">
                          {{ formatDateTime(item.createdAt) }}
                        </template>
                      </v-data-table>
                    </div>
                    <div v-else class="text-center py-4 text-grey">
                      Cüzdan bulunamadı
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- İşlemler -->
            <v-row>
              <v-col cols="12">
                <v-card >
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon icon="mdi-cog" class="mr-2" />
                    İşlemler
                  </v-card-title>
                  <v-card-text>
                    <div class="d-flex flex-wrap gap-2">
                      <v-btn
                        color="warning"
                        prepend-icon="mdi-pencil"
                        @click="editCustomer"
                      >
                        Müşteriyi Düzenle
                      </v-btn>
                      <v-btn
                        color="primary"
                        prepend-icon="mdi-lock-reset"
                        @click="showPasswordDialog = true"
                      >
                        Şifre Değiştir
                      </v-btn>
                      <v-btn
                        :color="customer.isBlacklisted ? 'success' : 'error'"
                        :prepend-icon="customer.isBlacklisted ? 'mdi-account-plus' : 'mdi-account-off'"
                        @click="toggleBlacklist"
                      >
                        {{ customer.isBlacklisted ? 'Kara Listeden Çıkar' : 'Kara Listeye Ekle' }}
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Şifre Değiştirme Dialog -->
    <v-dialog v-model="showPasswordDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-primary text-white">
          <v-icon icon="mdi-lock-reset" class="mr-2" />
          Şifre Değiştir
        </v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="newPassword"
            label="Yeni Şifre"
            type="password"
            
            prepend-inner-icon="mdi-lock"
            :rules="passwordRules"
            class="mb-2"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Yeni Şifre (Tekrar)"
            type="password"
            
            prepend-inner-icon="mdi-lock-check"
            :rules="confirmPasswordRules"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showPasswordDialog = false">Vazgeç</v-btn>
          <v-btn color="primary" @click="changePassword" :loading="changingPassword" :disabled="!isPasswordValid">
            Değiştir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Wallet Adjust Dialog -->
    <v-dialog v-model="showWalletAdjustDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-primary text-white">
          <v-icon icon="mdi-wallet" class="mr-2" />
          ParaPuan Ekle/Çıkar
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="walletAdjustFormRef" v-model="walletAdjustFormValid">
            <v-radio-group v-model="walletAdjustForm.type" class="mb-4">
              <v-radio label="Puan Ekle" value="credit" color="success" />
              <v-radio label="Puan Çıkar" value="debit" color="error" />
            </v-radio-group>

            <v-text-field
              v-model.number="walletAdjustForm.amount"
              label="Tutar"
              type="number"
              min="0"
              step="0.01"
              required
              :rules="[v => v !== null && v > 0 || 'Tutar 0\'dan büyük olmalıdır']"
              prepend-icon="mdi-cash"
              class="mb-4"
            />

            <v-textarea
              v-model="walletAdjustForm.reason"
              label="Sebep *"
              required
              :rules="[v => !!v || 'Sebep gereklidir']"
              rows="3"
              class="mb-4"
            />

            <v-textarea
              v-model="walletAdjustForm.description"
              label="Açıklama"
              rows="2"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showWalletAdjustDialog = false">İptal</v-btn>
          <v-btn
            color="primary"
            @click="adjustWallet"
            :loading="adjustingWallet"
            :disabled="!walletAdjustFormValid"
          >
            {{ walletAdjustForm.type === 'credit' ? 'Ekle' : 'Çıkar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '../modules/http';

interface Customer {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  language?: {
    id: string;
    name: string;
    code: string;
  };
  country?: string;
  mobilePhone?: string;
  homePhone?: string;
  email?: string;
  taxOffice?: string;
  taxNumber?: string;
  homeAddress?: string;
  workAddress?: string;
  idType?: 'tc' | 'passport';
  idNumber?: string;
  idIssuePlace?: string;
  idIssueDate?: string;
  licenseNumber?: string;
  licenseClass?: string;
  licenseIssuePlace?: string;
  licenseIssueDate?: string;
  isActive: boolean;
  isBlacklisted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const route = useRoute();
const router = useRouter();

const customer = ref<Customer | null>(null);
const loading = ref(false);
const changingPassword = ref(false);
const showPasswordDialog = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Wallet state
const wallet = ref<any>(null);
const loadingWallet = ref(false);
const loadingTransactions = ref(false);
const transactions = ref<any[]>([]);
const showWalletAdjustDialog = ref(false);
const adjustingWallet = ref(false);
const walletAdjustForm = ref({
  type: 'credit' as 'credit' | 'debit',
  amount: null as number | null,
  reason: '',
  description: '',
});
const walletAdjustFormValid = ref(false);
const walletAdjustFormRef = ref<any>(null);

const transactionHeaders = [
  { title: 'Tarih', key: 'createdAt', sortable: true },
  { title: 'Tür', key: 'type', sortable: false },
  { title: 'Tutar', key: 'amount', sortable: false },
  { title: 'Kaynak', key: 'source', sortable: false },
  { title: 'Açıklama', key: 'description', sortable: false },
  { title: 'Bakiye (Sonra)', key: 'balanceAfter', sortable: false },
];

const passwordRules = [
  (v: string) => !!v || 'Şifre gereklidir',
  (v: string) => (v && v.length >= 6) || 'Şifre en az 6 karakter olmalıdır',
];

const confirmPasswordRules = computed(() => [
  (v: string) => !!v || 'Şifre tekrarı gereklidir',
  (v: string) => v === newPassword.value || 'Şifreler eşleşmiyor',
]);

const isPasswordValid = computed(() => {
  return newPassword.value.length >= 6 && newPassword.value === confirmPassword.value;
});

onMounted(() => {
  loadCustomer();
  if (route.params.id) {
    loadWallet();
    loadWalletTransactions();
  }
});

const loadCustomer = async () => {
  const id = route.params.id as string;
  if (!id) {
    showSnackbar('Müşteri ID bulunamadı', 'error');
    return;
  }

  loading.value = true;
  try {
    const { data } = await http.get<Customer>(`/crm/customers/${id}`);
    customer.value = data;
  } catch (error: any) {
    console.error('Failed to load customer:', error);
    showSnackbar(error.response?.data?.message || 'Müşteri yüklenirken bir hata oluştu', 'error');
  } finally {
    loading.value = false;
  }
};

const changePassword = async () => {
  if (!customer.value || !isPasswordValid.value) return;

  changingPassword.value = true;
  try {
    await http.post(`/crm/customers/${customer.value.id}/change-password`, {
      newPassword: newPassword.value,
    });
    showPasswordDialog.value = false;
    newPassword.value = '';
    confirmPassword.value = '';
    showSnackbar('Şifre başarıyla değiştirildi', 'success');
  } catch (error: any) {
    console.error('Failed to change password:', error);
    showSnackbar(error.response?.data?.message || 'Şifre değiştirilirken bir hata oluştu', 'error');
  } finally {
    changingPassword.value = false;
  }
};

const toggleBlacklist = async () => {
  if (!customer.value) return;

  try {
    await http.put(`/crm/customers/${customer.value.id}`, {
      isBlacklisted: !customer.value.isBlacklisted,
    });
    customer.value.isBlacklisted = !customer.value.isBlacklisted;
    showSnackbar(
      customer.value.isBlacklisted ? 'Müşteri kara listeye eklendi' : 'Müşteri kara listeden çıkarıldı',
      'success'
    );
  } catch (error: any) {
    console.error('Failed to toggle blacklist:', error);
    showSnackbar(error.response?.data?.message || 'Kara liste işlemi sırasında bir hata oluştu', 'error');
  }
};

const editCustomer = () => {
  router.push({ name: 'customers' });
  // TODO: Edit mode'da açılacak şekilde güncellenebilir
};

const goBack = () => {
  router.push({ name: 'customers' });
};

const showSnackbar = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

const formatDate = (date?: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('tr-TR');
};

const getGenderLabel = (gender?: string): string => {
  const labels: Record<string, string> = {
    male: 'Erkek',
    female: 'Kadın',
    other: 'Diğer',
  };
  return labels[gender || ''] || '-';
};

const getIdTypeLabel = (idType?: string): string => {
  const labels: Record<string, string> = {
    tc: 'T.C. Kimlik',
    passport: 'Pasaport',
  };
  return labels[idType || ''] || idType || '-';
};

// Wallet functions
const loadWallet = async () => {
  if (!customer.value?.id) return;
  
  loadingWallet.value = true;
  try {
    const { data } = await http.get(`/wallet/customers/${customer.value.id}`);
    wallet.value = data;
  } catch (error: any) {
    console.error('Failed to load wallet:', error);
    if (error.response?.status !== 404) {
      showSnackbar(error.response?.data?.message || 'Cüzdan yüklenirken bir hata oluştu', 'error');
    }
  } finally {
    loadingWallet.value = false;
  }
};

const loadWalletTransactions = async () => {
  if (!customer.value?.id) return;
  
  loadingTransactions.value = true;
  try {
    const { data } = await http.get(`/wallet/customers/${customer.value.id}/transactions`);
    transactions.value = data || [];
  } catch (error: any) {
    console.error('Failed to load transactions:', error);
    showSnackbar(error.response?.data?.message || 'İşlem geçmişi yüklenirken bir hata oluştu', 'error');
  } finally {
    loadingTransactions.value = false;
  }
};

const adjustWallet = async () => {
  if (!customer.value?.id || !walletAdjustForm.value.amount || walletAdjustForm.value.amount <= 0) return;
  
  adjustingWallet.value = true;
  try {
    await http.post(`/wallet/customers/${customer.value.id}/adjust`, {
      type: walletAdjustForm.value.type,
      amount: walletAdjustForm.value.amount,
      reason: walletAdjustForm.value.reason,
      description: walletAdjustForm.value.description || undefined,
    });
    
    showWalletAdjustDialog.value = false;
    walletAdjustForm.value = {
      type: 'credit',
      amount: null,
      reason: '',
      description: '',
    };
    walletAdjustFormValid.value = false;
    
    await loadWallet();
    await loadWalletTransactions();
    showSnackbar('ParaPuan başarıyla güncellendi', 'success');
  } catch (error: any) {
    console.error('Failed to adjust wallet:', error);
    showSnackbar(error.response?.data?.message || 'ParaPuan güncellenirken bir hata oluştu', 'error');
  } finally {
    adjustingWallet.value = false;
  }
};

const formatPrice = (price: number | string | null | undefined): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) || 0 : (price || 0);
  return Number(numPrice).toFixed(2);
};

const formatDateTime = (date?: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleString('tr-TR');
};

const getSourceLabel = (source?: string): string => {
  const labels: Record<string, string> = {
    reservation: 'Rezervasyon',
    manual: 'Manuel',
    coupon_generation: 'Kupon Üretimi',
    coupon_redemption: 'Kupon Kullanımı',
    admin_adjustment: 'Admin Düzenleme',
  };
  return labels[source || ''] || source || '-';
};
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}
</style>

