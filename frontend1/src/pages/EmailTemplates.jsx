import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function EmailTemplates() {
  const auth = useAuthStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchTemplates();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/email-templates`);
      const data = response.data?.data || response.data || [];
      setTemplates(data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err.response?.data?.message || 'Mail şablonları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Mail Şablonları">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Mail Şablonları">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Şablon
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Mail şablonları yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Şablon Adı</th>
              <th>Konu</th>
              <th>Dil</th>
              <th>Tip</th>
              <th>Son Güncelleme</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {templates.length > 0 ? (
              templates.map((template, index) => (
                <tr key={template.id}>
                  <td>{index + 1}</td>
                  <td>{template.name || '-'}</td>
                  <td>{template.subject || '-'}</td>
                  <td>{template.languageCode?.toUpperCase() || '-'}</td>
                  <td>
                    <Badge bg="info">{template.type || '-'}</Badge>
                  </td>
                  <td>{new Date(template.updatedAt).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <Badge bg={template.isActive ? 'success' : 'secondary'}>
                      {template.isActive ? 'Aktif' : 'Pasif'}
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
                  Mail şablonu bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

