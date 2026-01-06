import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import apiService from '../services/api';
import './Dashboard.css';

interface DashboardStats {
  totalReservations: number;
  todayPickups: number;
  todayReturns: number;
  activeVehicles: number;
  revenueToday: number;
  pendingPayments: number;
}

interface RecentReservation {
  id: string;
  customerName: string;
  vehiclePlate?: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    todayPickups: 0,
    todayReturns: 0,
    activeVehicles: 0,
    revenueToday: 0,
    pendingPayments: 0,
  });
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await apiService.request({
        url: '/dashboard/stats',
        method: 'GET',
      });
      setStats(statsRes.data || stats);

      // Load recent reservations
      const reservationsRes = await apiService.request({
        url: '/reservations',
        method: 'GET',
        params: { limit: 10, sort: '-createdAt' },
      });
      setRecentReservations(reservationsRes.data || []);
    } catch (error) {
      console.error('Dashboard data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusSeverity = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return null;
    }
  };

  const KpiCard = ({ icon, value, label, color }: { icon: string; value: string | number; label: string; color?: string }) => (
    <Card className="kpi-card">
      <div className="kpi-content">
        <i className={`pi ${icon} kpi-icon`} style={{ color }}></i>
        <div className="kpi-text">
          <div className="kpi-value">{value}</div>
          <div className="kpi-label">{label}</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Genel Bakış</h1>
        <Button
          icon="pi pi-refresh"
          label="Yenile"
          onClick={loadDashboardData}
          loading={loading}
          className="p-button-text"
        />
      </div>

      <div className="kpi-grid">
        <KpiCard
          icon="pi-calendar"
          value={stats.totalReservations}
          label="Toplam Rezervasyon"
          color="var(--primary-color)"
        />
        <KpiCard
          icon="pi-arrow-right"
          value={stats.todayPickups}
          label="Bugün Teslim"
          color="#10b981"
        />
        <KpiCard
          icon="pi-arrow-left"
          value={stats.todayReturns}
          label="Bugün İade"
          color="#f59e0b"
        />
        <KpiCard
          icon="pi-car"
          value={stats.activeVehicles}
          label="Aktif Araç"
          color="#3b82f6"
        />
        <KpiCard
          icon="pi-money-bill"
          value={formatPrice(stats.revenueToday)}
          label="Bugün Gelir"
          color="#8b5cf6"
        />
        <KpiCard
          icon="pi-credit-card"
          value={formatPrice(stats.pendingPayments)}
          label="Bekleyen Ödeme"
          color="#ef4444"
        />
      </div>

      <Card title="Son Rezervasyonlar" className="mt-4">
        <DataTable
          value={recentReservations}
          loading={loading}
          emptyMessage="Rezervasyon bulunamadı"
          paginator
          rows={10}
        >
          <Column field="customerName" header="Müşteri" />
          <Column field="vehiclePlate" header="Plaka" />
          <Column
            field="startDate"
            header="Başlangıç"
            body={(row) => formatDate(row.startDate)}
          />
          <Column
            field="endDate"
            header="Bitiş"
            body={(row) => formatDate(row.endDate)}
          />
          <Column
            field="status"
            header="Durum"
            body={(row) => (
              <Tag
                value={row.status}
                severity={getStatusSeverity(row.status)}
              />
            )}
          />
          <Column
            field="totalPrice"
            header="Tutar"
            body={(row) => formatPrice(row.totalPrice)}
          />
        </DataTable>
      </Card>
    </div>
  );
};

export default Dashboard;

