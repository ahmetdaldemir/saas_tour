import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import MainCard from 'components/Card/MainCard';
import api from '../services/api';

// -----------------------|| COUNTRIES ||-----------------------//
export default function Countries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    phoneCode: '',
    flag: '',
    isActive: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);

  useEffect(() => {
    loadCountries();
  }, [activeOnly]);

  const loadCountries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = activeOnly ? { isActive: true } : {};
      const response = await api.get('/countries', { params });
      // Handle both direct array and { data: [...] } response formats
      const data = response.data?.data || response.data;
      setCountries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load countries:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ülkeler yüklenirken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (editingCountry) {
        await api.put(`/countries/${editingCountry.id}`, form);
        setSuccess('Ülke güncellendi');
      } else {
        await api.post('/countries', form);
        setSuccess('Ülke eklendi');
      }
      setForm({ name: '', code: '', phoneCode: '', flag: '', isActive: true });
      setEditingCountry(null);
      await loadCountries();
    } catch (error) {
      setError(error.response?.data?.message || 'Ülke kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (country) => {
    setEditingCountry(country);
    setForm({
      name: country.name,
      code: country.code,
      phoneCode: country.phoneCode || '',
      flag: country.flag || '',
      isActive: country.isActive,
    });
  };

  const toggleActive = async (country) => {
    setToggling(country.id);
    try {
      await api.patch(`/countries/${country.id}`, { isActive: !country.isActive });
      await loadCountries();
    } catch (error) {
      setError(error.response?.data?.message || 'Durum güncellenirken bir hata oluştu');
    } finally {
      setToggling(null);
    }
  };

  const removeCountry = async (id) => {
    if (!window.confirm('Bu ülkeyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    setRemoving(id);
    try {
      await api.delete(`/countries/${id}`);
      await loadCountries();
    } catch (error) {
      setError(error.response?.data?.message || 'Ülke silinirken bir hata oluştu');
    } finally {
      setRemoving(null);
    }
  };

  const syncCountries = async () => {
    setSyncing(true);
    try {
      await api.post('/countries/sync');
      setSuccess('Ülkeler senkronize edildi');
      await loadCountries();
    } catch (error) {
      setError(error.response?.data?.message || 'Senkronizasyon sırasında bir hata oluştu');
    } finally {
      setSyncing(false);
    }
  };

  const cancelEdit = () => {
    setEditingCountry(null);
    setForm({ name: '', code: '', phoneCode: '', flag: '', isActive: true });
  };

  return (
    <Row>
      <Col md={5}>
        <MainCard title={editingCountry ? 'Ülke Düzenle' : 'Yeni Ülke Ekle'}>
          <Form onSubmit={handleSave}>
            <Form.Group className="mb-3">
              <Form.Label>Ülke Adı</Form.Label>
              <Form.Control
                type="text"
                placeholder="Türkiye"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ülke Kodu</Form.Label>
              <Form.Control
                type="text"
                placeholder="TR"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                maxLength={2}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telefon Kodu</Form.Label>
              <Form.Control
                type="text"
                placeholder="+90"
                value={form.phoneCode}
                onChange={(e) => setForm({ ...form, phoneCode: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Bayrak (Emoji veya URL)</Form.Label>
              <Form.Control
                type="text"
                placeholder="🇹🇷"
                value={form.flag}
                onChange={(e) => setForm({ ...form, flag: e.target.value })}
              />
            </Form.Group>
            <Form.Check
              type="switch"
              label="Aktif"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="mb-3"
            />
            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Kaydediliyor...' : editingCountry ? 'Güncelle' : 'Kaydet'}
              </Button>
              {editingCountry && (
                <Button variant="outline-secondary" onClick={cancelEdit}>
                  İptal
                </Button>
              )}
            </div>
          </Form>
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </MainCard>
      </Col>
      <Col md={7}>
        <MainCard title="Ülkeler">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Check
              type="switch"
              label="Sadece Aktifler"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={syncCountries} disabled={syncing}>
                {syncing ? 'Senkronize Ediliyor...' : 'Senkronize Et'}
              </Button>
              <Button variant="link" size="sm" onClick={loadCountries} disabled={loading}>
                <i className="feather icon-refresh-cw" />
              </Button>
            </div>
          </div>
          {success && <Alert variant="success" className="mb-3">{success}</Alert>}
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Bayrak</th>
                <th>Kod</th>
                <th>Adı</th>
                <th>Telefon Kodu</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {countries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Henüz ülke bulunmuyor
                  </td>
                </tr>
              ) : (
                countries.map((country) => (
                  <tr key={country.id}>
                    <td>{country.flag || '-'}</td>
                    <td>
                      <span className="badge bg-primary">{country.code}</span>
                    </td>
                    <td>{country.name}</td>
                    <td>{country.phoneCode}</td>
                    <td>
                      <span className={`badge ${country.isActive ? 'bg-success' : 'bg-warning'}`}>
                        {country.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td>
                      <Button variant="link" size="sm" onClick={() => startEdit(country)}>
                        Düzenle
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        disabled={toggling === country.id}
                        onClick={() => toggleActive(country)}
                      >
                        {toggling === country.id ? 'Güncelleniyor...' : country.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger"
                        disabled={removing === country.id}
                        onClick={() => removeCountry(country.id)}
                      >
                        {removing === country.id ? 'Siliniyor...' : 'Sil'}
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

