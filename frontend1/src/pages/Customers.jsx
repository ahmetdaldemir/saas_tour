import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert, Form, InputGroup } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Customers() {
  const auth = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchCustomers();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/customers`);
      const data = response.data?.data || response.data || [];
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.message || 'Müşteriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Müşteriler">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Müşteriler">
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="fas fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Müşteri ara (isim, email, telefon)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6} className="text-end">
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Müşteri
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Müşteriler yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Ad Soyad</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Rezervasyon Sayısı</th>
              <th>Son Rezervasyon</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer, index) => (
                <tr key={customer.id}>
                  <td>{index + 1}</td>
                  <td>{customer.name || '-'}</td>
                  <td>{customer.email || '-'}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.reservationCount || 0}</td>
                  <td>
                    {customer.lastReservationDate
                      ? new Date(customer.lastReservationDate).toLocaleDateString('tr-TR')
                      : '-'}
                  </td>
                  <td>
                    <Badge bg={customer.isActive ? 'success' : 'secondary'}>
                      {customer.isActive ? 'Aktif' : 'Pasif'}
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
                <td colSpan="8" className="text-center">
                  {searchTerm ? 'Arama sonucu bulunamadı' : 'Müşteri bulunamadı'}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

