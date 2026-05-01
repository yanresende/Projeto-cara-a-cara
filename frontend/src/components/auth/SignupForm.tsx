import React, { useState } from 'react';
import { Button } from '../common/Button';
import './AuthForm.css';

interface SignupFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSubmit,
  isLoading,
  error,
  onErrorDismiss,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setLocalError('Todos os campos são obrigatórios');
      return;
    }

    if (username.trim().length < 3) {
      setLocalError('Username deve ter pelo menos 3 caracteres');
      return;
    }

    if (password.length < 6) {
      setLocalError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Senhas não conferem');
      return;
    }

    try {
      await onSubmit(username, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta';
      setLocalError(msg);
    }
  };

  const displayError = localError || error;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Criar Conta</h2>

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
          placeholder="Escolha um username"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirmar Senha</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Repita a senha"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" isLoading={isLoading}>
        Criar Conta
      </Button>
    </form>
  );
};
