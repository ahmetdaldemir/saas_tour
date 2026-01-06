import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Table, Button, Badge, Alert, Image, Tab, Tabs, Modal, Form } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function RentacarTabs() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('vehicles');
  
  // Vehicles
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Categories
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ translations: {} });
  const [languages, setLanguages] = useState([]);
  const [activeLangTab, setActiveLangTab] = useState('');
  
  // Brands
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandForm, setBrandForm] = useState({ name: '', isActive: true, sortOrder: 0 });
  
  // Models
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [modelForm, setModelForm] = useState({ name: '', brandId: '', isActive: true, sortOrder: 0 });
  const [selectedBrandFilter, setSelectedBrandFilter] = useState(null);
  
  // Locations
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [masterLocations, setMasterLocations] = useState([]);
  const [locationForm, setLocationForm] = useState({
    locationId: '',
    deliveryFee: 0,
    dropFee: 0,
    minDayCount: null,
    sort: 0,
    isActive: true,
  });

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id) {
      loadLanguages();
      fetchVehicles();
      fetchCategories();
      fetchBrands();
      fetchModels();
      fetchLocations();
      fetchMasterLocations();
    }
  }, [auth.initialized, auth.tenant]);

  // Languages
  const loadLanguages = async () => {
    try {
      const response = await api.get('/languages');
      const langs = response.data?.data || response.data || [];
      setLanguages(langs.filter((l) => l.isActive));
      const defaultLang = langs.find((l) => l.isDefault) || langs[0];
      if (defaultLang) {
        setActiveLangTab(defaultLang.id);
      }
    } catch (err) {
      console.error('Error loading languages:', err);
    }
  };

  // Vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/rentacar/vehicles?tenantId=${auth.tenant?.id}`);
      const data = response.data?.data || response.data || [];
      setVehicles(data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err.response?.data?.message || 'Araçlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Bu aracı silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/rentacar/vehicles/${id}`);
      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      alert(err.response?.data?.message || 'Araç silinirken hata oluştu');
    }
  };

  // Categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await api.get('/rentacar/vehicle-categories');
      const data = response.data?.data || response.data || [];
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      const translations = {};
      languages.forEach((lang) => {
        const trans = category.translations?.find((t) => t.languageId === lang.id);
        translations[lang.id] = trans?.name || '';
      });
      setCategoryForm({ translations, isActive: category.isActive, sortOrder: category.sortOrder || 0 });
    } else {
      setEditingCategory(null);
      const translations = {};
      languages.forEach((lang) => {
        translations[lang.id] = '';
      });
      setCategoryForm({ translations, isActive: true, sortOrder: 0 });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    try {
      const payload = {
        isActive: categoryForm.isActive,
        sortOrder: parseInt(categoryForm.sortOrder) || 0,
        translations: Object.entries(categoryForm.translations).map(([languageId, name]) => ({
          languageId,
          name,
          model: 'VehicleCategory',
        })),
      };

      if (editingCategory) {
        await api.put(`/rentacar/vehicle-categories/${editingCategory.id}`, payload);
      } else {
        await api.post('/rentacar/vehicle-categories', payload);
      }

      setShowCategoryModal(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      alert(err.response?.data?.message || 'Kategori kaydedilirken hata oluştu');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/rentacar/vehicle-categories/${id}`);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(err.response?.data?.message || 'Kategori silinirken hata oluştu');
    }
  };

  // Brands
  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await api.get('/rentacar/vehicle-brands');
      const data = response.data?.data || response.data || [];
      setBrands(data);
    } catch (err) {
      console.error('Error fetching brands:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleOpenBrandModal = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setBrandForm({ name: brand.name, isActive: brand.isActive, sortOrder: brand.sortOrder || 0 });
    } else {
      setEditingBrand(null);
      setBrandForm({ name: '', isActive: true, sortOrder: 0 });
    }
    setShowBrandModal(true);
  };

  const handleSaveBrand = async () => {
    try {
      if (editingBrand) {
        await api.put(`/rentacar/vehicle-brands/${editingBrand.id}`, brandForm);
      } else {
        await api.post('/rentacar/vehicle-brands', brandForm);
      }
      setShowBrandModal(false);
      fetchBrands();
    } catch (err) {
      console.error('Error saving brand:', err);
      alert(err.response?.data?.message || 'Marka kaydedilirken hata oluştu');
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Bu markayı silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/rentacar/vehicle-brands/${id}`);
      setBrands(brands.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert(err.response?.data?.message || 'Marka silinirken hata oluştu');
    }
  };

  // Models
  const fetchModels = async (brandId = null) => {
    try {
      setLoadingModels(true);
      const params = brandId ? { brandId } : {};
      const response = await api.get('/rentacar/vehicle-models', { params });
      const data = response.data?.data || response.data || [];
      setModels(data);
    } catch (err) {
      console.error('Error fetching models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleOpenModelModal = (model = null) => {
    if (model) {
      setEditingModel(model);
      setModelForm({
        name: model.name,
        brandId: model.brandId,
        isActive: model.isActive,
        sortOrder: model.sortOrder || 0,
      });
    } else {
      setEditingModel(null);
      setModelForm({ name: '', brandId: '', isActive: true, sortOrder: 0 });
    }
    setShowModelModal(true);
  };

  const handleSaveModel = async () => {
    try {
      if (editingModel) {
        await api.put(`/rentacar/vehicle-models/${editingModel.id}`, modelForm);
      } else {
        await api.post('/rentacar/vehicle-models', modelForm);
      }
      setShowModelModal(false);
      fetchModels(selectedBrandFilter);
    } catch (err) {
      console.error('Error saving model:', err);
      alert(err.response?.data?.message || 'Model kaydedilirken hata oluştu');
    }
  };

  const handleDeleteModel = async (id) => {
    if (!window.confirm('Bu modeli silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/rentacar/vehicle-models/${id}`);
      setModels(models.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Error deleting model:', err);
      alert(err.response?.data?.message || 'Model silinirken hata oluştu');
    }
  };

  const handleBrandFilterChange = (brandId) => {
    setSelectedBrandFilter(brandId);
    fetchModels(brandId);
  };

  // Locations
  const fetchMasterLocations = async () => {
    try {
      const response = await api.get('/master-locations');
      const data = response.data?.data || response.data || [];
      setMasterLocations(data);
    } catch (err) {
      console.error('Error fetching master locations:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await api.get('/rentacar/locations');
      const data = response.data?.data || response.data || [];
      setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleOpenLocationModal = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        locationId: location.locationId,
        deliveryFee: location.deliveryFee || 0,
        dropFee: location.dropFee || 0,
        minDayCount: location.minDayCount || null,
        sort: location.sort || 0,
        isActive: location.isActive,
      });
    } else {
      setEditingLocation(null);
      setLocationForm({
        locationId: '',
        deliveryFee: 0,
        dropFee: 0,
        minDayCount: null,
        sort: 0,
        isActive: true,
      });
    }
    setShowLocationModal(true);
  };

  const handleSaveLocation = async () => {
    try {
      const payload = {
        ...locationForm,
        tenantId: auth.tenant?.id,
        deliveryFee: parseFloat(locationForm.deliveryFee) || 0,
        dropFee: parseFloat(locationForm.dropFee) || 0,
        minDayCount: locationForm.minDayCount ? parseInt(locationForm.minDayCount) : null,
        sort: parseInt(locationForm.sort) || 0,
      };

      if (editingLocation) {
        await api.put(`/rentacar/locations/${editingLocation.id}`, payload);
      } else {
        await api.post('/rentacar/locations', payload);
      }

      setShowLocationModal(false);
      fetchLocations();
    } catch (err) {
      console.error('Error saving location:', err);
      alert(err.response?.data?.message || 'Lokasyon kaydedilirken hata oluştu');
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Bu lokasyonu silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/rentacar/locations/${id}`);
      setLocations(locations.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Error deleting location:', err);
      alert(err.response?.data?.message || 'Lokasyon silinirken hata oluştu');
    }
  };

  // Helper functions
  const getCategoryName = (vehicle) => {
    if (!vehicle.category?.translations) return vehicle.category?.name || '-';
    const trTranslation = vehicle.category.translations.find((t) => t.languageId === auth.tenant?.defaultLanguageId);
    return trTranslation?.name || vehicle.category.translations[0]?.name || '-';
  };

  const getTransmissionText = (transmission) => {
    const map = { manual: 'Manuel', automatic: 'Otomatik', hybrid: 'Hibrit' };
    return map[transmission] || transmission;
  };

  const getFuelTypeText = (fuelType) => {
    const map = { diesel: 'Dizel', petrol: 'Benzin', gasoline: 'Benzin', electric: 'Elektrik', hybrid: 'Hibrit' };
    return map[fuelType] || fuelType;
  };

  const getBrandName = (brandId) => {
    const brand = brands.find((b) => b.id === brandId);
    return brand?.name || '-';
  };

  const getLocationName = (location) => {
    return location.location?.name || location.name || '-';
  };

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Araç Yönetimi">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Araç Yönetimi">
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        {/* Araçlar Tab */}
        <Tab eventKey="vehicles" title={<><i className="fas fa-car me-2"></i>Araçlar</>}>
          <Row className="mb-3">
            <Col>
              <Button variant="primary" size="sm" onClick={() => navigate('/app/rentacar/add')}>
                <i className="fas fa-plus me-1"></i> Yeni Araç Ekle
              </Button>
            </Col>
          </Row>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <Alert variant="info">Araçlar yükleniyor...</Alert>
          ) : (
            <Row>
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <Col md={6} lg={4} key={vehicle.id} className="mb-3">
                    <Card className="h-100">
                      <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                        {vehicle.images && vehicle.images.length > 0 ? (
                          <Image
                            src={vehicle.images.find((img) => img.isPrimary)?.url || vehicle.images[0]?.url}
                            alt={vehicle.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center h-100"
                            style={{ color: '#ccc' }}
                          >
                            <i className="fas fa-car fa-3x"></i>
                          </div>
                        )}
                      </div>
                      <Card.Body>
                        <Card.Title className="d-flex justify-content-between align-items-start">
                          <span>{vehicle.name}</span>
                          <Badge bg={vehicle.isActive ? 'success' : 'secondary'}>
                            {vehicle.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                          {vehicle.brandName} {vehicle.modelName}
                        </Card.Subtitle>
                        <div className="mb-2">
                          <small className="text-muted">
                            <i className="fas fa-tags me-1"></i>
                            {getCategoryName(vehicle)}
                          </small>
                        </div>
                        <Row className="mb-2 small">
                          <Col xs={6}>
                            <i className="fas fa-cog me-1"></i>
                            {getTransmissionText(vehicle.transmission)}
                          </Col>
                          <Col xs={6}>
                            <i className="fas fa-gas-pump me-1"></i>
                            {getFuelTypeText(vehicle.fuelType)}
                          </Col>
                          <Col xs={6}>
                            <i className="fas fa-users me-1"></i>
                            {vehicle.seats} Kişi
                          </Col>
                          <Col xs={6}>
                            <i className="fas fa-suitcase me-1"></i>
                            {vehicle.luggage} Bagaj
                          </Col>
                        </Row>
                        <div className="mb-2">
                          <strong>Plakalar:</strong>
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {vehicle.plates && vehicle.plates.length > 0 ? (
                              vehicle.plates.slice(0, 3).map((plate) => (
                                <Badge key={plate.id} bg="secondary" className="small">
                                  {plate.plateNumber}
                                </Badge>
                              ))
                            ) : (
                              <small className="text-muted">Plaka yok</small>
                            )}
                            {vehicle.plates && vehicle.plates.length > 3 && (
                              <Badge bg="info" className="small">
                                +{vehicle.plates.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {vehicle.baseRate && parseFloat(vehicle.baseRate) > 0 && (
                          <div className="mb-2">
                            <strong>
                              {parseFloat(vehicle.baseRate).toFixed(2)} {vehicle.currencyCode || 'EUR'}
                            </strong>
                            <small className="text-muted"> / gün</small>
                          </div>
                        )}
                      </Card.Body>
                      <Card.Footer className="d-flex justify-content-between">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => navigate(`/app/rentacar/edit/${vehicle.id}`)}
                        >
                          <i className="fas fa-edit"></i> Düzenle
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => navigate(`/app/rentacar/${vehicle.id}/plates`)}
                        >
                          <i className="fas fa-id-card"></i> Plakalar
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteVehicle(vehicle.id)}>
                          <i className="fas fa-trash"></i>
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col>
                  <Alert variant="info">Araç bulunamadı</Alert>
                </Col>
              )}
            </Row>
          )}
        </Tab>

        {/* Kategoriler Tab */}
        <Tab eventKey="categories" title={<><i className="fas fa-tags me-2"></i>Kategoriler</>}>
          <Row className="mb-3">
            <Col>
              <Button variant="primary" size="sm" onClick={() => handleOpenCategoryModal()}>
                <i className="fas fa-plus me-1"></i> Yeni Kategori Ekle
              </Button>
            </Col>
          </Row>

          {loadingCategories ? (
            <Alert variant="info">Kategoriler yükleniyor...</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kategori Adı</th>
                  <th>Sıralama</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map((category, index) => {
                    const trTranslation = category.translations?.find(
                      (t) => t.languageId === auth.tenant?.defaultLanguageId || t.language?.code === 'tr'
                    );
                    return (
                      <tr key={category.id}>
                        <td>{index + 1}</td>
                        <td>{trTranslation?.name || category.translations?.[0]?.name || '-'}</td>
                        <td>{category.sortOrder || 0}</td>
                        <td>
                          <Badge bg={category.isActive ? 'success' : 'secondary'}>
                            {category.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            className="me-1"
                            onClick={() => handleOpenCategoryModal(category)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Kategori bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Tab>

        {/* Markalar Tab */}
        <Tab eventKey="brands" title={<><i className="fas fa-copyright me-2"></i>Markalar</>}>
          <Row className="mb-3">
            <Col>
              <Button variant="primary" size="sm" onClick={() => handleOpenBrandModal()}>
                <i className="fas fa-plus me-1"></i> Yeni Marka Ekle
              </Button>
            </Col>
          </Row>

          {loadingBrands ? (
            <Alert variant="info">Markalar yükleniyor...</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Marka Adı</th>
                  <th>Sıralama</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {brands.length > 0 ? (
                  brands.map((brand, index) => (
                    <tr key={brand.id}>
                      <td>{index + 1}</td>
                      <td>{brand.name}</td>
                      <td>{brand.sortOrder || 0}</td>
                      <td>
                        <Badge bg={brand.isActive ? 'success' : 'secondary'}>
                          {brand.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-1"
                          onClick={() => handleOpenBrandModal(brand)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteBrand(brand.id)}>
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Marka bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Tab>

        {/* Modeller Tab */}
        <Tab eventKey="models" title={<><i className="fas fa-cube me-2"></i>Modeller</>}>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Select
                value={selectedBrandFilter || ''}
                onChange={(e) => handleBrandFilterChange(e.target.value || null)}
              >
                <option value="">Tüm Markalar</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={8} className="text-end">
              <Button variant="primary" size="sm" onClick={() => handleOpenModelModal()}>
                <i className="fas fa-plus me-1"></i> Yeni Model Ekle
              </Button>
            </Col>
          </Row>

          {loadingModels ? (
            <Alert variant="info">Modeller yükleniyor...</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Model Adı</th>
                  <th>Marka</th>
                  <th>Sıralama</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {models.length > 0 ? (
                  models.map((model, index) => (
                    <tr key={model.id}>
                      <td>{index + 1}</td>
                      <td>{model.name}</td>
                      <td>{getBrandName(model.brandId)}</td>
                      <td>{model.sortOrder || 0}</td>
                      <td>
                        <Badge bg={model.isActive ? 'success' : 'secondary'}>
                          {model.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-1"
                          onClick={() => handleOpenModelModal(model)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteModel(model.id)}>
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      {selectedBrandFilter ? 'Bu marka için model bulunamadı' : 'Model bulunamadı'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Tab>

        {/* Lokasyonlar Tab */}
        <Tab eventKey="locations" title={<><i className="fas fa-map-marker-alt me-2"></i>Lokasyonlar</>}>
          <Row className="mb-3">
            <Col>
              <Button variant="primary" size="sm" onClick={() => handleOpenLocationModal()}>
                <i className="fas fa-plus me-1"></i> Yeni Lokasyon Ekle
              </Button>
            </Col>
          </Row>

          {loadingLocations ? (
            <Alert variant="info">Lokasyonlar yükleniyor...</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Lokasyon</th>
                  <th>Tip</th>
                  <th>Teslim Ücreti</th>
                  <th>Bırakma Ücreti</th>
                  <th>Min. Gün</th>
                  <th>Sıra</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {locations.length > 0 ? (
                  locations.map((location, index) => (
                    <tr key={location.id}>
                      <td>{index + 1}</td>
                      <td>{getLocationName(location)}</td>
                      <td>
                        <Badge bg="info">{location.location?.type || '-'}</Badge>
                      </td>
                      <td>{location.deliveryFee ? `${location.deliveryFee} EUR` : '-'}</td>
                      <td>{location.dropFee ? `${location.dropFee} EUR` : '-'}</td>
                      <td>{location.minDayCount || '-'}</td>
                      <td>{location.sort || 0}</td>
                      <td>
                        <Badge bg={location.isActive ? 'success' : 'secondary'}>
                          {location.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-1"
                          onClick={() => handleOpenLocationModal(location)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteLocation(location.id)}>
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Lokasyon bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Tab>
      </Tabs>

      {/* Kategori Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs activeKey={activeLangTab} onSelect={(k) => setActiveLangTab(k)} className="mb-3">
            {languages.map((lang) => (
              <Tab key={lang.id} eventKey={lang.id} title={lang.name}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori Adı ({lang.name})</Form.Label>
                  <Form.Control
                    type="text"
                    value={categoryForm.translations[lang.id] || ''}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        translations: { ...categoryForm.translations, [lang.id]: e.target.value },
                      })
                    }
                  />
                </Form.Group>
              </Tab>
            ))}
          </Tabs>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sıralama</Form.Label>
                <Form.Control
                  type="number"
                  value={categoryForm.sortOrder || 0}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  label="Aktif"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleSaveCategory}>
            Kaydet
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Marka Modal */}
      <Modal show={showBrandModal} onHide={() => setShowBrandModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingBrand ? 'Marka Düzenle' : 'Yeni Marka Ekle'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Marka Adı</Form.Label>
            <Form.Control
              type="text"
              value={brandForm.name}
              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Sıralama</Form.Label>
            <Form.Control
              type="number"
              value={brandForm.sortOrder}
              onChange={(e) => setBrandForm({ ...brandForm, sortOrder: e.target.value })}
            />
          </Form.Group>
          <Form.Check
            type="switch"
            label="Aktif"
            checked={brandForm.isActive}
            onChange={(e) => setBrandForm({ ...brandForm, isActive: e.target.checked })}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBrandModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleSaveBrand}>
            Kaydet
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Model Modal */}
      <Modal show={showModelModal} onHide={() => setShowModelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingModel ? 'Model Düzenle' : 'Yeni Model Ekle'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Marka</Form.Label>
            <Form.Select
              value={modelForm.brandId}
              onChange={(e) => setModelForm({ ...modelForm, brandId: e.target.value })}
            >
              <option value="">Marka Seçin</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Model Adı</Form.Label>
            <Form.Control
              type="text"
              value={modelForm.name}
              onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Sıralama</Form.Label>
            <Form.Control
              type="number"
              value={modelForm.sortOrder}
              onChange={(e) => setModelForm({ ...modelForm, sortOrder: e.target.value })}
            />
          </Form.Group>
          <Form.Check
            type="switch"
            label="Aktif"
            checked={modelForm.isActive}
            onChange={(e) => setModelForm({ ...modelForm, isActive: e.target.checked })}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModelModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleSaveModel}>
            Kaydet
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Lokasyon Modal */}
      <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingLocation ? 'Lokasyon Düzenle' : 'Yeni Lokasyon Ekle'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Master Lokasyon</Form.Label>
            <Form.Select
              value={locationForm.locationId}
              onChange={(e) => setLocationForm({ ...locationForm, locationId: e.target.value })}
            >
              <option value="">Lokasyon Seçin</option>
              {masterLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Teslim Ücreti</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={locationForm.deliveryFee}
                  onChange={(e) => setLocationForm({ ...locationForm, deliveryFee: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Bırakma Ücreti</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={locationForm.dropFee}
                  onChange={(e) => setLocationForm({ ...locationForm, dropFee: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Minimum Gün</Form.Label>
                <Form.Control
                  type="number"
                  value={locationForm.minDayCount || ''}
                  onChange={(e) => setLocationForm({ ...locationForm, minDayCount: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sıralama</Form.Label>
                <Form.Control
                  type="number"
                  value={locationForm.sort}
                  onChange={(e) => setLocationForm({ ...locationForm, sort: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Check
            type="switch"
            label="Aktif"
            checked={locationForm.isActive}
            onChange={(e) => setLocationForm({ ...locationForm, isActive: e.target.checked })}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLocationModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleSaveLocation}>
            Kaydet
          </Button>
        </Modal.Footer>
      </Modal>
    </MainCard>
  );
}

