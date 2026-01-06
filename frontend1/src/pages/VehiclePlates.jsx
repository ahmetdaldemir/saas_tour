import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Table, Button, Alert, Modal, Form, Badge } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function VehiclePlates() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const { vehicleId } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [plates, setPlates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlate, setEditingPlate] = useState(null);

  const [formData, setFormData] = useState({
    plateNumber: '',
    registrationDate: '',
    documentNumber: '',
    serialNumber: '',
    km: '',
    oilKm: '',
    description: '',
    comprehensiveInsuranceCompany: '',
    comprehensiveInsuranceStart: '',
    comprehensiveInsuranceEnd: '',
    trafficInsuranceCompany: '',
    trafficInsuranceStart: '',
    trafficInsuranceEnd: '',
    inspectionCompany: '',
    inspectionStart: '',
    inspectionEnd: '',
    exhaustInspectionCompany: '',
    exhaustInspectionStart: '',
    exhaustInspectionEnd: '',
    isActive: true,
  });

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id && vehicleId) {
      fetchVehicleAndPlates();
    }
  }, [auth.initialized, auth.tenant, vehicleId]);

  const fetchVehicleAndPlates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/rentacar/vehicles/${vehicleId}`);
      const data = response.data?.data || response.data;
      setVehicle(data);
      setPlates(data.plates || []);
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      setError(err.response?.data?.message || 'Araç bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plate = null) => {
    if (plate) {
      setEditingPlate(plate);
      setFormData({
        plateNumber: plate.plateNumber || '',
        registrationDate: plate.registrationDate ? plate.registrationDate.split('T')[0] : '',
        documentNumber: plate.documentNumber || '',
        serialNumber: plate.serialNumber || '',
        km: plate.km || '',
        oilKm: plate.oilKm || '',
        description: plate.description || '',
        comprehensiveInsuranceCompany: plate.comprehensiveInsuranceCompany || '',
        comprehensiveInsuranceStart: plate.comprehensiveInsuranceStart
          ? plate.comprehensiveInsuranceStart.split('T')[0]
          : '',
        comprehensiveInsuranceEnd: plate.comprehensiveInsuranceEnd
          ? plate.comprehensiveInsuranceEnd.split('T')[0]
          : '',
        trafficInsuranceCompany: plate.trafficInsuranceCompany || '',
        trafficInsuranceStart: plate.trafficInsuranceStart ? plate.trafficInsuranceStart.split('T')[0] : '',
        trafficInsuranceEnd: plate.trafficInsuranceEnd ? plate.trafficInsuranceEnd.split('T')[0] : '',
        inspectionCompany: plate.inspectionCompany || '',
        inspectionStart: plate.inspectionStart ? plate.inspectionStart.split('T')[0] : '',
        inspectionEnd: plate.inspectionEnd ? plate.inspectionEnd.split('T')[0] : '',
        exhaustInspectionCompany: plate.exhaustInspectionCompany || '',
        exhaustInspectionStart: plate.exhaustInspectionStart ? plate.exhaustInspectionStart.split('T')[0] : '',
        exhaustInspectionEnd: plate.exhaustInspectionEnd ? plate.exhaustInspectionEnd.split('T')[0] : '',
        isActive: plate.isActive !== undefined ? plate.isActive : true,
      });
    } else {
      setEditingPlate(null);
      setFormData({
        plateNumber: '',
        registrationDate: '',
        documentNumber: '',
        serialNumber: '',
        km: '',
        oilKm: '',
        description: '',
        comprehensiveInsuranceCompany: '',
        comprehensiveInsuranceStart: '',
        comprehensiveInsuranceEnd: '',
        trafficInsuranceCompany: '',
        trafficInsuranceStart: '',
        trafficInsuranceEnd: '',
        inspectionCompany: '',
        inspectionStart: '',
        inspectionEnd: '',
        exhaustInspectionCompany: '',
        exhaustInspectionStart: '',
        exhaustInspectionEnd: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlate(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        ...formData,
        vehicleId,
        km: formData.km ? parseInt(formData.km) : null,
        oilKm: formData.oilKm ? parseInt(formData.oilKm) : null,
        registrationDate: formData.registrationDate || null,
        comprehensiveInsuranceStart: formData.comprehensiveInsuranceStart || null,
        comprehensiveInsuranceEnd: formData.comprehensiveInsuranceEnd || null,
        trafficInsuranceStart: formData.trafficInsuranceStart || null,
        trafficInsuranceEnd: formData.trafficInsuranceEnd || null,
        inspectionStart: formData.inspectionStart || null,
        inspectionEnd: formData.inspectionEnd || null,
        exhaustInspectionStart: formData.exhaustInspectionStart || null,
        exhaustInspectionEnd: formData.exhaustInspectionEnd || null,
      };

      if (editingPlate) {
        await api.put(`/rentacar/plates/${editingPlate.id}`, payload);
      } else {
        await api.post(`/rentacar/plates`, payload);
      }

      handleCloseModal();
      fetchVehicleAndPlates();
    } catch (err) {
      console.error('Error saving plate:', err);
      setError(err.response?.data?.message || 'Plaka kaydedilirken hata oluştu');
    }
  };

  const handleDelete = async (plateId) => {
    if (!window.confirm('Bu plakayı silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/rentacar/plates/${plateId}`);
      setPlates(plates.filter((p) => p.id !== plateId));
    } catch (err) {
      console.error('Error deleting plate:', err);
      alert(err.response?.data?.message || 'Plaka silinirken hata oluştu');
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Plaka Yönetimi">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  if (loading) {
    return (
      <MainCard title="Plaka Yönetimi">
        <Alert variant="info">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  if (!vehicle) {
    return (
      <MainCard title="Plaka Yönetimi">
        <Alert variant="danger">Araç bulunamadı</Alert>
        <Button variant="secondary" onClick={() => navigate('/app/rentacar')}>
          Araçlara Dön
        </Button>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={
        <div className="d-flex justify-content-between align-items-center">
          <span>
            Plaka Yönetimi - {vehicle.name} ({vehicle.brandName} {vehicle.modelName})
          </span>
          <Button variant="secondary" size="sm" onClick={() => navigate('/app/rentacar')}>
            Araçlara Dön
          </Button>
        </div>
      }
    >
      <Row className="mb-3">
        <Col>
          <Button variant="primary" size="sm" onClick={() => handleOpenModal()}>
            <i className="fas fa-plus me-1"></i> Yeni Plaka Ekle
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table responsive hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Plaka No</th>
            <th>KM</th>
            <th>Yağ KM</th>
            <th>Ruhsat Tarihi</th>
            <th>Kasko Bitiş</th>
            <th>Trafik Sig. Bitiş</th>
            <th>Muayene Bitiş</th>
            <th>Durum</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {plates.length > 0 ? (
            plates.map((plate, index) => (
              <tr key={plate.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{plate.plateNumber}</strong>
                </td>
                <td>{plate.km ? `${plate.km.toLocaleString('tr-TR')} km` : '-'}</td>
                <td>{plate.oilKm ? `${plate.oilKm.toLocaleString('tr-TR')} km` : '-'}</td>
                <td>
                  {plate.registrationDate ? new Date(plate.registrationDate).toLocaleDateString('tr-TR') : '-'}
                </td>
                <td>
                  {plate.comprehensiveInsuranceEnd ? (
                    <span
                      className={
                        new Date(plate.comprehensiveInsuranceEnd) < new Date() ? 'text-danger' : ''
                      }
                    >
                      {new Date(plate.comprehensiveInsuranceEnd).toLocaleDateString('tr-TR')}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {plate.trafficInsuranceEnd ? (
                    <span
                      className={new Date(plate.trafficInsuranceEnd) < new Date() ? 'text-danger' : ''}
                    >
                      {new Date(plate.trafficInsuranceEnd).toLocaleDateString('tr-TR')}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {plate.inspectionEnd ? (
                    <span className={new Date(plate.inspectionEnd) < new Date() ? 'text-danger' : ''}>
                      {new Date(plate.inspectionEnd).toLocaleDateString('tr-TR')}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <Badge bg={plate.isActive ? 'success' : 'secondary'}>
                    {plate.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                </td>
                <td>
                  <Button variant="warning" size="sm" className="me-1" onClick={() => handleOpenModal(plate)}>
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(plate.id)}>
                    <i className="fas fa-trash"></i>
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" className="text-center">
                Plaka bulunamadı
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Plaka Ekle/Düzenle Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingPlate ? 'Plaka Düzenle' : 'Yeni Plaka Ekle'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Plaka No <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ruhsat Tarihi</Form.Label>
                  <Form.Control
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>KM</Form.Label>
                  <Form.Control
                    type="number"
                    name="km"
                    value={formData.km}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Yağ Değişim KM</Form.Label>
                  <Form.Control
                    type="number"
                    name="oilKm"
                    value={formData.oilKm}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Belge No</Form.Label>
                  <Form.Control
                    type="text"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Seri No</Form.Label>
                  <Form.Control
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3">Kasko Sigortası</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Şirket</Form.Label>
                  <Form.Control
                    type="text"
                    name="comprehensiveInsuranceCompany"
                    value={formData.comprehensiveInsuranceCompany}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlangıç</Form.Label>
                  <Form.Control
                    type="date"
                    name="comprehensiveInsuranceStart"
                    value={formData.comprehensiveInsuranceStart}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bitiş</Form.Label>
                  <Form.Control
                    type="date"
                    name="comprehensiveInsuranceEnd"
                    value={formData.comprehensiveInsuranceEnd}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3">Trafik Sigortası</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Şirket</Form.Label>
                  <Form.Control
                    type="text"
                    name="trafficInsuranceCompany"
                    value={formData.trafficInsuranceCompany}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlangıç</Form.Label>
                  <Form.Control
                    type="date"
                    name="trafficInsuranceStart"
                    value={formData.trafficInsuranceStart}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bitiş</Form.Label>
                  <Form.Control
                    type="date"
                    name="trafficInsuranceEnd"
                    value={formData.trafficInsuranceEnd}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3">Muayene</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Şirket/Yer</Form.Label>
                  <Form.Control
                    type="text"
                    name="inspectionCompany"
                    value={formData.inspectionCompany}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlangıç</Form.Label>
                  <Form.Control
                    type="date"
                    name="inspectionStart"
                    value={formData.inspectionStart}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bitiş</Form.Label>
                  <Form.Control
                    type="date"
                    name="inspectionEnd"
                    value={formData.inspectionEnd}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3">Egzoz Muayenesi</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Şirket/Yer</Form.Label>
                  <Form.Control
                    type="text"
                    name="exhaustInspectionCompany"
                    value={formData.exhaustInspectionCompany}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlangıç</Form.Label>
                  <Form.Control
                    type="date"
                    name="exhaustInspectionStart"
                    value={formData.exhaustInspectionStart}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bitiş</Form.Label>
                  <Form.Control
                    type="date"
                    name="exhaustInspectionEnd"
                    value={formData.exhaustInspectionEnd}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Check
              type="switch"
              name="isActive"
              label="Aktif"
              checked={formData.isActive}
              onChange={handleChange}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button variant="primary" type="submit">
              {editingPlate ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </MainCard>
  );
}

