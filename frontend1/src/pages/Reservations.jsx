import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Reservations() {
  const auth = useAuthStore();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchReservations();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/reservations`);
      const data = response.data?.data || response.data || [];
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.response?.data?.message || 'Rezervasyonlar yüklenirken hata oluştu');
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
    };
    const statusInfo = statusMap[status] || { bg: 'secondary', text: status };
    return <Badge bg={statusInfo.bg}>{statusInfo.text}</Badge>;
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Rezervasyonlar">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Rezervasyonlar">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Rezervasyon
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Rezervasyonlar yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Rezervasyon No</th>
              <th>Müşteri</th>
              <th>Araç</th>
              <th>Başlangıç</th>
              <th>Bitiş</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length > 0 ? (
              reservations.map((reservation, index) => (
                <tr key={reservation.id}>
                  <td>{index + 1}</td>
                  <td>{reservation.reservationNumber || reservation.id}</td>
                  <td>{reservation.customer?.name || '-'}</td>
                  <td>{reservation.vehicle?.model?.name || '-'}</td>
                  <td>{new Date(reservation.startDate).toLocaleDateString('tr-TR')}</td>
                  <td>{new Date(reservation.endDate).toLocaleDateString('tr-TR')}</td>
                  <td>{getStatusBadge(reservation.status)}</td>
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
                <td colSpan="8" className="text-center">
                  Rezervasyon bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

