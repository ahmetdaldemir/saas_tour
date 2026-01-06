<template>
  <div>
    <v-card elevation="2">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-account-group" class="mr-2" />
          <span class="text-h5 font-weight-bold">Kullanıcılar</span>
        </div>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          Yeni Kullanıcı Ekle
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="users"
          :loading="loading"
          density="comfortable"
        >
          <template #item.role="{ item }">
            <v-chip
              :color="getRoleColor(item.role)"
              size="small"
              variant="flat"
            >
              {{ getRoleLabel(item.role) }}
            </v-chip>
          </template>
          <template #item.lastLoginAt="{ item }">
            <span v-if="item.lastLoginAt" class="text-caption">
              {{ formatDateTime(item.lastLoginAt) }}
            </span>
            <span v-else class="text-caption text-medium-emphasis">
              Henüz giriş yapmadı
            </span>
          </template>
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="editUser(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="deleteUser(item.id)"
              :disabled="item.id === currentUserId"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="600" scrollable persistent>
      <v-card>
        <v-card-title>
          {{ editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="admin-form-scope">
          <v-form ref="formRef" v-model="formValid">
            <div class="mb-4">
              <label class="form-label">Ad Soyad <span class="required">*</span></label>
              <v-text-field
                v-model="form.name"
                placeholder="Ad ve soyad giriniz"
                :rules="[v => !!v || 'Ad soyad gereklidir']"
                hide-details="auto"
                
                density="comfortable"
              />
            </div>
            
            <div class="mb-4">
              <label class="form-label">E-posta <span class="required">*</span></label>
              <v-text-field
                v-model="form.email"
                type="email"
                placeholder="ornek@email.com"
                :rules="[
                  v => !!v || 'E-posta gereklidir',
                  v => /.+@.+\..+/.test(v) || 'Geçerli bir e-posta adresi giriniz'
                ]"
                hide-details="auto"
                
                density="comfortable"
              />
            </div>
            
            <div class="mb-4">
              <label class="form-label">
                {{ editingUser ? 'Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)' : 'Şifre' }}
                <span v-if="!editingUser" class="required">*</span>
              </label>
              <v-text-field
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                :rules="editingUser ? [] : [v => !!v || 'Şifre gereklidir', v => (v && v.length >= 6) || 'Şifre en az 6 karakter olmalıdır']"
                :hint="editingUser ? 'Boş bırakılırsa şifre değiştirilmez' : ''"
                :persistent-hint="editingUser"
                
                density="comfortable"
              />
            </div>
            
            <div>
              <label class="form-label">Rol <span class="required">*</span></label>
              <v-select
                v-model="form.role"
                :items="roleOptions"
                item-title="label"
                item-value="value"
                placeholder="Rol seçiniz"
                :rules="[v => !!v || 'Rol gereklidir']"
                hide-details="auto"
                
                density="comfortable"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon
                        :icon="getRoleIcon(item.raw.value)"
                        :color="getRoleColor(item.raw.value)"
                        class="mr-2"
                      />
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </div>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">İptal</v-btn>
          <v-btn color="primary" @click="saveUser" :disabled="!formValid">
            Kaydet
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { http } from '../modules/http';

interface UserDto {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const auth = useAuthStore();
const loading = ref(false);
const users = ref<UserDto[]>([]);
const showDialog = ref(false);
const editingUser = ref<UserDto | null>(null);
const formRef = ref();
const formValid = ref(false);

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'admin' as 'admin' | 'editor' | 'viewer',
});

const headers = [
  { title: 'Ad Soyad', key: 'name' },
  { title: 'E-posta', key: 'email' },
  { title: 'Rol', key: 'role' },
  { title: 'Son Giriş', key: 'lastLoginAt' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const roleOptions = [
  { label: 'Yönetici', value: 'admin', description: 'Tüm yetkilere sahip' },
  { label: 'Editör', value: 'editor', description: 'Düzenleme yetkisi' },
  { label: 'Görüntüleyici', value: 'viewer', description: 'Sadece görüntüleme yetkisi' },
];

const currentUserId = computed(() => {
  return auth.user?.id || null;
});

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'error',
    editor: 'primary',
    viewer: 'success',
  };
  return colors[role] || 'grey';
};

const getRoleLabel = (role: string) => {
  const roleMap = roleOptions.find(r => r.value === role);
  return roleMap?.label || role;
};

const getRoleIcon = (role: string) => {
  const icons: Record<string, string> = {
    admin: 'mdi-shield-account',
    editor: 'mdi-account-edit',
    viewer: 'mdi-account-eye',
  };
  return icons[role] || 'mdi-account';
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const loadUsers = async () => {
  if (!auth.tenant) return;
  loading.value = true;
  try {
    const { data } = await http.get<UserDto[]>('/tenant-users', {
      params: { tenantId: auth.tenant.id },
    });
    users.value = data;
  } catch (error) {
    console.error('Failed to load users:', error);
    alert('Kullanıcılar yüklenirken bir hata oluştu');
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  editingUser.value = null;
  form.value = {
    name: '',
    email: '',
    password: '',
    role: 'admin',
  };
  showDialog.value = true;
};

const editUser = (user: UserDto) => {
  editingUser.value = user;
  form.value = {
    name: user.name,
    email: user.email,
    password: '', // Şifre gösterilmez
    role: user.role,
  };
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  editingUser.value = null;
};

const saveUser = async () => {
  if (!auth.tenant || !formValid.value) return;

  try {
    const userData: any = {
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
    };

    // Düzenleme modunda şifre sadece girilmişse ekle
    if (editingUser.value) {
      if (form.value.password) {
        userData.password = form.value.password;
      }
      await http.put(`/tenant-users/${editingUser.value.id}`, userData, {
        params: { tenantId: auth.tenant.id },
      });
    } else {
      // Yeni kullanıcı için şifre zorunlu
      if (!form.value.password) {
        alert('Şifre gereklidir');
        return;
      }
      userData.password = form.value.password;
      userData.tenantId = auth.tenant.id;
      await http.post('/tenant-users', userData);
    }

    await loadUsers();
    closeDialog();
  } catch (error: any) {
    console.error('Failed to save user:', error);
    const errorMessage = error.response?.data?.message || 'Kullanıcı kaydedilirken bir hata oluştu';
    alert(errorMessage);
  }
};

const deleteUser = async (id: string) => {
  if (!auth.tenant) return;

  // Kendi hesabını silmeye izin verme
  if (id === currentUserId.value) {
    alert('Kendi hesabınızı silemezsiniz');
    return;
  }

  if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

  try {
    await http.delete(`/tenant-users/${id}`, {
      params: { tenantId: auth.tenant.id },
    });
    await loadUsers();
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    const errorMessage = error.response?.data?.message || 'Kullanıcı silinirken bir hata oluştu';
    alert(errorMessage);
  }
};

onMounted(() => {
  loadUsers();
});
</script>

