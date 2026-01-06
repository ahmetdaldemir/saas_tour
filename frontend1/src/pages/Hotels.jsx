import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import MainCard from 'components/Card/MainCard';
import api from '../services/api';

// -----------------------|| HOTELS ||-----------------------//
export default function Hotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [form, setForm] = useState({
    name: '',
    starRating: 0,
    destinationId: '',
    address: '',
    city: '',
    country: '',
    locationUrl: '',
  });

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await api.get('/hotels', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Handle both direct array and { data: [...] } response formats
      const data = response.data?.data || response.data;
      setHotels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load hotels:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Oteller yüklenirken bir hata oluştu';
      console.error('Error details:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeHotel = async (id) => {
    if (!window.confirm('Bu oteli silmek istediğinizden emin misiniz?')) {
      return;
    }
    setRemoving(id);
    try {
      await api.delete(`/hotels/${id}`);
      await loadHotels();
    } catch (error) {
      console.error('Failed to delete hotel:', error);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Row>
      <Col md={12}>
        <MainCard title="Oteller">
          <div className="d-flex justify-content-end mb-3">
            <Button variant="primary" size="sm" onClick={() => setShowDialog(true)}>
              Yeni Otel
            </Button>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Adı</th>
                <th>Destinasyon</th>
                <th>Lokasyon</th>
                <th>Yıldız</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {hotels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    {loading ? 'Yükleniyor...' : 'Henüz otel bulunmuyor'}
                  </td>
                </tr>
              ) : (
                hotels.map((hotel) => (
                  <tr key={hotel.id}>
                    <td>{hotel.name}</td>
                    <td>{hotel.destination?.name || '-'}</td>
                    <td>
                      {hotel.city}, {hotel.country}
                    </td>
                    <td>
                      <span className="badge bg-warning">
                        {hotel.starRating} ⭐
                      </span>
                    </td>
                    <td>
                      <Button variant="link" size="sm">
                        Düzenle
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger"
                        disabled={removing === hotel.id}
                        onClick={() => removeHotel(hotel.id)}
                      >
                        {removing === hotel.id ? 'Siliniyor...' : 'Sil'}
                      </Button>
                      {hotel.locationUrl && (
                        <Button variant="link" size="sm" href={hotel.locationUrl} target="_blank" rel="noopener noreferrer">
                          Haritada Gör
                        </Button>
                      )}
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

