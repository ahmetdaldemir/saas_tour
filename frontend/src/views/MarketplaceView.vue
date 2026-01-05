<template>
  <div class="marketplace-view">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-2">
                <v-icon icon="mdi-store" color="primary" />
                <span>Tenant Marketplace</span>
              </div>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openCreateListingDialog"
              >
                Offer Service
              </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-tabs v-model="activeTab" class="mb-4">
                <v-tab value="browse">Browse Services</v-tab>
                <v-tab value="my-listings">My Listings</v-tab>
                <v-tab value="agreements">Agreements</v-tab>
                <v-tab value="commissions">Commissions</v-tab>
              </v-tabs>

              <v-window v-model="activeTab">
                <!-- Browse Services -->
                <v-window-item value="browse">
                  <div class="mb-4">
                    <v-row>
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="filters.serviceType"
                          :items="serviceTypes"
                          label="Service Type"
                          clearable
                          @update:model-value="loadListings"
                        />
                      </v-col>
                      <v-col cols="12" md="8">
                        <v-text-field
                          v-model="searchQuery"
                          label="Search"
                          prepend-inner-icon="mdi-magnify"
                          clearable
                          @update:model-value="loadListings"
                        />
                      </v-col>
                    </v-row>
                  </div>

                  <v-row v-if="loadingListings">
                    <v-col cols="12" class="text-center">
                      <v-progress-circular indeterminate />
                    </v-col>
                  </v-row>

                  <v-row v-else>
                    <v-col
                      v-for="listing in listings"
                      :key="listing.id"
                      cols="12"
                      md="6"
                      lg="4"
                    >
                      <v-card>
                        <v-card-title>{{ listing.title }}</v-card-title>
                        <v-card-subtitle>
                          <v-chip size="small" :color="getServiceTypeColor(listing.serviceType)">
                            {{ formatServiceType(listing.serviceType) }}
                          </v-chip>
                        </v-card-subtitle>
                        <v-card-text>
                          <p class="text-body-2">{{ listing.description }}</p>
                          <div class="mt-2">
                            <div><strong>Commission:</strong> {{ formatCommission(listing) }}</div>
                            <div v-if="listing.basePrice">
                              <strong>Base Price:</strong> {{ formatPrice(listing.basePrice, listing.currencyCode) }}
                            </div>
                            <div><strong>Provider:</strong> {{ listing.tenant?.name || 'N/A' }}</div>
                          </div>
                        </v-card-text>
                        <v-card-actions>
                          <v-spacer />
                          <v-btn
                            color="primary"
                            @click="openPartnerSelection(listing)"
                          >
                            Request Partnership
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-window-item>

                <!-- My Listings -->
                <v-window-item value="my-listings">
                  <v-data-table
                    :headers="listingHeaders"
                    :items="myListings"
                    :loading="loadingListings"
                  >
                    <template #item.status="{ item }">
                      <v-chip :color="getStatusColor(item.status)" size="small">
                        {{ item.status }}
                      </v-chip>
                    </template>
                    <template #item.actions="{ item }">
                      <v-btn icon="mdi-pencil" size="small" @click="editListing(item)" />
                      <v-btn icon="mdi-delete" size="small" color="error" @click="deleteListing(item.id)" />
                    </template>
                  </v-data-table>
                </v-window-item>

                <!-- Agreements -->
                <v-window-item value="agreements">
                  <v-data-table
                    :headers="agreementHeaders"
                    :items="agreements"
                    :loading="loadingAgreements"
                  >
                    <template #item.status="{ item }">
                      <v-chip :color="getStatusColor(item.status)" size="small">
                        {{ item.status }}
                      </v-chip>
                    </template>
                    <template #item.actions="{ item }">
                      <v-btn
                        v-if="item.status === 'pending' && needsMyApproval(item)"
                        color="success"
                        size="small"
                        @click="approveAgreement(item.id)"
                      >
                        Approve
                      </v-btn>
                      <v-btn
                        v-if="item.status === 'active'"
                        color="warning"
                        size="small"
                        @click="suspendAgreement(item.id)"
                      >
                        Suspend
                      </v-btn>
                    </template>
                  </v-data-table>
                </v-window-item>

                <!-- Commissions -->
                <v-window-item value="commissions">
                  <v-row class="mb-4">
                    <v-col cols="12" md="4">
                      <v-card color="success" variant="tonal">
                        <v-card-text>
                          <div class="text-h4">{{ commissionSummary.totalEarned.toFixed(2) }}</div>
                          <div class="text-body-2">Total Earned</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-card color="error" variant="tonal">
                        <v-card-text>
                          <div class="text-h4">{{ commissionSummary.totalPaid.toFixed(2) }}</div>
                          <div class="text-body-2">Total Paid</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-card color="info" variant="tonal">
                        <v-card-text>
                          <div class="text-h4">{{ commissionSummary.totalTransactions }}</div>
                          <div class="text-body-2">Total Transactions</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <v-data-table
                    :headers="transactionHeaders"
                    :items="transactions"
                    :loading="loadingTransactions"
                  >
                    <template #item.type="{ item }">
                      <v-chip :color="item.type === 'commission_earned' ? 'success' : 'error'" size="small">
                        {{ item.type === 'commission_earned' ? 'Earned' : 'Paid' }}
                      </v-chip>
                    </template>
                    <template #item.commissionAmount="{ item }">
                      {{ formatPrice(item.commissionAmount, item.currencyCode) }}
                    </template>
                  </v-data-table>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Create/Edit Listing Dialog -->
    <v-dialog v-model="showListingDialog" max-width="800">
      <v-card>
        <v-card-title>{{ editingListing ? 'Edit Listing' : 'Create Listing' }}</v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="listingFormRef">
            <v-text-field v-model="listingForm.title" label="Title" required />
            <v-textarea v-model="listingForm.description" label="Description" />
            <v-select
              v-model="listingForm.serviceType"
              :items="serviceTypes"
              label="Service Type"
              required
            />
            <v-select
              v-model="listingForm.commissionType"
              :items="commissionTypes"
              label="Commission Type"
              required
            />
            <v-text-field
              v-model.number="listingForm.commissionRate"
              label="Commission Rate (%)"
              type="number"
              v-if="listingForm.commissionType === 'percentage' || listingForm.commissionType === 'hybrid'"
            />
            <v-text-field
              v-model.number="listingForm.commissionFixed"
              label="Fixed Commission"
              type="number"
              v-if="listingForm.commissionType === 'fixed' || listingForm.commissionType === 'hybrid'"
            />
            <v-text-field v-model.number="listingForm.basePrice" label="Base Price" type="number" />
            <v-text-field v-model="listingForm.currencyCode" label="Currency Code" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showListingDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveListing">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Partner Selection Dialog -->
    <PartnerSelectionFlow
      v-if="selectedListing"
      :listing="selectedListing"
      @close="selectedListing = null"
      @agreement-created="onAgreementCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { http } from '../services/api.service';
