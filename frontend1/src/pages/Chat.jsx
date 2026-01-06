import { useState, useEffect } from 'react';
import { Row, Col, Card, ListGroup, Form, Button, Badge, Alert } from 'react-bootstrap';
import { useAuthStore } from '../stores/auth';
import { useFeaturesStore } from '../stores/features';
import api from '../services/api';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Chat() {
  const auth = useAuthStore();
  const features = useFeaturesStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.initialized && auth.tenant?.id && features.hasFeature('chat')) {
      fetchConversations();
    }
  }, [auth.initialized, auth.tenant]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/chat/conversations`);
      const data = response.data?.data || response.data || [];
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Konuşmalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!features.hasFeature('chat')) {
    return (
      <MainCard title="Chat / Agency">
        <Alert variant="warning">
          Chat özelliği kullanılamıyor. Lütfen bu özelliği aktif etmek için destek ekibiyle iletişime geçin.
        </Alert>
      </MainCard>
    );
  }

  if (!auth.initialized || !auth.tenant) {
    return (
      <MainCard title="Chat / Agency">
        <Alert variant="warning">Yükleniyor...</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title="Chat / Agency">
      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>
              <strong>Konuşmalar</strong>
              <Badge bg="primary" className="float-end">
                {conversations.length}
              </Badge>
            </Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                <ListGroup.Item>Yükleniyor...</ListGroup.Item>
              ) : conversations.length > 0 ? (
                conversations.map((conv) => (
                  <ListGroup.Item
                    key={conv.id}
                    action
                    active={selectedConversation?.id === conv.id}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">{conv.customer?.name || 'Bilinmeyen'}</h6>
                      <small>{new Date(conv.lastMessageAt).toLocaleTimeString('tr-TR')}</small>
                    </div>
                    <p className="mb-1 text-muted small">{conv.lastMessage || 'Henüz mesaj yok'}</p>
                    {conv.unreadCount > 0 && (
                      <Badge bg="danger" className="mt-1">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>Konuşma bulunamadı</ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
          {selectedConversation ? (
            <Card>
              <Card.Header>
                <strong>{selectedConversation.customer?.name || 'Bilinmeyen'}</strong>
                <span className="text-muted ms-2">{selectedConversation.customer?.email || ''}</span>
              </Card.Header>
              <Card.Body style={{ height: '500px', overflowY: 'auto' }}>
                {messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <div key={index} className={`mb-3 ${msg.isFromAgent ? 'text-end' : ''}`}>
                      <Badge bg={msg.isFromAgent ? 'primary' : 'secondary'}>{msg.sender}</Badge>
                      <div className="mt-1">
                        <p className="mb-0">{msg.text}</p>
                        <small className="text-muted">
                          {new Date(msg.createdAt).toLocaleString('tr-TR')}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <Alert variant="info">Henüz mesaj yok</Alert>
                )}
              </Card.Body>
              <Card.Footer>
                <Form.Group>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Mesajınızı yazın..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                </Form.Group>
                <Button variant="primary" className="mt-2" size="sm">
                  <i className="fas fa-paper-plane me-1"></i> Gönder
                </Button>
              </Card.Footer>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center py-5">
                <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Bir konuşma seçin</h5>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </MainCard>
  );
}

