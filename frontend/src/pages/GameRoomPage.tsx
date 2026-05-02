import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { socketService } from '../services/socketService';
import { QuestionInput } from '../components/game/QuestionInput';
import { QuestionHistory } from '../components/game/QuestionHistory';
import { CharacterGrid } from '../components/game/CharacterGrid';
import { GameResult } from '../components/game/GameResult';
import { Button } from '../components/common/Button';
import './GameRoomPage.css';
import type { Room } from '../types/index';

export const GameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    gameState,
    characters,
    mySecretCharacter,
    questions,
    turnPhase,
    pendingQuestion,
    eliminatedCharacters,
    isLoading,
    error,
    gameEnded,
    winnerId,
    winnerName,
    guessResult,
    isMyTurn,
    submitQuestion,
    answerQuestion,
    eliminateCharacter,
    submitGuess,
    endTurn,
    startGame,
    resetGame,
  } = useGameSocket(roomId || '');

  const [room, setRoom] = useState<Room | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [guessingMode, setGuessingMode] = useState(false);

  useEffect(() => {
    if (!roomId) { navigate('/'); return; }

    let cancelled = false;

    const loadRoom = () => {
      if (cancelled) return;
      socketService.getRoom(roomId, (response) => {
        if (cancelled) return;
        if (!response.success) { navigate('/'); return; }
        setRoom(response.room);
        const alreadyIn = user && response.room.players.some((p: { id: string }) => p.id === user.id);
        if (!alreadyIn) {
          socketService.joinRoom(roomId, (joinResponse) => {
            if (cancelled) return;
            if (!joinResponse.success) { navigate('/'); return; }
            socketService.getRoom(roomId, (r) => {
              if (!cancelled && r.success) setRoom(r.room);
            });
          });
        }
      });
    };

    socketService.waitForConnection().then(loadRoom);

    const handlePlayerJoined = (data: { roomId: string; userId: string; username: string }) => {
      if (data.roomId !== roomId) return;
      setRoom(prev => {
        if (!prev || prev.players.some(p => p.id === data.userId)) return prev;
        return { ...prev, players: [...prev.players, { id: data.userId, username: data.username, joinedAt: new Date() }] };
      });
    };

    const handlePlayerLeft = (data: { roomId: string; userId: string }) => {
      if (data.roomId !== roomId) return;
      setRoom(prev => prev ? { ...prev, players: prev.players.filter(p => p.id !== data.userId) } : prev);
    };

    socketService.on('player_joined', handlePlayerJoined);
    socketService.on('player_left', handlePlayerLeft);
    socketService.on('connect', loadRoom);

    return () => {
      cancelled = true;
      socketService.off('player_joined', handlePlayerJoined);
      socketService.off('player_left', handlePlayerLeft);
      socketService.off('connect', loadRoom);
    };
  }, [roomId, navigate, user]);

  useEffect(() => {
    if (gameState) setGameStarted(true);
  }, [gameState]);

  useEffect(() => {
    if (gameEnded) setShowResult(true);
  }, [gameEnded]);

  useEffect(() => {
    // Sai do modo de adivinhação ao mudar de turno
    if (!isMyTurn) setGuessingMode(false);
  }, [isMyTurn]);

  const handleStartGame = () => {
    if (roomId) startGame(roomId);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    resetGame();
    setGameStarted(false);
    setGuessingMode(false);
  };

  const handleBackToLobby = () => {
    if (roomId) socketService.leaveRoom(roomId);
    navigate('/');
  };

  const handleGuessCharacter = (characterId: string) => {
    if (guessingMode) {
      submitGuess(characterId);
      setGuessingMode(false);
    } else {
      eliminateCharacter(characterId);
    }
  };

  if (!room) return <div className="game-room loading">Carregando...</div>;

  const opponentName = room.players.find(p => p.id !== user?.id)?.username || 'Adversário';
  const currentTurnName = gameState?.currentTurnPlayerId === user?.id ? 'Você' : opponentName;
  const isWinner = winnerId === user?.id;

  const renderTurnBanner = () => {
    if (!gameStarted) return null;
    const myTurn = isMyTurn;
    return (
      <div className={`turn-banner ${myTurn ? 'my-turn' : 'opponent-turn'}`}>
        {myTurn ? '⚡ Seu turno' : `⏳ Turno de ${opponentName}`}
      </div>
    );
  };

  const renderActionArea = () => {
    if (!gameStarted) return null;

    // Adversário me fez uma pergunta — preciso responder
    if (turnPhase === 'opponent_asking_me' && pendingQuestion) {
      return (
        <div className="action-area answer-area">
          <h3>{opponentName} perguntou:</h3>
          <p className="pending-question">"{pendingQuestion}"</p>
          <div className="answer-buttons">
            <Button
              onClick={() => answerQuestion('sim')}
              isLoading={isLoading}
              disabled={isLoading}
              size="large"
            >
              ✅ Sim
            </Button>
            <Button
              onClick={() => answerQuestion('nao')}
              isLoading={isLoading}
              disabled={isLoading}
              size="large"
              variant="secondary"
            >
              ❌ Não
            </Button>
          </div>
        </div>
      );
    }

    // Meu turno: preciso fazer uma pergunta
    if (turnPhase === 'my_turn_ask') {
      return (
        <div className="action-area">
          <h3>Faça sua pergunta</h3>
          <p className="action-hint">Pergunte algo sobre o personagem de {opponentName}</p>
          <QuestionInput onSubmit={submitQuestion} isLoading={isLoading} />
        </div>
      );
    }

    // Meu turno: aguardando {opponentName} responder
    if (turnPhase === 'my_turn_wait_answer') {
      const lastQuestion = questions[questions.length - 1];
      return (
        <div className="action-area waiting-area">
          <h3>Aguardando resposta...</h3>
          {lastQuestion && (
            <p className="pending-question">"{lastQuestion.content}"</p>
          )}
          <p className="action-hint">Esperando {opponentName} responder sua pergunta</p>
        </div>
      );
    }

    // Meu turno: já recebi resposta, posso eliminar/adivinhar/finalizar
    if (turnPhase === 'my_turn_after_answer') {
      return (
        <div className="action-area eliminate-area">
          <p className="action-hint">
            {guessingMode
              ? '🎯 Modo adivinhação: clique no personagem que você acha que é de ' + opponentName
              : '🗑️ Clique nos personagens para eliminá-los. Quando quiser adivinhar, use o botão abaixo.'}
          </p>
          {error && <div className="error-message">{error}</div>}
          {guessResult && !gameEnded && (
            <div className={`guess-feedback ${guessResult.isCorrect ? 'correct' : 'incorrect'}`}>
              {guessResult.message}
            </div>
          )}
          <div className="action-buttons">
            <Button
              onClick={() => setGuessingMode(g => !g)}
              variant={guessingMode ? 'primary' : 'secondary'}
              disabled={isLoading}
            >
              {guessingMode ? '🎯 Cancelar adivinhação' : '🎯 Adivinhar personagem'}
            </Button>
            <Button
              onClick={endTurn}
              variant="secondary"
              isLoading={isLoading}
              disabled={isLoading || guessingMode}
            >
              ➡️ Finalizar turno
            </Button>
          </div>
        </div>
      );
    }

    // Turno do adversário
    if (turnPhase === 'opponent_turn') {
      return (
        <div className="action-area waiting-area">
          <h3>Turno de {opponentName}</h3>
          <p className="action-hint">Aguarde o adversário fazer sua pergunta...</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="game-room-page">
      <div className="game-header">
        <div className="header-left">
          <h1>{room.name}</h1>
        </div>
        {renderTurnBanner()}
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
            {room.players.length === 2 && (
              <Button onClick={handleStartGame} size="large" isLoading={isLoading}>
                Começar Jogo
              </Button>
            )}
            {room.players.length < 2 && (
              <p className="action-hint">Aguardando mais um jogador entrar...</p>
            )}
          </div>
        </div>
      ) : (
        <div className="game-content">
          {/* Painel esquerdo: personagem secreto + histórico */}
          <div className="game-panel left-panel">
            {mySecretCharacter && (
              <div className="my-secret-section">
                <h3>Meu personagem secreto</h3>
                <p className="secret-hint">(o adversário está tentando adivinhar este)</p>
                <div className="secret-character-card">
                  <img src={mySecretCharacter.imageUrl} alt={mySecretCharacter.name} />
                  <span>{mySecretCharacter.name}</span>
                </div>
              </div>
            )}
            <div className="question-history-section">
              <h3>Histórico de perguntas</h3>
              <QuestionHistory questions={questions} />
            </div>
          </div>

          {/* Painel direito: grade de personagens */}
          <div className="game-panel right-panel">
            <div className="grid-header">
              <h3>Personagens do adversário</h3>
              {isMyTurn && turnPhase !== 'my_turn_ask' && turnPhase !== 'my_turn_wait_answer' && (
                <span className="eliminated-count">
                  {eliminatedCharacters.size} eliminados
                </span>
              )}
            </div>
            <CharacterGrid
              characters={characters}
              eliminatedCharacters={eliminatedCharacters}
              onCardClick={handleGuessCharacter}
              guessingMode={guessingMode}
              interactive={isMyTurn && (turnPhase === 'my_turn_after_answer')}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Área de ação (abaixo do grid) */}
      {gameStarted && (
        <div className="game-action-footer">
          {renderActionArea()}
        </div>
      )}

      {showResult && (
        <GameResult
          isWinner={isWinner}
          characterName={guessResult?.opponentSecretName || 'Personagem'}
          questionsCount={questions.length}
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
};
