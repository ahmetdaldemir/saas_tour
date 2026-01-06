import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Alert } from 'react-bootstrap';
import MainCard from 'components/Card/MainCard';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';

// -----------------------|| BLOGS ||-----------------------//
export default function Blogs() {
  const auth = useAuthStore();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    // Wait for auth to initialize before loading blogs
    if (auth.initialized) {
      loadBlogs();
    }
  }, [auth.initialized, auth.tenant]);

  const loadBlogs = async () => {
    if (!auth.tenant) {
      console.warn('Tenant not found, cannot load blogs');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/blogs', {
        params: { tenantId: auth.tenant.id },
      });
      // Handle both { success: true, data: [...] } and direct array responses
      const data = response.data?.data || response.data;
      setBlogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load blogs:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Blog yazıları yüklenirken bir hata oluştu';
      console.error('Error details:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async (id) => {
    if (!window.confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
      return;
    }
    setRemoving(id);
    try {
      await api.delete(`/blogs/${id}`);
      await loadBlogs();
    } catch (error) {
      console.error('Failed to delete blog:', error);
    } finally {
      setRemoving(null);
    }
  };

  const getLocationName = (location) => {
    if (!location) return '-';
    if (typeof location === 'string') return location;
    return location.name || location.location?.name || '-';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published':
        return 'Yayında';
      case 'draft':
        return 'Taslak';
      case 'archived':
        return 'Arşivlendi';
      default:
        return status;
    }
  };

  return (
    <Row>
      <Col md={12}>
        <MainCard title="Blog Yazıları">
          <div className="d-flex justify-content-end mb-3">
            <Button variant="primary" size="sm" onClick={() => setShowDialog(true)}>
              Yeni Blog Yazısı
            </Button>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Lokasyon</th>
                <th>Durum</th>
                <th>Yayın Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    {loading ? 'Yükleniyor...' : 'Henüz blog yazısı bulunmuyor'}
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td>{blog.title}</td>
                    <td>
                      {blog.location ? (
                        <span className="badge bg-info">{getLocationName(blog.location)}</span>
                      ) : (
                        <span className="badge bg-success">Genel</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge bg-${getStatusColor(blog.status)}`}>
                        {getStatusLabel(blog.status)}
                      </span>
                    </td>
                    <td>{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('tr-TR') : '-'}</td>
                    <td>
                      <Button variant="link" size="sm">
                        Düzenle
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger"
                        disabled={removing === blog.id}
                        onClick={() => deleteBlog(blog.id)}
                      >
                        {removing === blog.id ? 'Siliniyor...' : 'Sil'}
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

