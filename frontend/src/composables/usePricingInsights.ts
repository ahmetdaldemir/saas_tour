import { ref, computed } from 'vue';
import { http } from '../services/api.service';

export interface PricingInsight {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  status: string;
  title: string;
  reasoning: string;
  vehicleId?: string;
  currentPrice?: number;
  recommendedPrice?: number;
  occupancyRate?: number;
}

const insights = ref<Map<string, PricingInsight[]>>(new Map());
const loading = ref(false);

export function usePricingInsights() {
  const loadInsightsForVehicle = async (vehicleId: string) => {
    if (insights.value.has(vehicleId)) {
      return insights.value.get(vehicleId) || [];
    }

    loading.value = true;
    try {
      const response = await http.get('/rentacar/pricing-intelligence/insights', {
        params: {
          vehicleId,
          status: 'active',
        },
      });
      const vehicleInsights = response.data.data || [];
      insights.value.set(vehicleId, vehicleInsights);
      return vehicleInsights;
    } catch (error) {
      console.error('Failed to load insights:', error);
      return [];
    } finally {
      loading.value = false;
    }
  };

  const loadAllInsights = async () => {
    loading.value = true;
    try {
      const response = await http.get('/rentacar/pricing-intelligence/insights', {
        params: {
          status: 'active',
        },
      });
      const allInsights = response.data.data || [];
      
      // Group by vehicle
      const grouped = new Map<string, PricingInsight[]>();
      allInsights.forEach((insight: PricingInsight) => {
        if (insight.vehicleId) {
          if (!grouped.has(insight.vehicleId)) {
            grouped.set(insight.vehicleId, []);
          }
          grouped.get(insight.vehicleId)!.push(insight);
        }
      });
      
      insights.value = grouped;
      return allInsights;
    } catch (error) {
      console.error('Failed to load insights:', error);
      return [];
    } finally {
      loading.value = false;
    }
  };

  const getInsightsForVehicle = (vehicleId: string): PricingInsight[] => {
    return insights.value.get(vehicleId) || [];
  };

  const hasCriticalInsight = (vehicleId: string): boolean => {
    const vehicleInsights = insights.value.get(vehicleId) || [];
    return vehicleInsights.some(i => i.severity === 'critical');
  };

  const hasWarningInsight = (vehicleId: string): boolean => {
    const vehicleInsights = insights.value.get(vehicleId) || [];
    return vehicleInsights.some(i => i.severity === 'warning');
  };

  const getHighestSeverity = (vehicleId: string): 'critical' | 'warning' | 'info' | null => {
    const vehicleInsights = insights.value.get(vehicleId) || [];
    if (vehicleInsights.length === 0) return null;
    
    if (vehicleInsights.some(i => i.severity === 'critical')) return 'critical';
    if (vehicleInsights.some(i => i.severity === 'warning')) return 'warning';
    return 'info';
  };

  return {
    insights: computed(() => insights.value),
    loading: computed(() => loading.value),
    loadInsightsForVehicle,
    loadAllInsights,
    getInsightsForVehicle,
    hasCriticalInsight,
    hasWarningInsight,
    getHighestSeverity,
  };
}

