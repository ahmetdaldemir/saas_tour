<template>
  <div class="pricing-intelligence-dashboard">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-chart-line-variant" color="primary" />
          <span>Smart Pricing & Occupancy Insights</span>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          :loading="analyzing"
          @click="runAnalysis"
        >
          Analyze Now
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <!-- Summary Cards -->
        <v-row class="mb-4">
          <v-col cols="12" md="3">
            <v-card color="error" variant="tonal">
              <v-card-text>
                <div class="text-h4">{{ summary.critical }}</div>
                <div class="text-body-2">Critical Alerts</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card color="warning" variant="tonal">
              <v-card-text>
                <div class="text-h4">{{ summary.warning }}</div>
                <div class="text-body-2">Warnings</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card color="info" variant="tonal">
              <v-card-text>
                <div class="text-h4">{{ summary.info }}</div>
                <div class="text-body-2">Info</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card color="primary" variant="tonal">
              <v-card-text>
                <div class="text-h4">{{ summary.total }}</div>
                <div class="text-body-2">Total Insights</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Top Insights -->
        <v-card class="mb-4">
          <v-card-title>Top Insights</v-card-title>
          <v-divider />
          <v-card-text>
            <v-list v-if="topInsights.length > 0">
              <v-list-item
                v-for="insight in topInsights"
                :key="insight.id"
                :class="getSeverityClass(insight.severity)"
              >
                <template #prepend>
                  <v-icon :color="getSeverityColor(insight.severity)">
                    {{ getSeverityIcon(insight.severity) }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ insight.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ insight.reasoning }}</v-list-item-subtitle>
                <template #append>
                  <div class="d-flex gap-2">
                    <v-chip
                      :color="getTypeColor(insight.type)"
                      size="small"
                      variant="tonal"
                    >
                      {{ formatType(insight.type) }}
                    </v-chip>
                    <v-btn
                      icon="mdi-check"
                      size="small"
                      variant="text"
                      @click="acknowledgeInsight(insight.id)"
                    />
                    <v-btn
                      icon="mdi-close"
                      size="small"
                      variant="text"
                      @click="dismissInsight(insight.id)"
                    />
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal">
              No active insights. Run analysis to generate recommendations.
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Insights by Type -->
        <v-card>
          <v-card-title>Insights by Type</v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col
                v-for="(count, type) in summary.byType"
                :key="type"
                cols="12"
                md="6"
              >
                <v-card >
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-h6">{{ formatType(type) }}</div>
                        <div class="text-body-2 text-medium-emphasis">{{ count }} insights</div>
                      </div>
                      <v-icon :color="getTypeColor(type)" size="40">
                        {{ getTypeIcon(type) }}
                      </v-icon>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { http } from '../services/api.service';
import { useSnackbar } from '../composables/useSnackbar';

interface PricingInsight {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  status: string;
  title: string;
  reasoning: string;
  currentPrice?: number;
  recommendedPrice?: number;
  marketAveragePrice?: number;
  occupancyRate?: number;
  vehicleId?: string;
  vehicle?: {
    id: string;
    name: string;
  };
}

interface DashboardSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

const { showSnackbar } = useSnackbar();

const analyzing = ref(false);
const summary = ref<DashboardSummary>({
  total: 0,
  critical: 0,
  warning: 0,
  info: 0,
  byType: {},
  bySeverity: {},
});
const topInsights = ref<PricingInsight[]>([]);

const loadDashboard = async () => {
  try {
    const response = await http.get('/rentacar/pricing-intelligence/dashboard');
    summary.value = response.data.data.summary;
    topInsights.value = response.data.data.topInsights || [];
  } catch (error: any) {
    console.error('Failed to load dashboard:', error);
  }
};

const runAnalysis = async () => {
  analyzing.value = true;
  try {
    await http.post('/rentacar/pricing-intelligence/analyze');
    showSnackbar('Analysis completed successfully', 'success');
    await loadDashboard();
  } catch (error: any) {
    console.error('Failed to run analysis:', error);
    showSnackbar(error.response?.data?.message || 'Analysis failed', 'error');
  } finally {
    analyzing.value = false;
  }
};

const acknowledgeInsight = async (id: string) => {
  try {
    await http.post(`/rentacar/pricing-intelligence/insights/${id}/acknowledge`);
    showSnackbar('Insight acknowledged', 'success');
    await loadDashboard();
  } catch (error: any) {
    console.error('Failed to acknowledge insight:', error);
    showSnackbar('Failed to acknowledge insight', 'error');
  }
};

const dismissInsight = async (id: string) => {
  try {
    await http.post(`/rentacar/pricing-intelligence/insights/${id}/dismiss`);
    showSnackbar('Insight dismissed', 'success');
    await loadDashboard();
  } catch (error: any) {
    console.error('Failed to dismiss insight:', error);
    showSnackbar('Failed to dismiss insight', 'error');
  }
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'error';
    case 'warning': return 'warning';
    default: return 'info';
  }
};

const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'mdi-alert-circle';
    case 'warning': return 'mdi-alert';
    default: return 'mdi-information';
  }
};

const getSeverityClass = (severity: string): string => {
  return `insight-${severity}`;
};

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    underpriced: 'success',
    overpriced: 'error',
    idle_vehicle: 'warning',
    high_demand: 'info',
    low_demand: 'warning',
    seasonal_trend: 'primary',
    location_demand: 'secondary',
  };
  return colors[type] || 'grey';
};

const getTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    underpriced: 'mdi-arrow-down',
    overpriced: 'mdi-arrow-up',
    idle_vehicle: 'mdi-car-off',
    high_demand: 'mdi-trending-up',
    low_demand: 'mdi-trending-down',
    seasonal_trend: 'mdi-calendar',
    location_demand: 'mdi-map-marker',
  };
  return icons[type] || 'mdi-information';
};

const formatType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.pricing-intelligence-dashboard {
  width: 100%;
}

.insight-critical {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.insight-warning {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.insight-info {
  border-left: 4px solid rgb(var(--v-theme-info));
}
</style>

