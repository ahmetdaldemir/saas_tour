<template>
  <div>
    <v-card>
      <v-card-title>Hatırlatıcılar Merkezi</v-card-title>
      <v-card-text>
        <!-- Vadesi Yaklaşan -->
        <v-card class="mb-4" color="warning" variant="tonal">
          <v-card-title>Vadesi Yaklaşan (3 Gün İçinde)</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="dueSoonHeaders"
              :items="dueSoonItems"
              :loading="loading"
              item-value="id"
              class="elevation-0"
            >
              <template v-slot:item.type="{ item }">
                <v-chip size="small">{{ item.type === 'CHECK' ? 'Çek/Senet' : 'Kredi Taksiti' }}</v-chip>
              </template>
              <template v-slot:item.dueDate="{ item }">
                {{ formatDate(item.dueDate) }}
              </template>
              <template v-slot:item.amount="{ item }">
                {{ formatCurrency(Number(item.amount)) }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- Geciken -->
        <v-card color="error" variant="tonal">
          <v-card-title>Geciken Öğeler</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="overdueHeaders"
              :items="overdueItems"
              :loading="loading"
              item-value="id"
              class="elevation-0"
            >
              <template v-slot:item.type="{ item }">
                <v-chip size="small">{{ item.type === 'CHECK' ? 'Çek/Senet' : 'Kredi Taksiti' }}</v-chip>
              </template>
              <template v-slot:item.dueDate="{ item }">
                <span class="text-error font-weight-bold">{{ formatDate(item.dueDate) }}</span>
              </template>
              <template v-slot:item.amount="{ item }">
                <span class="text-error font-weight-bold">{{ formatCurrency(Number(item.amount)) }}</span>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="item.type === 'INSTALLMENT'"
                  color="success"
                  size="small"
                  prepend-icon="mdi-check"
                  @click="payInstallment(item)"
                >
                  Öde
                </v-btn>
                <v-btn
                  v-if="item.type === 'CHECK'"
                  color="primary"
                  size="small"
                  prepend-icon="mdi-pencil"
                  @click="editCheck(item)"
                >
                  Düzenle
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { http } from '../../modules/http';
import { useSnackbar } from '../../composables/useSnackbar';

const { showSuccess, showError } = useSnackbar();

const checks = ref<any[]>([]);
const installments = ref<any[]>([]);
const loading = ref(false);

const dueSoonHeaders = [
  { title: 'Tip', key: 'type' },
  { title: 'Açıklama', key: 'description' },
  { title: 'Vade Tarihi', key: 'dueDate' },
  { title: 'Tutar', key: 'amount' },
];

const overdueHeaders = [
  { title: 'Tip', key: 'type' },
  { title: 'Açıklama', key: 'description' },
  { title: 'Vade Tarihi', key: 'dueDate' },
  { title: 'Gecikme (Gün)', key: 'daysOverdue' },
  { title: 'Tutar', key: 'amount' },
  { title: 'İşlemler', key: 'actions', sortable: false },
];

const today = computed(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
});

const threeDaysLater = computed(() => {
  const d = new Date(today.value);
  d.setDate(d.getDate() + 3);
  return d;
});

const dueSoonItems = computed(() => {
  const items: any[] = [];

  // Checks due soon
  checks.value.forEach(check => {
    const maturityDate = new Date(check.maturityDate);
    maturityDate.setHours(0, 0, 0, 0);

    if (maturityDate >= today.value && maturityDate <= threeDaysLater.value &&
        (check.status === 'IN_PORTFOLIO' || check.status === 'ENDORSED')) {
      items.push({
        id: check.id,
        type: 'CHECK',
        description: `${check.checkNo || 'Çek/Senet'} - ${check.bankName || ''}`,
        dueDate: check.maturityDate,
        amount: check.amount,
      });
    }
  });

  // Installments due soon
  installments.value.forEach(inst => {
    const dueDate = new Date(inst.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate >= today.value && dueDate <= threeDaysLater.value &&
        (inst.status === 'PLANNED' || inst.status === 'DUE')) {
      items.push({
        id: inst.id,
        type: 'INSTALLMENT',
        description: `Taksit #${inst.installmentNo} - ${(inst.loan as any)?.title || ''}`,
        dueDate: inst.dueDate,
        amount: inst.amount,
        installment: inst,
      });
    }
  });

  return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
});

const overdueItems = computed(() => {
  const items: any[] = [];

  // Overdue checks
  checks.value.forEach(check => {
    const maturityDate = new Date(check.maturityDate);
    maturityDate.setHours(0, 0, 0, 0);

    if (maturityDate < today.value &&
        (check.status === 'IN_PORTFOLIO' || check.status === 'ENDORSED')) {
      const daysOverdue = Math.ceil((today.value.getTime() - maturityDate.getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id: check.id,
        type: 'CHECK',
        description: `${check.checkNo || 'Çek/Senet'} - ${check.bankName || ''}`,
        dueDate: check.maturityDate,
        daysOverdue,
        amount: check.amount,
        check,
      });
    }
  });

  // Overdue installments
  installments.value.forEach(inst => {
    const dueDate = new Date(inst.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today.value &&
        (inst.status === 'PLANNED' || inst.status === 'DUE' || inst.status === 'OVERDUE')) {
      const daysOverdue = Math.ceil((today.value.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id: inst.id,
        type: 'INSTALLMENT',
        description: `Taksit #${inst.installmentNo} - ${(inst.loan as any)?.title || ''}`,
        dueDate: inst.dueDate,
        daysOverdue,
        amount: inst.amount,
        installment: inst,
      });
    }
  });

  return items.sort((a, b) => b.daysOverdue - a.daysOverdue);
});

const loadData = async () => {
  loading.value = true;
  try {
    // Load checks
    const { data: checksData } = await http.get('/finance/checks');
    checks.value = checksData;

    // Load all installments
    const { data: installmentsData } = await http.get('/finance/loan-installments');
    installments.value = installmentsData;
  } catch (error: any) {
    showError(error.response?.data?.message || 'Veriler yüklenemedi');
  } finally {
    loading.value = false;
  }
};

const payInstallment = async (item: any) => {
  if (!item.installment) return;

  const paidAmount = Number(item.installment.amount);
  if (!confirm(`${formatCurrency(paidAmount)} tutarındaki taksidi ödemek istediğinizden emin misiniz?`)) return;

  try {
    await http.post(`/finance/loan-installments/${item.installment.id}/pay`, {
      paidAmount,
    });
    showSuccess('Taksit ödendi');
    loadData();
  } catch (error: any) {
    showError(error.response?.data?.message || 'Taksit ödenemedi');
  }
};

const editCheck = (item: any) => {
  // Emit event to parent to navigate to checks tab and open edit dialog
  // For now, just show a message
  alert('Çek/Senet düzenleme özelliği için Çekler/Senetler sekmesine gidin.');
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('tr-TR');
};

onMounted(() => {
  loadData();
});
</script>
