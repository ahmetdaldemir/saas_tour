import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert, Form } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import { useFeaturesStore } from '../stores/features';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Trips() {
  const auth = useAuthStore();
  const features = useFeaturesStore();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id && features.hasFeature('vehicleTracking')) {
      fetchTrips();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/trips`);
      const data = response.data?.data || response.data || [];
      setTrips(data);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err.response?.data?.message || 'Araç takip verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!features.hasFeature('vehicleTracking')) {
    return (
      <MainCard title="Araç Takip">
        <Alert variant="warning">
          Araç takip özelliği kullanılamıyor. Lütfen bu özelliği aktif etmek için destek ekibiyle iletişime geçin.
        </Alert>
      </MainCard>
    );
  }

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Araç Takip">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Araç Takip">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-map me-1"></i> Haritada Göster
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Araç takip verileri yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Araç</th>
              <th>Plaka</th>
              <th>Sürücü</th>
              <th>Son Konum</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {trips.length > 0 ? (
              trips.map((trip, index) => (
                <tr key={trip.id}>
                  <td>{index + 1}</td>
                  <td>{trip.vehicle?.model?.name || '-'}</td>
                  <td>{trip.vehicle?.plateNumber || '-'}</td>
                  <td>{trip.driver?.name || '-'}</td>
                  <td>{trip.lastLocation || '-'}</td>
                  <td>
                    <Badge bg={trip.isActive ? 'success' : 'secondary'}>
                      {trip.isActive ? 'Aktif' : 'Tamamlandı'}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="info" size="sm">
                      <i className="fas fa-map-marker-alt"></i> Harita
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  Araç takip kaydı bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

