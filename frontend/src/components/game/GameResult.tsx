import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import './GameComponents.css';

interface GameResultProps {
  isWinner: boolean;
  characterName: string;
  questionsCount: number;
  lastChanceSuccess?: boolean;
  onClose: () => void;
}

export const GameResult: React.FC<GameResultProps> = ({
  isWinner,
  characterName,
  questionsCount,
  lastChanceSuccess = false,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleBackToLobby = () => {
    navigate('/');
  };

  const renderLastChanceNote = () => {
    if (!lastChanceSuccess) return null;
    if (isWinner) {
      return (
        <p className="last-chance-note last-chance-note--winner">
          O adversário acertou na última chance — você ganhou <strong>+15 LP</strong> em vez de +20.
        </p>
      );
    }
    return (
      <p className="last-chance-note last-chance-note--loser">
        Você acertou na última chance! Por isso perdeu <strong>apenas 5 LP</strong> em vez de 10.
      </p>
    );
  };

  return (
    <div className="game-result-overlay">
      <div className="game-result-modal">
        <div className={`result-header ${isWinner ? 'winner' : 'loser'}`}>
          {isWinner ? '🎉 VOCÊ GANHOU!' : '😢 VOCÊ PERDEU!'}
        </div>

        <div className="result-content">
          <p>
            O personagem era: <strong>{characterName}</strong>
          </p>
          <p>
            Perguntas feitas: <strong>{questionsCount}</strong>
          </p>
          {renderLastChanceNote()}
        </div>

        <div className="result-actions">
          <Button onClick={onClose} variant="secondary">
            Jogar Novamente
          </Button>
          <Button onClick={handleBackToLobby} variant="primary">
            Voltar ao Lobby
          </Button>
        </div>
      </div>
    </div>
  );
};
