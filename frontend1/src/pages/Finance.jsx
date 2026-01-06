import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import { useFeaturesStore } from '../stores/features';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Finance() {
  const auth = useAuthStore();
  const features = useFeaturesStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id && features.hasFeature('finance')) {
      fetchFinanceData();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/finance/transactions`);
      const data = response.data?.data || response.data || [];
      setTransactions(data);

      // Calculate summary
      const income = data.filter((t) => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
      const expense = data.filter((t) => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
      setSummary({ income, expense, balance: income - expense });
    } catch (err) {
      console.error('Error fetching finance data:', err);
      setError(err.response?.data?.message || 'Finans verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!features.hasFeature('finance')) {
    return (
      <MainCard title="Ön Muhasebe">
        <Alert variant="warning">
          Ön Muhasebe özelliği kullanılamıyor. Lütfen bu özelliği aktif etmek için destek ekibiyle iletişime geçin.
        </Alert>
      </MainCard>
    );
  }

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Ön Muhasebe">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <>
      <Row className="mb-3">
        <Col md={4}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <h5>Gelir</h5>
              <h3>{summary.income.toLocaleString('tr-TR')} TRY</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center bg-danger text-white">
            <Card.Body>
              <h5>Gider</h5>
              <h3>{summary.expense.toLocaleString('tr-TR')} TRY</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center bg-info text-white">
            <Card.Body>
              <h5>Bakiye</h5>
              <h3>{summary.balance.toLocaleString('tr-TR')} TRY</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <MainCard title="Son İşlemler">
        <Row className="mb-3">
          <Col>
            <Button variant="success" size="sm" className="me-2">
              <i className="fas fa-plus me-1"></i> Gelir Ekle
            </Button>
            <Button variant="danger" size="sm">
              <i className="fas fa-minus me-1"></i> Gider Ekle
            </Button>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <Alert variant="info">İşlemler yükleniyor...</Alert>
        ) : (
          <Table responsive hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th>Kategori</th>
                <th>Tip</th>
                <th>Tutar</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <tr key={transaction.id}>
                    <td>{index + 1}</td>
                    <td>{new Date(transaction.date).toLocaleDateString('tr-TR')}</td>
                    <td>{transaction.description || '-'}</td>
                    <td>{transaction.category || '-'}</td>
                    <td>
                      <Badge bg={transaction.type === 'income' ? 'success' : 'danger'}>
                        {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                      </Badge>
                    </td>
                    <td>{transaction.amount?.toLocaleString('tr-TR')} TRY</td>
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
                  <td colSpan="7" className="text-center">
                    İşlem kaydı bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </MainCard>
    </>
  );
}

