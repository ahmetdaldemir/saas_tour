import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Transfer() {
  const auth = useAuthStore();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchTransfers();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/transfers`);
      const data = response.data?.data || response.data || [];
      setTransfers(data);
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError(err.response?.data?.message || 'Transfer verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'warning', text: 'Bekliyor' },
      confirmed: { bg: 'success', text: 'Onaylandı' },
      cancelled: { bg: 'danger', text: 'İptal' },
      completed: { bg: 'info', text: 'Tamamlandı' },
      inProgress: { bg: 'primary', text: 'Devam Ediyor' },
    };
    const statusInfo = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={statusInfo.bg}>{statusInfo.text}</Badge>;
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="VIP Transfer">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="VIP Transfer">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Transfer
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Transfer verileri yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Transfer No</th>
              <th>Müşteri</th>
              <th>Araç</th>
              <th>Nereden</th>
              <th>Nereye</th>
              <th>Tarih/Saat</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {transfers.length > 0 ? (
              transfers.map((transfer, index) => (
                <tr key={transfer.id}>
                  <td>{index + 1}</td>
                  <td>{transfer.transferNumber || transfer.id}</td>
                  <td>{transfer.customer?.name || '-'}</td>
                  <td>{transfer.vehicle?.model?.name || '-'}</td>
                  <td>{transfer.pickupLocation || '-'}</td>
                  <td>{transfer.dropoffLocation || '-'}</td>
                  <td>{new Date(transfer.transferDate).toLocaleString('tr-TR')}</td>
                  <td>{getStatusBadge(transfer.status)}</td>
                  <td>
                    <Button variant="info" size="sm" className="me-1">
                      <i className="fas fa-eye"></i>
                    </Button>
                    <Button variant="warning" size="sm">
                      <i className="fas fa-edit"></i>
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">
                  Transfer kaydı bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

