import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, setError } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    await login({ username, password });
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Cara a Cara</h1>
          <p>Jogo de Adivinhação em Tempo Real</p>
        </div>
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} onErrorDismiss={() => setError(null)} />
        <div className="auth-footer">
          <p>Não tem uma conta? <Link to="/signup">Criar conta</Link></p>
        </div>
      </div>
    </div>
  );
};
