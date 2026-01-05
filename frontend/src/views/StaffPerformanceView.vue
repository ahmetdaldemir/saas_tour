<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div>
              <v-icon icon="mdi-chart-line" class="mr-2" />
              <span class="text-h5">Staff Performance Scores</span>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="loadScores"
              :loading="loading"
            >
              Yenile
            </v-btn>
          </v-card-title>
          <v-divider />

          <!-- Filters -->
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedPeriodType"
                  :items="periodTypes"
                  label="Period Type"
                  @update:model-value="loadScores"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="selectedPeriod"
                  label="Period"
                  :placeholder="periodPlaceholder"
                  @update:model-value="loadScores"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-btn
                  color="secondary"
                  prepend-icon="mdi-calculator"
                  @click="recalculateScores"
                  :loading="recalculating"
                >
                  Recalculate
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider />

          <!-- Summary Cards -->
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-card color="primary" variant="tonal">
                  <v-card-text>
                    <div class="text-h6">Total Staff</div>
                    <div class="text-h4">{{ scores.length }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card color="success" variant="tonal">
                  <v-card-text>
                    <div class="text-h6">Avg Score</div>
                    <div class="text-h4">{{ averageScore.toFixed(1) }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card color="info" variant="tonal">
                  <v-card-text>
                    <div class="text-h6">Top Performer</div>
                    <div class="text-h6">{{ topPerformer?.user?.name || 'N/A' }}</div>
                    <div class="text-body-2">{{ topPerformer?.overallScore?.toFixed(1) || 0 }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card color="warning" variant="tonal">
                  <v-card-text>
                    <div class="text-h6">Needs Improvement</div>
                    <div class="text-h6">{{ needsImprovement?.user?.name || 'N/A' }}</div>
                    <div class="text-body-2">{{ needsImprovement?.overallScore?.toFixed(1) || 0 }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider />

          <!-- Scores Table -->
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="scores"
              :loading="loading"
              class="elevation-1"
            >
              <template #item.user="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.user?.name || 'Unknown' }}</div>
                  <div class="text-caption text-grey">{{ item.user?.email || '' }}</div>
                </div>
              </template>

              <template #item.overallScore="{ item }">
                <v-chip
                  :color="getScoreColor(item.overallScore)"
                  size="small"
                >
                  {{ item.overallScore.toFixed(1) }}
                </v-chip>
              </template>

              <template #item.timelinessScore="{ item }">
                <div class="d-flex align-center">
                  <v-progress-linear
                    :model-value="item.timelinessScore"
                    :color="getScoreColor(item.timelinessScore)"
                    height="8"
                    rounded
                    class="mr-2"
                    style="width: 60px"
                  />
                  <span>{{ item.timelinessScore.toFixed(1) }}</span>
                </div>
              </template>

              <template #item.completenessScore="{ item }">
                <div class="d-flex align-center">
                  <v-progress-linear
                    :model-value="item.completenessScore"
                    :color="getScoreColor(item.completenessScore)"
                    height="8"
                    rounded
                    class="mr-2"
                    style="width: 60px"
                  />
                  <span>{{ item.completenessScore.toFixed(1) }}</span>
                </div>
              </template>

              <template #item.accuracyScore="{ item }">
                <div class="d-flex align-center">
                  <v-progress-linear
                    :model-value="item.accuracyScore"
                    :color="getScoreColor(item.accuracyScore)"
                    height="8"
                    rounded
                    class="mr-2"
                    style="width: 60px"
                  />
                  <span>{{ item.accuracyScore.toFixed(1) }}</span>
                </div>
              </template>

              <template #item.metrics="{ item }">
                <div class="text-caption">
                  <div>Tasks: {{ item.completedTasks }}/{{ item.totalTasks }}</div>
                  <div>On-time: {{ item.onTimeCompletions }}</div>
                  <div>Late: {{ item.lateCompletions }}</div>
                  <div>Errors: {{ item.errorCount }}</div>
                </div>
              </template>

              <template #item.actions="{ item }">
                <v-btn
                  icon
                  size="small"
                  @click="viewDetails(item)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="800">
      <v-card v-if="selectedScore">
        <v-card-title>
          <span class="text-h6">Performance Details</span>
          <v-spacer />
          <v-btn icon @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <div class="text-h6 mb-2">{{ selectedScore.user?.name }}</div>
              <div class="text-body-2 text-grey mb-4">{{ selectedScore.user?.email }}</div>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-text>
                  <div class="text-caption text-grey">Timeliness Score</div>
                  <div class="text-h4">{{ selectedScore.timelinessScore.toFixed(1) }}</div>
                  <div class="text-caption mt-2">
                    On-time Rate: {{ selectedScore.timelinessDetails?.onTimeRate?.toFixed(1) || 0 }}%
                  </div>
                  <div class="text-caption">
                    Avg Delay: {{ selectedScore.timelinessDetails?.averageDelayMinutes?.toFixed(0) || 0 }} min
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-text>
                  <div class="text-caption text-grey">Completeness Score</div>
                  <div class="text-h4">{{ selectedScore.completenessScore.toFixed(1) }}</div>
                  <div class="text-caption mt-2">
                    Missing Photos: {{ selectedScore.completenessDetails?.missingPhotos || 0 }}
                  </div>
                  <div class="text-caption">
                    Missing License: {{ selectedScore.completenessDetails?.missingLicense || 0 }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-text>
                  <div class="text-caption text-grey">Accuracy Score</div>
                  <div class="text-h4">{{ selectedScore.accuracyScore.toFixed(1) }}</div>
                  <div class="text-caption mt-2">
                    Total Errors: {{ selectedScore.totalErrors }}
                  </div>
                  <div class="text-caption">
                    Data Entry: {{ selectedScore.accuracyDetails?.dataEntryErrors || 0 }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-row class="mt-4">
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">Task Metrics</v-card-title>
                <v-card-text>
                  <v-simple-table>
                    <tbody>
                      <tr>
                        <td>Total Tasks</td>
                        <td>{{ selectedScore.totalTasks }}</td>
                      </tr>
                      <tr>
                        <td>Completed Tasks</td>
                        <td>{{ selectedScore.completedTasks }}</td>
                      </tr>
                      <tr>
                        <td>On-time Completions</td>
                        <td>{{ selectedScore.onTimeCompletions }}</td>
                      </tr>
                      <tr>
                        <td>Late Completions</td>
                        <td>{{ selectedScore.lateCompletions }}</td>
                      </tr>
                      <tr>
                        <td>Missing Data Count</td>
                        <td>{{ selectedScore.missingDataCount }}</td>
                      </tr>
                      <tr>
                        <td>Error Count</td>
                        <td>{{ selectedScore.errorCount }}</td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { http } from '../services/api.service';

interface StaffPerformanceScore {
  id: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  period: string;
  periodType: 'monthly' | 'weekly' | 'daily';
  timelinessScore: number;
  completenessScore: number;
  accuracyScore: number;
  overallScore: number;
  totalTasks: number;
  completedTasks: number;
  onTimeCompletions: number;
  lateCompletions: number;
  missingDataCount: number;
  errorCount: number;
  totalErrors: number;
  timelinessDetails?: any;
  completenessDetails?: any;
  accuracyDetails?: any;
}

const loading = ref(false);
const recalculating = ref(false);
const scores = ref<StaffPerformanceScore[]>([]);
const selectedPeriodType = ref<'monthly' | 'weekly' | 'daily'>('monthly');
const selectedPeriod = ref('');
const detailsDialog = ref(false);
const selectedScore = ref<StaffPerformanceScore | null>(null);

const periodTypes = [
  { title: 'Monthly', value: 'monthly' },
  { title: 'Weekly', value: 'weekly' },
  { title: 'Daily', value: 'daily' },
];

const periodPlaceholder = computed(() => {
  if (selectedPeriodType.value === 'monthly') {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return 'YYYY-WW or YYYY-MM-DD';
});

const headers = [
  { title: 'Staff Member', key: 'user', sortable: true },
  { title: 'Overall Score', key: 'overallScore', sortable: true },
  { title: 'Timeliness', key: 'timelinessScore', sortable: true },
  { title: 'Completeness', key: 'completenessScore', sortable: true },
  { title: 'Accuracy', key: 'accuracyScore', sortable: true },
  { title: 'Metrics', key: 'metrics', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
];

const averageScore = computed(() => {
  if (scores.value.length === 0) return 0;
  const sum = scores.value.reduce((acc, score) => acc + score.overallScore, 0);
  return sum / scores.value.length;
});

const topPerformer = computed(() => {
  if (scores.value.length === 0) return null;
  return scores.value.reduce((top, score) =>
    score.overallScore > top.overallScore ? score : top
  );
});

const needsImprovement = computed(() => {
  if (scores.value.length === 0) return null;
  return scores.value.reduce((lowest, score) =>
    score.overallScore < lowest.overallScore ? score : lowest
  );
});

const getScoreColor = (score: number) => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
};

const loadScores = async () => {
  loading.value = true;
  try {
    const period = selectedPeriod.value || periodPlaceholder.value;
    const { data } = await http.get('/ops/performance/tenant-scores', {
      params: {
        period,
        periodType: selectedPeriodType.value,
      },
    });
    scores.value = data.scores || [];
  } catch (error) {
    console.error('Failed to load scores:', error);
  } finally {
    loading.value = false;
  }
};

const recalculateScores = async () => {
  recalculating.value = true;
  try {
    const period = selectedPeriod.value || periodPlaceholder.value;
    await http.post('/ops/performance/recalculate', {
      period,
      periodType: selectedPeriodType.value,
    });
    await loadScores();
  } catch (error) {
    console.error('Failed to recalculate scores:', error);
  } finally {
    recalculating.value = false;
  }
};

const viewDetails = async (score: StaffPerformanceScore) => {
  selectedScore.value = score;
  detailsDialog.value = true;
};

onMounted(() => {
  loadScores();
});
</script>

<style scoped>
.text-h4 {
  font-weight: 600;
}
</style>

