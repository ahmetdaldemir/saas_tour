import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Surveys() {
  const auth = useAuthStore();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchSurveys();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/surveys`);
      const data = response.data?.data || response.data || [];
      setSurveys(data);
    } catch (err) {
      console.error('Error fetching surveys:', err);
      setError(err.response?.data?.message || 'Anketler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Anketler">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Anketler">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Anket
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Anketler yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Anket Adı</th>
              <th>Soru Sayısı</th>
              <th>Katılımcı Sayısı</th>
              <th>Başlangıç</th>
              <th>Bitiş</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {surveys.length > 0 ? (
              surveys.map((survey, index) => (
                <tr key={survey.id}>
                  <td>{index + 1}</td>
                  <td>{survey.title || '-'}</td>
                  <td>{survey.questionCount || 0}</td>
                  <td>{survey.responseCount || 0}</td>
                  <td>{new Date(survey.startDate).toLocaleDateString('tr-TR')}</td>
                  <td>{survey.endDate ? new Date(survey.endDate).toLocaleDateString('tr-TR') : 'Süresiz'}</td>
                  <td>
                    <Badge bg={survey.isActive ? 'success' : 'secondary'}>
                      {survey.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="info" size="sm" className="me-1">
                      <i className="fas fa-chart-bar"></i> Sonuçlar
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
                  Anket bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

