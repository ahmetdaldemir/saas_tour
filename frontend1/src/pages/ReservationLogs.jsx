import { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Badge, Alert, Form } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function ReservationLogs() {
  const auth = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchLogs();
    }
  }, [auth.initialized, auth.tenant, filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filter !== 'all' ? { action: filter } : {};
      const response = await api.get(`/reservation-logs`, { params });
      const data = response.data?.data || response.data || [];
      setLogs(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.response?.data?.message || 'Loglar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const actionMap = {
      created: { bg: 'success', text: 'Oluşturuldu' },
      updated: { bg: 'info', text: 'Güncellendi' },
      cancelled: { bg: 'danger', text: 'İptal Edildi' },
      confirmed: { bg: 'primary', text: 'Onaylandı' },
    };
    const actionInfo = actionMap[action] || { bg: 'secondary', text: action };
    return <Badge bg={actionInfo.bg}>{actionInfo.text}</Badge>;
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Rezervasyon Logları">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Rezervasyon Logları">
      <Row className="mb-3">
        <Col md={4}>
          <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tüm İşlemler</option>
            <option value="created">Oluşturulan</option>
            <option value="updated">Güncellenen</option>
            <option value="cancelled">İptal Edilen</option>
            <option value="confirmed">Onaylanan</option>
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Alert variant="info">Loglar yükleniyor...</Alert>
      ) : (
        <Table responsive hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Tarih/Saat</th>
              <th>Rezervasyon</th>
              <th>İşlem</th>
              <th>Kullanıcı</th>
              <th>Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr key={log.id}>
                  <td>{index + 1}</td>
                  <td>{new Date(log.createdAt).toLocaleString('tr-TR')}</td>
                  <td>{log.reservation?.reservationNumber || '-'}</td>
                  <td>{getActionBadge(log.action)}</td>
                  <td>{log.user?.name || '-'}</td>
                  <td>{log.description || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  Log kaydı bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </MainCard>
  );
}

