import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert, Tab, Tabs } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Operations() {
  const auth = useAuthStore();
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pickup');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchOperations();
    }
  }, [auth.initialized, auth.tenant, activeTab]);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/rentacar/operations/list`, {
        params: { type: activeTab },
      });
      const data = response.data?.data || response.data || [];
      setOperations(data);
    } catch (err) {
      console.error('Error fetching operations:', err);
      setError(err.response?.data?.message || 'Operasyon verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'warning', text: 'Bekliyor' },
      completed: { bg: 'success', text: 'Tamamlandı' },
      delayed: { bg: 'danger', text: 'Gecikmiş' },
    };
    const statusInfo = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={statusInfo.bg}>{statusInfo.text}</Badge>;
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Operasyonlar">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Operasyonlar">
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="pickup" title="Bugün Teslim Alınacaklar">
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <Alert variant="info">Veriler yükleniyor...</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rezervasyon No</th>
                  <th>Müşteri</th>
                  <th>Araç</th>
                  <th>Plaka</th>
                  <th>Teslim Saati</th>
                  <th>Lokasyon</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {operations.length > 0 ? (
                  operations.map((op, index) => (
                    <tr key={op.id}>
                      <td>{index + 1}</td>
                      <td>{op.reservationNumber || '-'}</td>
                      <td>{op.customer?.name || '-'}</td>
                      <td>{op.vehicle?.model?.name || '-'}</td>
                      <td>{op.vehicle?.plateNumber || '-'}</td>
                      <td>{new Date(op.pickupTime).toLocaleTimeString('tr-TR')}</td>
                      <td>{op.pickupLocation || '-'}</td>
                      <td>{getStatusBadge(op.status)}</td>
                      <td>
                        <Button variant="success" size="sm">
                          <i className="fas fa-check"></i> Teslim Et
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Bugün teslim alınacak araç yok
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Tab>

        <Tab eventKey="return" title="Bugün İade Alınacaklar">
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <Alert variant="info">Veriler yükleniyor...</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rezervasyon No</th>
                  <th>Müşteri</th>
                  <th>Araç</th>
                  <th>Plaka</th>
                  <th>İade Saati</th>
                  <th>Lokasyon</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {operations.length > 0 ? (
                  operations.map((op, index) => (
                    <tr key={op.id}>
                      <td>{index + 1}</td>
                      <td>{op.reservationNumber || '-'}</td>
                      <td>{op.customer?.name || '-'}</td>
                      <td>{op.vehicle?.model?.name || '-'}</td>
                      <td>{op.vehicle?.plateNumber || '-'}</td>
                      <td>{new Date(op.returnTime).toLocaleTimeString('tr-TR')}</td>
                      <td>{op.returnLocation || '-'}</td>
                      <td>{getStatusBadge(op.status)}</td>
                      <td>
                        <Button variant="success" size="sm">
                          <i className="fas fa-check"></i> İade Al
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Bugün iade alınacak araç yok
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Tab>
      </Tabs>
    </MainCard>
  );
}

