import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignupForm } from '../components/auth/SignupForm';
import './AuthPages.css';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, setError } = useAuth();

  const handleSignup = async (username: string, password: string) => {
    await signup({ username, password });
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Cara a Cara</h1>
          <p>Crie sua conta para jogar</p>
        </div>
        <SignupForm onSubmit={handleSignup} isLoading={isLoading} error={error} onErrorDismiss={() => setError(null)} />
        <div className="auth-footer">
          <p>Já tem uma conta? <Link to="/login">Fazer login</Link></p>
        </div>
      </div>
    </div>
  );
};
