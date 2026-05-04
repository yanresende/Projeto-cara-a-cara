import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  const winRate = user.gamesPlayed > 0 ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{user.username}</h1>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Estatísticas</h2>
        <p><strong>Pontuação:</strong> {user.score}</p>
        <p><strong>Jogos Jogados:</strong> {user.gamesPlayed}</p>
        <p><strong>Jogos Vencidos:</strong> {user.gamesWon}</p>
        <p><strong>Taxa de Vitória:</strong> {winRate}%</p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Button onClick={() => navigate('/ranking')}>Ver Ranking</Button>
        <Button variant="secondary" onClick={() => navigate('/')}>Voltar ao Lobby</Button>
        <Button variant="danger" onClick={handleLogout}>Sair</Button>
      </div>
    </div>
  );
};
