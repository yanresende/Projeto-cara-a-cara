import React, { useState } from 'react';
import { Button } from '../common/Button';
import './AuthForm.css';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  error,
  onErrorDismiss,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!username.trim() || !password.trim()) {
      setLocalError('Username e password são obrigatórios');
      return;
    }

    try {
      await onSubmit(username, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login';
      setLocalError(msg);
    }
  };

  const displayError = localError || error;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Login</h2>

      {displayError && (
        <div className="error-message">
          <p>{displayError}</p>
          <button
            type="button"
            onClick={() => {
              setLocalError('');
              onErrorDismiss?.();
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Seu username"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Sua senha"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" isLoading={isLoading}>
        Fazer Login
      </Button>
    </form>
  );
};
