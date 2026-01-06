import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Contracts() {
  const auth = useAuthStore();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchContracts();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/contracts`);
      const data = response.data?.data || response.data || [];
      setContracts(data);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError(err.response?.data?.message || 'Sözleşmeler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Sözleşmeler">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Sözleşmeler">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Sözleşme
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Sözleşmeler yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Sözleşme Adı</th>
              <th>Tip</th>
              <th>Dil</th>
              <th>Durum</th>
              <th>Son Güncelleme</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length > 0 ? (
              contracts.map((contract, index) => (
                <tr key={contract.id}>
                  <td>{index + 1}</td>
                  <td>{contract.name || '-'}</td>
                  <td>{contract.type || '-'}</td>
                  <td>{contract.languageCode?.toUpperCase() || '-'}</td>
                  <td>
                    <Badge bg={contract.isActive ? 'success' : 'secondary'}>
                      {contract.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td>{new Date(contract.updatedAt).toLocaleDateString('tr-TR')}</td>
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
                  Sözleşme bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