import { useSnackbar } from '../composables/useSnackbar';
import PartnerSelectionFlow from '../components/PartnerSelectionFlow.vue';

const { showSnackbar } = useSnackbar();

const activeTab = ref('browse');
const loadingListings = ref(false);
const loadingAgreements = ref(false);
const loadingTransactions = ref(false);
const listings = ref<any[]>([]);
const myListings = ref<any[]>([]);
const agreements = ref<any[]>([]);
const transactions = ref<any[]>([]);
const commissionSummary = ref({
  totalEarned: 0,
  totalPaid: 0,
  totalTransactions: 0,
  pendingAmount: 0,
  processedAmount: 0,
});

const filters = ref({
  serviceType: null as string | null,
});
const searchQuery = ref('');
const showListingDialog = ref(false);
const editingListing = ref<any | null>(null);
const selectedListing = ref<any | null>(null);

const listingForm = ref({
  title: '',
  description: '',
  serviceType: 'transfer',
  commissionType: 'percentage',
  commissionRate: 10,
  commissionFixed: 0,
  basePrice: 0,
  currencyCode: 'TRY',
});

const serviceTypes = [
  { title: 'Transfer', value: 'transfer' },
  { title: 'Tour', value: 'tour' },
  { title: 'Insurance', value: 'insurance' },
  { title: 'Vehicle Rental', value: 'vehicle_rental' },
  { title: 'Other', value: 'other' },
];

const commissionTypes = [
  { title: 'Percentage', value: 'percentage' },
  { title: 'Fixed', value: 'fixed' },
  { title: 'Hybrid', value: 'hybrid' },
];

