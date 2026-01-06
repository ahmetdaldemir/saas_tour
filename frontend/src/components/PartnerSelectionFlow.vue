<template>
  <v-dialog v-model="dialogVisible" max-width="900" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Request Partnership</span>
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-stepper v-model="step" class="elevation-0">
          <v-stepper-header>
            <v-stepper-item
              :complete="step > 1"
              :title="'Service Details'"
              value="1"
            />
            <v-stepper-item
              :complete="step > 2"
              :title="'Commission Terms'"
              value="2"
            />
            <v-stepper-item
              :title="'Review & Submit'"
              value="3"
            />
          </v-stepper-header>

          <v-stepper-window>
            <!-- Step 1: Service Details -->
            <v-stepper-window-item value="1">
              <v-card variant="flat">
                <v-card-text>
                  <h3 class="mb-4">{{ listing.title }}</h3>
                  <p class="text-body-1 mb-4">{{ listing.description }}</p>
                  
                  <v-divider class="my-4" />
                  
                  <div class="mb-4">
                    <div><strong>Service Type:</strong> {{ formatServiceType(listing.serviceType) }}</div>
                    <div><strong>Provider:</strong> {{ listing.tenant?.name || 'N/A' }}</div>
                    <div v-if="listing.basePrice">
                      <strong>Base Price:</strong> {{ formatPrice(listing.basePrice, listing.currencyCode) }}
                    </div>
                    <div><strong>Commission:</strong> {{ formatCommission(listing) }}</div>
                  </div>

                  <v-alert type="info" variant="tonal" class="mt-4">
                    You are requesting to become a partner with {{ listing.tenant?.name || 'this provider' }}.
                    Once approved, you can use their {{ formatServiceType(listing.serviceType) }} services
                    and commissions will be automatically calculated.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-stepper-window-item>

            <!-- Step 2: Commission Terms -->
            <v-stepper-window-item value="2">
              <v-card variant="flat">
                <v-card-text>
                  <h3 class="mb-4">Commission Terms</h3>
                  
                  <v-alert type="info" variant="tonal" class="mb-4">
                    Default commission terms from the listing. You can customize these if needed.
                  </v-alert>

                  <v-select
                    v-model="agreementForm.commissionType"
                    :items="commissionTypes"
                    label="Commission Type"
                    class="mb-4"
                  />

                  <v-text-field
                    v-if="agreementForm.commissionType === 'percentage' || agreementForm.commissionType === 'hybrid'"
                    v-model.number="agreementForm.commissionRate"
                    label="Commission Rate (%)"
                    type="number"
                    class="mb-4"
                  />

                  <v-text-field
                    v-if="agreementForm.commissionType === 'fixed' || agreementForm.commissionType === 'hybrid'"
                    v-model.number="agreementForm.commissionFixed"
                    label="Fixed Commission"
                    type="number"
                    class="mb-4"
                  />

                  <v-text-field
                    v-model.number="agreementForm.minCommission"
                    label="Minimum Commission (optional)"
                    type="number"
                    class="mb-4"
                  />

                  <v-text-field
                    v-model.number="agreementForm.maxCommission"
                    label="Maximum Commission (optional)"
                    type="number"
                    class="mb-4"
                  />

                  <v-textarea
                    v-model="agreementForm.customTerms"
                    label="Custom Terms (optional)"
                    rows="3"
                  />
                </v-card-text>
              </v-card>
            </v-stepper-window-item>

            <!-- Step 3: Review & Submit -->
            <v-stepper-window-item value="3">
              <v-card variant="flat">
                <v-card-text>
                  <h3 class="mb-4">Review Agreement</h3>
                  
                  <v-card  class="mb-4">
                    <v-card-text>
                      <div class="mb-2"><strong>Provider:</strong> {{ listing.tenant?.name }}</div>
                      <div class="mb-2"><strong>Service:</strong> {{ listing.title }}</div>
                      <div class="mb-2"><strong>Commission Type:</strong> {{ agreementForm.commissionType }}</div>
                      <div v-if="agreementForm.commissionRate" class="mb-2">
                        <strong>Commission Rate:</strong> {{ agreementForm.commissionRate }}%
                      </div>
                      <div v-if="agreementForm.commissionFixed" class="mb-2">
                        <strong>Fixed Commission:</strong> {{ formatPrice(agreementForm.commissionFixed, listing.currencyCode) }}
                      </div>
                      <div v-if="agreementForm.customTerms" class="mt-4">
                        <strong>Custom Terms:</strong>
                        <p class="text-body-2">{{ agreementForm.customTerms }}</p>
                      </div>
                    </v-card-text>
                  </v-card>

                  <v-alert type="warning" variant="tonal">
                    Both parties must approve this agreement before it becomes active.
                    You will be notified when the provider responds.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-btn
          v-if="step > 1"
          @click="step--"
        >
          Previous
        </v-btn>
        <v-spacer />
        <v-btn @click="close">Cancel</v-btn>
        <v-btn
          v-if="step < 3"
          color="primary"
          @click="step++"
        >
          Next
        </v-btn>
        <v-btn
          v-else
          color="primary"
          :loading="submitting"
          @click="submitAgreement"
        >
          Submit Request
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { http } from '../services/api.service';
import { useSnackbar } from '../composables/useSnackbar';

const props = defineProps<{
  listing: any;
}>();

const emit = defineEmits<{
  close: [];
  'agreement-created': [];
}>();

const { showSnackbar } = useSnackbar();

const step = ref(1);
const submitting = ref(false);
const dialogVisible = computed({
  get: () => !!props.listing,
  set: () => emit('close'),
});

const agreementForm = ref({
  commissionType: props.listing?.commissionType || 'percentage',
  commissionRate: props.listing?.commissionRate || null,
  commissionFixed: props.listing?.commissionFixed || null,
  minCommission: props.listing?.minCommission || null,
  maxCommission: props.listing?.maxCommission || null,
  customTerms: '',
});

const commissionTypes = [
  { title: 'Percentage', value: 'percentage' },
  { title: 'Fixed', value: 'fixed' },
  { title: 'Hybrid', value: 'hybrid' },
];

watch(() => props.listing, (newListing) => {
  if (newListing) {
    agreementForm.value = {
      commissionType: newListing.commissionType || 'percentage',
      commissionRate: newListing.commissionRate || null,
      commissionFixed: newListing.commissionFixed || null,
      minCommission: newListing.minCommission || null,
      maxCommission: newListing.maxCommission || null,
      customTerms: '',
    };
    step.value = 1;
  }
}, { immediate: true });

const close = () => {
  emit('close');
};

const submitAgreement = async () => {
  submitting.value = true;
  try {
    await http.post('/marketplace/agreements', {
      providerTenantId: props.listing.tenantId,
      listingId: props.listing.id,
      ...agreementForm.value,
    });
    
    showSnackbar('Partnership request submitted', 'success');
    emit('agreement-created');
    close();
  } catch (error: any) {
    showSnackbar(error.response?.data?.message || 'Failed to submit request', 'error');
  } finally {
    submitting.value = false;
  }
};

const formatServiceType = (type: string) => {
  const types: Record<string, string> = {
    transfer: 'Transfer',
    tour: 'Tour',
    insurance: 'Insurance',
    vehicle_rental: 'Vehicle Rental',
    other: 'Other',
  };
  return types[type] || type;
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
</script>

