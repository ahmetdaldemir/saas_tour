import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Coupons() {
  const auth = useAuthStore();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchCoupons();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/coupons`);
      const data = response.data?.data || response.data || [];
      setCoupons(data);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError(err.response?.data?.message || 'Kuponlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Kuponlar">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Kuponlar">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Kupon
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Kuponlar yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Kupon Kodu</th>
              <th>İndirim</th>
              <th>Kullanım Sayısı</th>
              <th>Max Kullanım</th>
              <th>Son Kullanım</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length > 0 ? (
              coupons.map((coupon, index) => (
                <tr key={coupon.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{coupon.code || '-'}</strong>
                  </td>
                  <td>
                    {coupon.discountType === 'percentage' ? `%${coupon.discountValue}` : `${coupon.discountValue} TRY`}
                  </td>
                  <td>{coupon.usageCount || 0}</td>
                  <td>{coupon.maxUsage || '∞'}</td>
                  <td>{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString('tr-TR') : '-'}</td>
                  <td>
                    <Badge bg={coupon.isActive ? 'success' : 'secondary'}>
                      {coupon.isActive ? 'Aktif' : 'Pasif'}
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
                  Kupon bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

