import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import './GameComponents.css';

interface GameResultProps {
  isWinner: boolean;
  characterName: string;
  questionsCount: number;
  onClose: () => void;
}

export const GameResult: React.FC<GameResultProps> = ({
  isWinner,
  characterName,
  questionsCount,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleBackToLobby = () => {
    navigate('/');
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
