import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Form, Button, Alert, Card, Tab, Tabs } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function VehicleForm() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [allModels, setAllModels] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    brandId: '',
    modelId: '',
    year: new Date().getFullYear(),
    transmission: 'manual',
    fuelType: 'diesel',
    seats: 5,
    luggage: 2,
    largeLuggage: 0,
    smallLuggage: 0,
    doors: 4,
    engineSize: '',
    horsepower: '',
    bodyType: '',
    hasHydraulicSteering: false,
    isFourWheelDrive: false,
    hasAirConditioning: true,
    hasAbs: true,
    hasRadio: true,
    hasCd: false,
    hasSunroof: false,
    description: '',
    baseRate: '0.00',
    currencyCode: 'EUR',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      fetchCategories();
      fetchBrands();
      fetchModels();
      if (isEdit) {
        fetchVehicle();
      }
    }
  }, [auth.initialized, auth.tenant, id]);

  useEffect(() => {
    // Filter models when brand changes
    if (formData.brandId) {
      const filtered = allModels.filter((m) => m.brandId === formData.brandId);
      setModels(filtered);
    } else {
      setModels([]);
    }
  }, [formData.brandId, allModels]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/rentacar/categories');
      const data = response.data?.data || response.data || [];
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get('/rentacar/brands');
      const data = response.data?.data || response.data || [];
      setBrands(data);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await api.get('/rentacar/models');
      const data = response.data?.data || response.data || [];
      setAllModels(data);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rentacar/vehicles/${id}`);
      const vehicle = response.data?.data || response.data;
      setFormData({
        name: vehicle.name || '',
        categoryId: vehicle.categoryId || '',
        brandId: vehicle.brandId || '',
        modelId: vehicle.modelId || '',
        year: vehicle.year || new Date().getFullYear(),
        transmission: vehicle.transmission || 'manual',
        fuelType: vehicle.fuelType || 'diesel',
        seats: vehicle.seats || 5,
        luggage: vehicle.luggage || 2,
        largeLuggage: vehicle.largeLuggage || 0,
        smallLuggage: vehicle.smallLuggage || 0,
        doors: vehicle.doors || 4,
        engineSize: vehicle.engineSize || '',
        horsepower: vehicle.horsepower || '',
        bodyType: vehicle.bodyType || '',
        hasHydraulicSteering: vehicle.hasHydraulicSteering || false,
        isFourWheelDrive: vehicle.isFourWheelDrive || false,
        hasAirConditioning: vehicle.hasAirConditioning || false,
        hasAbs: vehicle.hasAbs || false,
        hasRadio: vehicle.hasRadio || false,
        hasCd: vehicle.hasCd || false,
        hasSunroof: vehicle.hasSunroof || false,
        description: vehicle.description || '',
        baseRate: vehicle.baseRate || '0.00',
        currencyCode: vehicle.currencyCode || 'EUR',
        isActive: vehicle.isActive !== undefined ? vehicle.isActive : true,
        order: vehicle.order || 0,
      });
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      setError(err.response?.data?.message || 'Araç bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
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
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tenantId: auth.tenant?.id,
        year: parseInt(formData.year),
        seats: parseInt(formData.seats),
        luggage: parseInt(formData.luggage),
        largeLuggage: parseInt(formData.largeLuggage),
        smallLuggage: parseInt(formData.smallLuggage),
        doors: parseInt(formData.doors),
        order: parseInt(formData.order),
      };

      if (isEdit) {
        await api.put(`/rentacar/vehicles/${id}`, payload);
      } else {
        await api.post('/rentacar/vehicles', payload);
      }

      navigate('/app/rentacar');
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError(err.response?.data?.message || 'Araç kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title={isEdit ? 'Araç Düzenle' : 'Yeni Araç Ekle'}>
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title={isEdit ? 'Araç Düzenle' : 'Yeni Araç Ekle'}>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Tabs defaultActiveKey="basic" className="mb-3">
          <Tab eventKey="basic" title="Temel Bilgiler">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Araç Adı <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Kategori <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                    <option value="">Kategori Seçin</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.translations?.[0]?.name || cat.name || cat.id}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Marka <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select name="brandId" value={formData.brandId} onChange={handleChange} required>
                    <option value="">Marka Seçin</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Model <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="modelId"
                    value={formData.modelId}
                    onChange={handleChange}
                    required
                    disabled={!formData.brandId}
                  >
                    <option value="">Model Seçin</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </Form.Select>
                  {!formData.brandId && <Form.Text className="text-muted">Önce marka seçin</Form.Text>}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Yıl</Form.Label>
                  <Form.Control type="number" name="year" value={formData.year} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Vites</Form.Label>
                  <Form.Select name="transmission" value={formData.transmission} onChange={handleChange}>
                    <option value="manual">Manuel</option>
                    <option value="automatic">Otomatik</option>
                    <option value="hybrid">Hibrit</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Yakıt Tipi</Form.Label>
                  <Form.Select name="fuelType" value={formData.fuelType} onChange={handleChange}>
                    <option value="diesel">Dizel</option>
                    <option value="petrol">Benzin</option>
                    <option value="electric">Elektrik</option>
                    <option value="hybrid">Hibrit</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Kasa Tipi</Form.Label>
                  <Form.Control
                    type="text"
                    name="bodyType"
                    value={formData.bodyType}
                    onChange={handleChange}
                    placeholder="Sedan, SUV, Minivan"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Koltuk Sayısı</Form.Label>
                  <Form.Control
                    type="number"
                    name="seats"
                    value={formData.seats}
                    onChange={handleChange}
                    min="2"
                    max="50"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Kapı Sayısı</Form.Label>
                  <Form.Control
                    type="number"
                    name="doors"
                    value={formData.doors}
                    onChange={handleChange}
                    min="2"
                    max="6"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Bagaj (Büyük)</Form.Label>
                  <Form.Control
                    type="number"
                    name="luggage"
                    value={formData.luggage}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Bagaj (Küçük)</Form.Label>
                  <Form.Control
                    type="number"
                    name="smallLuggage"
                    value={formData.smallLuggage}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Motor Hacmi</Form.Label>
                  <Form.Control
                    type="text"
                    name="engineSize"
                    value={formData.engineSize}
                    onChange={handleChange}
                    placeholder="1300 cm3'e kadar"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Beygir Gücü</Form.Label>
                  <Form.Control
                    type="text"
                    name="horsepower"
                    value={formData.horsepower}
                    onChange={handleChange}
                    placeholder="75-100"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="features" title="Özellikler">
            <Row>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  name="hasAirConditioning"
                  label="Klima"
                  checked={formData.hasAirConditioning}
                  onChange={handleChange}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  name="hasAbs"
                  label="ABS"
                  checked={formData.hasAbs}
                  onChange={handleChange}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  name="hasHydraulicSteering"
                  label="Hidrolik Direksiyon"
                  checked={formData.hasHydraulicSteering}
                  onChange={handleChange}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  name="isFourWheelDrive"
                  label="4x4"
                  checked={formData.isFourWheelDrive}
                  onChange={handleChange}
                  className="mb-2"
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  name="hasRadio"
                  label="Radyo"
                  checked={formData.hasRadio}
                  onChange={handleChange}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  name="hasCd"
                  label="CD Çalar"
                  checked={formData.hasCd}
                  onChange={handleChange}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  name="hasSunroof"
                  label="Sunroof"
                  checked={formData.hasSunroof}
                  onChange={handleChange}
                  className="mb-2"
                />
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="pricing" title="Fiyatlandırma">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Temel Fiyat (Günlük)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="baseRate"
                    value={formData.baseRate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Para Birimi</Form.Label>
                  <Form.Select name="currencyCode" value={formData.currencyCode} onChange={handleChange}>
                    <option value="EUR">EUR</option>
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="other" title="Diğer">
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sıralama</Form.Label>
                  <Form.Control
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    name="isActive"
                    label="Aktif"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Tab>
        </Tabs>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => navigate('/app/rentacar')} disabled={loading}>
            İptal
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </Form>
    </MainCard>
  );
}

