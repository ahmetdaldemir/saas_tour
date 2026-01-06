import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert, Form } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function MasterLocations() {
  const auth = useAuthStore();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchLocations();
    }
  }, [auth.initialized, auth.tenant, filterType]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filterType !== 'all' ? { type: filterType } : {};
      const response = await api.get(`/master-locations`, { params });
      const data = response.data?.data || response.data || [];
      setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err.response?.data?.message || 'Lokasyonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      merkez: { bg: 'primary', text: 'Merkez' },
      otel: { bg: 'success', text: 'Otel' },
      havalimani: { bg: 'info', text: 'Havalimanı' },
      adres: { bg: 'secondary', text: 'Adres' },
    };
    const typeInfo = typeMap[type] || { bg: 'secondary', text: type };
    return <Badge bg={typeInfo.bg}>{typeInfo.text}</Badge>;
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Master Lokasyonlar">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Master Lokasyonlar">
      <Row className="mb-3">
        <Col md={4}>
          <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tüm Lokasyonlar</option>
            <option value="merkez">Merkez</option>
            <option value="otel">Otel</option>
            <option value="havalimani">Havalimanı</option>
            <option value="adres">Adres</option>
          </Form.Select>
        </Col>
        <Col md={8} className="text-end">
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Lokasyon
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Lokasyonlar yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Lokasyon Adı</th>
              <th>Tip</th>
              <th>Şehir</th>
              <th>Ülke</th>
              <th>Koordinatlar</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {locations.length > 0 ? (
              locations.map((location, index) => (
                <tr key={location.id}>
                  <td>{index + 1}</td>
                  <td>{location.name || '-'}</td>
                  <td>{getTypeBadge(location.type)}</td>
                  <td>{location.city || '-'}</td>
                  <td>{location.country || '-'}</td>
                  <td>
                    {location.latitude && location.longitude
                      ? `${location.latitude}, ${location.longitude}`
                      : '-'}
                  </td>
                  <td>
                    <Badge bg={location.isActive ? 'success' : 'secondary'}>
                      {location.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="warning" size="sm" className="me-1">
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button variant="danger" size="sm">
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center">
                  {filterType !== 'all' ? 'Filtreye uygun lokasyon bulunamadı' : 'Lokasyon bulunamadı'}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

