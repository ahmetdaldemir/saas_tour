import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import MainCard from 'components/Card/MainCard';
import api from '../services/api';

// -----------------------|| LANGUAGES ||-----------------------//
export default function Languages() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    isActive: true,
    isDefault: false,
  });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [settingDefault, setSettingDefault] = useState(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading languages from:', api.defaults.baseURL + '/languages');
      const response = await api.get('/languages');
      console.log('Languages response:', response);
      // Handle both direct array and { data: [...] } response formats
      const data = response.data?.data || response.data;
      setLanguages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load languages:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        config: error.config,
      });
      const errorMessage = error.response?.data?.message || error.message || 'Diller yüklenirken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/languages', form);
      setForm({ code: '', name: '', isActive: true, isDefault: false });
      await loadLanguages();
    } catch (error) {
      setError(error.response?.data?.message || 'Dil eklenirken bir hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (language) => {
    setToggling(language.id);
    try {
      await api.patch(`/languages/${language.id}`, { isActive: !language.isActive });
      await loadLanguages();
    } catch (error) {
      setError(error.response?.data?.message || 'Durum güncellenirken bir hata oluştu');
    } finally {
      setToggling(null);
    }
  };

  const removeLanguage = async (id) => {
    if (!window.confirm('Bu dili silmek istediğinizden emin misiniz?')) {
      return;
    }
    setRemoving(id);
    try {
      await api.delete(`/languages/${id}`);
      await loadLanguages();
    } catch (error) {
      setError(error.response?.data?.message || 'Dil silinirken bir hata oluştu');
    } finally {
      setRemoving(null);
    }
  };

  const setAsDefault = async (id) => {
    setSettingDefault(id);
    try {
      await api.post(`/languages/${id}/set-default`);
      await loadLanguages();
    } catch (error) {
      setError(error.response?.data?.message || 'Varsayılan dil ayarlanamadı');
    } finally {
      setSettingDefault(null);
    }
  };

  return (
    <Row>
      <Col md={5}>
        <MainCard title="Yeni Dil Ekle">
          <Form onSubmit={handleCreate}>
            <Form.Group className="mb-3">
              <Form.Label>Dil Kodu</Form.Label>
              <Form.Control
                type="text"
                placeholder="en"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dil Adı</Form.Label>
              <Form.Control
                type="text"
                placeholder="İngilizce"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Check
              type="switch"
              label="Aktif"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="mb-3"
            />
            <Form.Check
              type="switch"
              label="Varsayılan Dil"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="mb-3"
            />
            <Button variant="primary" type="submit" disabled={creating}>
              {creating ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Form>
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </MainCard>
      </Col>
      <Col md={7}>
        <MainCard title="Diller">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Kod</th>
                <th>Adı</th>
                <th>Durum</th>
                <th>Varsayılan</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {languages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Henüz dil bulunmuyor
                  </td>
                </tr>
              ) : (
                languages.map((lang) => (
                  <tr key={lang.id}>
                    <td>{lang.code}</td>
                    <td>{lang.name}</td>
                    <td>
                      <span className={`badge ${lang.isActive ? 'bg-success' : 'bg-warning'}`}>
                        {lang.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td>
                      {lang.isDefault && <span className="badge bg-primary">Varsayılan</span>}
                    </td>
                    <td>
                      {!lang.isDefault && (
                        <Button
                          variant="link"
                          size="sm"
                          disabled={settingDefault === lang.id}
                          onClick={() => setAsDefault(lang.id)}
                        >
                          {settingDefault === lang.id ? 'Ayarlanıyor...' : 'Varsayılan Yap'}
                        </Button>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        disabled={toggling === lang.id}
                        onClick={() => toggleActive(lang)}
                      >
                        {toggling === lang.id ? 'Güncelleniyor...' : lang.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger"
                        disabled={removing === lang.id}
                        onClick={() => removeLanguage(lang.id)}
                      >
                        {removing === lang.id ? 'Siliniyor...' : 'Sil'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </MainCard>
      </Col>
    </Row>
  );
}

