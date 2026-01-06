import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// react-bootstrap
import { Card, Row, Col, Button, Form, InputGroup, Alert } from 'react-bootstrap';

// third party
import FeatherIcon from 'feather-icons-react';

// assets
import logoDark from 'assets/images/logo-dark.svg';
import { useAuthStore } from '../../stores/auth';
import api from '../../services/api';

// -----------------------|| SIGNIN 1 ||-----------------------//

export default function SignIn1() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user, tenant } = response.data;
      
      // Set auth state
      auth.setAuth(token, user, tenant);
      
      // Redirect to dashboard
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-content text-center">
        <Card className="borderless">
          <Row className="align-items-center text-center">
            <Col>
              <Card.Body className="card-body">
                <img src={logoDark} alt="" className="img-fluid mb-4" />
                <h4 className="mb-3 f-w-400">Giriş Yap</h4>
                
                {error && (
                  <Alert variant="danger" className="text-start">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <FeatherIcon icon="mail" />
                  </InputGroup.Text>
                    <Form.Control
                      type="email"
                      placeholder="Email adresi"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                </InputGroup>
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <FeatherIcon icon="lock" />
                  </InputGroup.Text>
                    <Form.Control
                      type="password"
                      placeholder="Şifre"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                </InputGroup>
                <Form.Group>
                    <Form.Check
                      type="checkbox"
                      className="text-left mb-4 mt-2"
                      label="Beni hatırla"
                    />
                </Form.Group>
                  <Button
                    type="submit"
                    className="btn btn-block btn-primary mb-4"
                    disabled={loading}
                  >
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </Button>
                </Form>

                <p className="mb-2 text-muted">
                  Şifrenizi mi unuttunuz?{' '}
                  <NavLink to="#" className="f-w-400">
                    Sıfırla
                  </NavLink>
                </p>
                <p className="mb-0 text-muted">
                  Hesabınız yok mu?{' '}
                  <NavLink to="/register" className="f-w-400">
                    Kayıt Ol
                  </NavLink>
                </p>
              </Card.Body>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
}
