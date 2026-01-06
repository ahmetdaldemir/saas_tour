import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function CrmPages() {
  const auth = useAuthStore();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchPages();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/crm/pages`);
      const data = response.data?.data || response.data || [];
      setPages(data);
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError(err.response?.data?.message || 'CRM sayfaları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="CRM Sayfaları">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="CRM Sayfaları">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Sayfa
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Sayfalar yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Sayfa Adı</th>
              <th>Slug</th>
              <th>Dil</th>
              <th>Durum</th>
              <th>Son Güncelleme</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {pages.length > 0 ? (
              pages.map((page, index) => (
                <tr key={page.id}>
                  <td>{index + 1}</td>
                  <td>{page.title || '-'}</td>
                  <td>{page.slug || '-'}</td>
                  <td>{page.languageCode?.toUpperCase() || '-'}</td>
                  <td>
                    <Badge bg={page.isActive ? 'success' : 'secondary'}>
                      {page.isActive ? 'Yayında' : 'Taslak'}
                    </Badge>
                  </td>
                  <td>{new Date(page.updatedAt).toLocaleDateString('tr-TR')}</td>
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
                  Sayfa bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

