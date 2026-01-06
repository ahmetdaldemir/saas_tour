import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Marketplace() {
  const auth = useAuthStore();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchListings();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/marketplace/listings`);
      const data = response.data?.data || response.data || [];
      setListings(data);
    } catch (err) {
      console.error('Error fetching marketplace listings:', err);
      setError(err.response?.data?.message || 'Marketplace verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Marketplace">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Marketplace">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni İlan Ekle
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Marketplace verileri yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>İlan Başlığı</th>
              <th>Araç</th>
              <th>Fiyat</th>
              <th>Platform</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {listings.length > 0 ? (
              listings.map((listing, index) => (
                <tr key={listing.id}>
                  <td>{index + 1}</td>
                  <td>{listing.title || '-'}</td>
                  <td>{listing.vehicle?.model?.name || '-'}</td>
                  <td>{listing.price ? `${listing.price} ${listing.currency || 'TRY'}` : '-'}</td>
                  <td>{listing.platform || '-'}</td>
                  <td>
                    <Badge bg={listing.isActive ? 'success' : 'secondary'}>
                      {listing.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="info" size="sm" className="me-1">
                      <i className="fas fa-eye"></i>
                    </Button>
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
                <td colSpan="7" className="text-center">
                  İlan bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

