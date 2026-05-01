import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { socketService } from '../services/socketService';
import { QuestionInput } from '../components/game/QuestionInput';
import { QuestionHistory } from '../components/game/QuestionHistory';
import { CharacterGrid } from '../components/game/CharacterGrid';
import { PlayerRoles } from '../components/game/PlayerRoles';
import { GameResult } from '../components/game/GameResult';
import { Button } from '../components/common/Button';
import './GameRoomPage.css';
import type { Room } from '../types/index';

export const GameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    game,
    characters,
    isQuestioner,
    questions,
    isLoading,
    error,
    gameEnded,
    winner,
    submitQuestion,
    submitGuess,
    startGame,
    resetGame,
  } = useGameSocket(roomId || '');

  const [room, setRoom] = useState<Room | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Mock room data - in production, fetch from somewhere
    setRoom({
      id: roomId,
      name: 'Sala do Jogo',
      themeId: '1',
      players: [
        { id: 'player1', username: 'Jogador 1', joinedAt: new Date() },
        { id: 'player2', username: 'Jogador 2', joinedAt: new Date() },
      ],
      maxPlayers: 2,
      createdAt: new Date(),
      status: 'playing',
    });
  }, [roomId, navigate]);

  useEffect(() => {
    if (game) {
      setGameStarted(true);
    }
  }, [game]);

  useEffect(() => {
    if (gameEnded) {
      setShowResult(true);
    }
  }, [gameEnded]);

  const handleStartGame = () => {
    if (roomId) {
      startGame(roomId);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    resetGame();
    setGameStarted(false);
  };

  const handleBackToLobby = () => {
    if (roomId) {
      socketService.leaveRoom(roomId);
    }
    navigate('/');
  };

  if (!room) {
    return <div className="game-room loading">Carregando...</div>;
  }

  const opponent = room.players.find(p => p.id !== user?.id);
  const opponentName = opponent?.username || 'Oponente';

  const isWinner = winner === user?.id;
  const secretCharacterName = characters.find(
    c => c.id === game?.secretCharacterId
  )?.name || 'Personagem';

  return (
    <div className="game-room-page">
      <div className="game-header">
        <div className="header-left">
          <h1>{room.name}</h1>
          <p>Tema: {room.themeId}</p>
        </div>
        <Button variant="secondary" size="small" onClick={handleBackToLobby}>
          Voltar ao Lobby
        </Button>
      </div>

      {!gameStarted ? (
        <div className="game-waiting">
          <div className="waiting-content">
            <h2>Aguardando Início do Jogo</h2>
            <p>Jogadores: {room.players.length}/{room.maxPlayers}</p>
            {room.players.map(p => (
              <div key={p.id} className="player-item">
                ✓ {p.username}
              </div>
            ))}
            <Button onClick={handleStartGame} size="large">
              Começar Jogo
            </Button>
          </div>
        </div>
      ) : (
        <>
          <PlayerRoles
            isQuestioner={isQuestioner}
            questionerName={
              game?.questionerPlayerId === user?.id
                ? user?.username || 'Você'
                : opponentName
            }
            thinkerName={
              game?.thinkerPlayerId === user?.id
                ? user?.username || 'Você'
                : opponentName
            }
          />

          <div className="game-content">
            {/* Questionador Panel */}
            <div className="game-panel questioner-panel">
              <h2>Fazer Pergunta</h2>
              {isQuestioner ? (
                <>
                  <QuestionInput
                    onSubmit={submitQuestion}
                    isLoading={isLoading}
                  />
                  <QuestionHistory questions={questions} />
                </>
              ) : (
                <div className="info-message">
                  O questionador está fazendo perguntas...
                  <QuestionHistory questions={questions} />
                </div>
              )}
            </div>

            {/* Adivinhador Panel */}
            <div className="game-panel guesser-panel">
              <h2>Adivinhar Personagem</h2>
              {!isQuestioner ? (
                <>
                  {error && <div className="error-message">{error}</div>}
                  <CharacterGrid
                    characters={characters}
                    onGuess={submitGuess}
                    isLoading={isLoading}
                    disabled={isLoading}
                  />
                </>
              ) : (
                <div className="info-message">
                  Aguardando adivinhação do oponente...
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showResult && (
        <GameResult
          isWinner={isWinner}
          characterName={secretCharacterName}
          questionsCount={questions.length}
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
};
