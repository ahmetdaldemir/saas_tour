import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import MainCard from 'components/Card/MainCard';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';

// -----------------------|| DESTINATIONS ||-----------------------//
export default function Destinations() {
  const auth = useAuthStore();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [updatingActive, setUpdatingActive] = useState(null);
  const [updatingFeatured, setUpdatingFeatured] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkActivating, setBulkActivating] = useState(false);
  const [bulkDeactivating, setBulkDeactivating] = useState(false);

  useEffect(() => {
    // Wait for auth to initialize before loading destinations
    if (auth.initialized) {
      loadDestinations();
    }
  }, [auth.initialized, auth.tenant]);

  const loadDestinations = async () => {
    if (!auth.tenant) {
      console.warn('Tenant not found, cannot load destinations');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/destinations', {
        params: { tenantId: auth.tenant.id },
      });
      // Handle both { success: true, data: [...] } and direct array responses
      const data = response.data?.data || response.data;
      setDestinations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load destinations:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Destinasyonlar yüklenirken bir hata oluştu';
      console.error('Error details:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (dest) => {
    if (!dest.translations || dest.translations.length === 0) {
      return 'İsimsiz';
    }
    return dest.translations[0]?.name || 'İsimsiz';
  };

  const filteredDestinations = destinations.filter((dest) => {
    if (!searchQuery) return true;
    const displayName = getDisplayName(dest).toLowerCase();
    return displayName.includes(searchQuery.toLowerCase());
  });

  const toggleActive = async (id, value) => {
    setUpdatingActive(id);
    try {
      await api.patch(`/destinations/${id}`, { isActive: value });
      await loadDestinations();
    } catch (error) {
      console.error('Failed to update active status:', error);
    } finally {
      setUpdatingActive(null);
    }
  };

  const toggleFeatured = async (id, value) => {
    setUpdatingFeatured(id);
    try {
      await api.patch(`/destinations/${id}`, { isFeatured: value });
      await loadDestinations();
    } catch (error) {
      console.error('Failed to update featured status:', error);
    } finally {
      setUpdatingFeatured(null);
    }
  };

  const removeDestination = async (id) => {
    if (!window.confirm('Bu destinasyonu silmek istediğinizden emin misiniz?')) {
      return;
    }
    setRemoving(id);
    try {
      await api.delete(`/destinations/${id}`);
      await loadDestinations();
    } catch (error) {
      console.error('Failed to delete destination:', error);
    } finally {
      setRemoving(null);
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`${selectedDestinations.length} destinasyonu silmek istediğinizden emin misiniz?`)) {
      return;
    }
    setBulkDeleting(true);
    try {
      await Promise.all(selectedDestinations.map((id) => api.delete(`/destinations/${id}`)));
      setSelectedDestinations([]);
      await loadDestinations();
    } catch (error) {
      console.error('Failed to delete destinations:', error);
    } finally {
      setBulkDeleting(false);
    }
  };

  const bulkActivate = async () => {
    setBulkActivating(true);
    try {
      await Promise.all(selectedDestinations.map((id) => api.patch(`/destinations/${id}`, { isActive: true })));
      setSelectedDestinations([]);
      await loadDestinations();
    } catch (error) {
      console.error('Failed to activate destinations:', error);
    } finally {
      setBulkActivating(false);
    }
  };

  const bulkDeactivate = async () => {
    setBulkDeactivating(true);
    try {
      await Promise.all(selectedDestinations.map((id) => api.patch(`/destinations/${id}`, { isActive: false })));
      setSelectedDestinations([]);
      await loadDestinations();
    } catch (error) {
      console.error('Failed to deactivate destinations:', error);
    } finally {
      setBulkDeactivating(false);
    }
  };

  return (
    <Row>
      <Col md={12}>
        <MainCard title="Destinasyonlar">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2">
              {selectedDestinations.length > 0 && (
                <>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={bulkDeactivate}
                    disabled={bulkDeactivating}
                  >
                    {bulkDeactivating ? 'İşleniyor...' : `Pasif Yap (${selectedDestinations.length})`}
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={bulkActivate}
                    disabled={bulkActivating}
                  >
                    {bulkActivating ? 'İşleniyor...' : `Aktif Yap (${selectedDestinations.length})`}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={bulkDelete}
                    disabled={bulkDeleting}
                  >
                    {bulkDeleting ? 'Siliniyor...' : `Sil (${selectedDestinations.length})`}
                  </Button>
                </>
              )}
              <Button variant="primary" size="sm">
                Yeni Destinasyon
              </Button>
            </div>
          </div>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="feather icon-search" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Destinasyon ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>
                  <Form.Check
                    type="checkbox"
                    checked={selectedDestinations.length === filteredDestinations.length && filteredDestinations.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDestinations(filteredDestinations.map((d) => d.id));
                      } else {
                        setSelectedDestinations([]);
                      }
                    }}
                  />
                </th>
                <th>Adı</th>
                <th>Durum</th>
                <th>Öne Çıkan</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredDestinations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    {loading ? 'Yükleniyor...' : 'Henüz destinasyon bulunmuyor'}
                  </td>
                </tr>
              ) : (
                filteredDestinations.map((dest) => (
                  <tr key={dest.id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedDestinations.includes(dest.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDestinations([...selectedDestinations, dest.id]);
                          } else {
                            setSelectedDestinations(selectedDestinations.filter((id) => id !== dest.id));
                          }
                        }}
                      />
                    </td>
                    <td>{getDisplayName(dest)}</td>
                    <td>
                      <Form.Check
                        type="switch"
                        checked={dest.isActive}
                        disabled={updatingActive === dest.id}
                        onChange={(e) => toggleActive(dest.id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        checked={dest.isFeatured}
                        disabled={updatingFeatured === dest.id}
                        onChange={(e) => toggleFeatured(dest.id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <Button variant="link" size="sm">
                        Düzenle
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger"
                        disabled={removing === dest.id}
                        onClick={() => removeDestination(dest.id)}
                      >
                        {removing === dest.id ? 'Siliniyor...' : 'Sil'}
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

