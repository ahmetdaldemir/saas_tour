import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuthStore } from '../stores/auth';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await auth.login(email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş başarısız. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <h1>SaaS Tour Admin</h1>
          <p>Yönetim paneline giriş yapın</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <Message severity="error" text={error} className="mb-3" />}
          <div className="field">
            <label htmlFor="email">E-posta</label>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
              type="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Şifre</label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              feedback={false}
              toggleMask
              required
            />
          </div>
          <Button
            type="submit"
            label="Giriş Yap"
            className="w-full"
            loading={auth.loading}
          />
        </form>
      </Card>
    </div>
  );
};

export default Login;

