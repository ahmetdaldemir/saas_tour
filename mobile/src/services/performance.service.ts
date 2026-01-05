import { apiClient } from './api';
import { API_ENDPOINTS, buildEndpoint } from './api-endpoints';

export interface StaffPerformanceScore {
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
  lastCalculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class PerformanceService {
  async getMyScores(
    periodType: 'monthly' | 'weekly' | 'daily' = 'monthly',
    limit: number = 12
  ): Promise<StaffPerformanceScore[]> {
    const response = await apiClient.instance.get<{ scores: StaffPerformanceScore[] }>(
      buildEndpoint(API_ENDPOINTS.ops.performance.myScores),
      {
        params: { periodType, limit },
      }
    );
    return response.data.scores;
  }

  async getTenantScores(
    period: string,
    periodType: 'monthly' | 'weekly' | 'daily' = 'monthly'
  ): Promise<StaffPerformanceScore[]> {
    const response = await apiClient.instance.get<{ scores: StaffPerformanceScore[] }>(
      buildEndpoint(API_ENDPOINTS.ops.performance.tenantScores),
      {
        params: { period, periodType },
      }
    );
    return response.data.scores;
  }

  async getUserScoreDetails(
    userId: string,
    period: string,
    periodType: 'monthly' | 'weekly' | 'daily' = 'monthly'
  ): Promise<any> {
    const response = await apiClient.instance.get(
      buildEndpoint(API_ENDPOINTS.ops.performance.userScoreDetails, userId),
      {
        params: { period, periodType },
      }
    );
    return response.data;
  }
}

export const performanceService = new PerformanceService();

