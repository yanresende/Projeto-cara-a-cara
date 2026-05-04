import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ModeSelectionPage.css';

export const ModeSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const selectMode = (mode: 'online' | 'local') => {
    localStorage.setItem('gameMode', mode);
    navigate('/');
  };

  return (
    <div className="mode-selection-page">
      <div className="mode-selection-container">
        <h1>Cara a Cara</h1>
        <p className="mode-subtitle">Como você quer jogar?</p>
        <div className="mode-cards">
          <button className="mode-card" onClick={() => selectMode('online')}>
            <div className="mode-icon">🌐</div>
            <h2>Online</h2>
            <p>Jogue com alguém pela internet. Perguntas e respostas são enviadas pelo app em tempo real.</p>
          </button>
          <button className="mode-card" onClick={() => selectMode('local')}>
            <div className="mode-icon">🤝</div>
            <h2>Local (Presencial)</h2>
            <p>Dois jogadores no mesmo local. As perguntas e respostas são feitas de boca em boca — sem precisar digitar nada.</p>
          </button>
        </div>
      </div>
    </div>
  );
};