const listingHeaders = [
  { title: 'Title', key: 'title' },
  { title: 'Service Type', key: 'serviceType' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
];

const agreementHeaders = [
  { title: 'Provider', key: 'providerTenant.name' },
  { title: 'Consumer', key: 'consumerTenant.name' },
  { title: 'Service', key: 'listing.title' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
];

const transactionHeaders = [
  { title: 'Date', key: 'transactionDate' },
  { title: 'Type', key: 'type' },
  { title: 'Amount', key: 'commissionAmount' },
  { title: 'Description', key: 'description' },
];

const loadListings = async () => {
  loadingListings.value = true;
  try {
    const params: any = {};
    if (filters.value.serviceType) params.serviceType = filters.value.serviceType;
    
    const response = await http.get('/marketplace/listings', { params });
    listings.value = response.data.data || [];
  } catch (error: any) {
    console.error('Failed to load listings:', error);
    showSnackbar('Failed to load listings', 'error');
  } finally {
    loadingListings.value = false;
  }
};

const loadMyListings = async () => {
  try {
    const response = await http.get('/marketplace/listings', {
      params: { myListings: 'true' },
    });
    myListings.value = response.data.data || [];
  } catch (error: any) {
    console.error('Failed to load my listings:', error);
  }
};

const loadAgreements = async () => {
  loadingAgreements.value = true;
  try {
    const response = await http.get('/marketplace/agreements');
    agreements.value = response.data.data || [];
  } catch (error: any) {
    console.error('Failed to load agreements:', error);
  } finally {
    loadingAgreements.value = false;
  }
};

const loadTransactions = async () => {
  loadingTransactions.value = true;
  try {
    const response = await http.get('/marketplace/commission/transactions');
    transactions.value = response.data.data || [];
  } catch (error: any) {
    console.error('Failed to load transactions:', error);
  } finally {
    loadingTransactions.value = false;
  }
};

const loadCommissionSummary = async () => {
  try {
    const response = await http.get('/marketplace/commission/summary', {
      params: { asProvider: 'true' },
    });
    commissionSummary.value = response.data.data || commissionSummary.value;
  } catch (error: any) {
    console.error('Failed to load commission summary:', error);
  }
};

const openCreateListingDialog = () => {
  editingListing.value = null;
  listingForm.value = {
    title: '',
    description: '',
    serviceType: 'transfer',
    commissionType: 'percentage',
    commissionRate: 10,
    commissionFixed: 0,
    basePrice: 0,
    currencyCode: 'TRY',
  };
  showListingDialog.value = true;
};

const saveListing = async () => {
  try {
    if (editingListing.value) {
      await http.put(`/marketplace/listings/${editingListing.value.id}`, listingForm.value);
      showSnackbar('Listing updated', 'success');
    } else {
      await http.post('/marketplace/listings', listingForm.value);
      showSnackbar('Listing created', 'success');
    }
    showListingDialog.value = false;
    await loadListings();
    await loadMyListings();
  } catch (error: any) {
    showSnackbar(error.response?.data?.message || 'Failed to save listing', 'error');
  }
};

const deleteListing = async (id: string) => {
  if (!confirm('Are you sure you want to delete this listing?')) return;
  
  try {
    await http.delete(`/marketplace/listings/${id}`);
    showSnackbar('Listing deleted', 'success');
    await loadMyListings();
  } catch (error: any) {
    showSnackbar('Failed to delete listing', 'error');
  }
};

const openPartnerSelection = (listing: any) => {
  selectedListing.value = listing;
};

const onAgreementCreated = () => {
  selectedListing.value = null;
  loadAgreements();
};

const approveAgreement = async (id: string) => {
  try {
    await http.post(`/marketplace/agreements/${id}/approve`, {
      isProvider: false, // Assuming current user is consumer
    });
    showSnackbar('Agreement approved', 'success');
    await loadAgreements();
  } catch (error: any) {
    showSnackbar('Failed to approve agreement', 'error');
  }
};

const suspendAgreement = async (id: string) => {
  try {
    await http.post(`/marketplace/agreements/${id}/suspend`);
    showSnackbar('Agreement suspended', 'success');
    await loadAgreements();
  } catch (error: any) {
    showSnackbar('Failed to suspend agreement', 'error');
  }
};

const needsMyApproval = (agreement: any) => {
  // Check if current user needs to approve
  return !agreement.approvedByConsumer || !agreement.approvedByProvider;
};

const formatServiceType = (type: string) => {
  return serviceTypes.find(s => s.value === type)?.title || type;
};

const getServiceTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    transfer: 'blue',
    tour: 'green',
    insurance: 'orange',
    vehicle_rental: 'purple',
    other: 'grey',
  };
  return colors[type] || 'grey';
};

const formatCommission = (listing: any) => {
  if (listing.commissionType === 'percentage') {
    return `${listing.commissionRate}%`;
  } else if (listing.commissionType === 'fixed') {
    return `${listing.commissionFixed} ${listing.currencyCode}`;
  } else {
    return `${listing.commissionRate}% + ${listing.commissionFixed} ${listing.currencyCode}`;
  }
};

const formatPrice = (price: number, currency: string) => {
  return `${price.toFixed(2)} ${currency}`;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    pending: 'warning',
    suspended: 'error',
    terminated: 'grey',
  };
  return colors[status] || 'grey';
};

watch(activeTab, (newTab) => {
  if (newTab === 'browse') loadListings();
  if (newTab === 'my-listings') loadMyListings();
  if (newTab === 'agreements') loadAgreements();
  if (newTab === 'commissions') {
    loadTransactions();
    loadCommissionSummary();
  }
});

onMounted(() => {
  loadListings();
});
</script>

<style scoped>
.marketplace-view {
  width: 100%;
}
</style>

