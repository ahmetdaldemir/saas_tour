import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Campaigns() {
  const auth = useAuthStore();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchCampaigns();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/campaigns`);
      const data = response.data?.data || response.data || [];
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err.response?.data?.message || 'Kampanyalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Kampanyalar">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Kampanyalar">
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm">
            <i className="fas fa-plus me-1"></i> Yeni Kampanya
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Kampanyalar yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Kampanya Adı</th>
              <th>İndirim (%)</th>
              <th>Başlangıç</th>
              <th>Bitiş</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length > 0 ? (
              campaigns.map((campaign, index) => (
                <tr key={campaign.id}>
                  <td>{index + 1}</td>
                  <td>{campaign.name || '-'}</td>
                  <td>{campaign.discountPercentage || campaign.discountAmount || '-'}</td>
                  <td>{new Date(campaign.startDate).toLocaleDateString('tr-TR')}</td>
                  <td>{new Date(campaign.endDate).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <Badge bg={campaign.isActive ? 'success' : 'secondary'}>
                      {campaign.isActive ? 'Aktif' : 'Pasif'}
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
                  Kampanya bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

