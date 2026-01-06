import { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Alert, Card, Tab, Tabs } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Settings() {
  const auth = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState({
    tenantName: '',
    email: '',
    phone: '',
    address: '',
    currency: 'TRY',
    language: 'tr',
    timezone: 'Europe/Istanbul',
  });

  useEffect(() => {
    if (auth.initialized && auth.tenant) {
      setSettings({
        tenantName: auth.tenant.name || '',
        email: auth.tenant.email || '',
        phone: auth.tenant.phone || '',
        address: auth.tenant.address || '',
        currency: auth.tenant.currency || 'TRY',
        language: auth.tenant.defaultLanguage || 'tr',
        timezone: auth.tenant.timezone || 'Europe/Istanbul',
      });
    }
  }, [auth.initialized, auth.tenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await api.put(`/settings`, settings);
      setSuccess('Ayarlar başarıyla kaydedildi');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Ayarlar kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Ayarlar">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Ayarlar">
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="general" title="Genel Ayarlar">
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Firma Adı</Form.Label>
                  <Form.Control
                    type="text"
                    name="tenantName"
                    value={settings.tenantName}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" value={settings.email} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telefon</Form.Label>
                  <Form.Control type="text" name="phone" value={settings.phone} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Para Birimi</Form.Label>
                  <Form.Select name="currency" value={settings.currency} onChange={handleChange}>
                    <option value="TRY">TRY - Türk Lirası</option>
                    <option value="USD">USD - Amerikan Doları</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - İngiliz Sterlini</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Adres</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={settings.address}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Tab>

        <Tab eventKey="localization" title="Yerelleştirme">
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Varsayılan Dil</Form.Label>
                  <Form.Select name="language" value={settings.language} onChange={handleChange}>
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Zaman Dilimi</Form.Label>
                  <Form.Select name="timezone" value={settings.timezone} onChange={handleChange}>
                    <option value="Europe/Istanbul">Europe/Istanbul</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Berlin">Europe/Berlin</option>
                    <option value="America/New_York">America/New_York</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Tab>

        <Tab eventKey="features" title="Özellikler">
          <Alert variant="info">
            Özellik yönetimi için destek ekibiyle iletişime geçin.
          </Alert>
          <Card className="mb-2">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Araç Takip</strong>
                <p className="mb-0 text-muted small">GPS tabanlı araç takip sistemi</p>
              </div>
              <Form.Check
                type="switch"
                checked={auth.tenant?.features?.includes('vehicleTracking')}
                disabled
              />
            </Card.Body>
          </Card>
          <Card className="mb-2">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Ön Muhasebe</strong>
                <p className="mb-0 text-muted small">Gelir-gider takibi ve raporlama</p>
              </div>
              <Form.Check type="switch" checked={auth.tenant?.features?.includes('finance')} disabled />
            </Card.Body>
          </Card>
          <Card className="mb-2">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Chat / Agency</strong>
                <p className="mb-0 text-muted small">Müşteri iletişim sistemi</p>
              </div>
              <Form.Check type="switch" checked={auth.tenant?.features?.includes('chat')} disabled />
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <div className="text-end">
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </MainCard>
  );
}

