import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { socketService } from '../services/socketService';
import { QuestionInput } from '../components/game/QuestionInput';
import { QuestionHistory } from '../components/game/QuestionHistory';
import { CharacterGrid } from '../components/game/CharacterGrid';
import { GameResult } from '../components/game/GameResult';
import { UserAvatar } from '../components/common/UserAvatar';
import { Button } from '../components/common/Button';
import './GameRoomPage.css';
import { ITEM_BY_ID, DEFAULT_EQUIPPED } from '../utils/shopItems';
import { API_URL } from '../utils/constants';
import type { Room, EquippedItems } from '../types/index';
import { SkinEffectLayer } from '../components/game/SkinEffectLayer';

interface PublicProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  leaguePoints: number;
  equippedItems: EquippedItems;
}

const LEAGUE_ICON: Record<string, string> = {
  campeao: '👑', diamante: '💎', ouro: '🏆', prata: '🥈', bronze: '🥉',
};
function getLeagueKey(lp: number): string {
  if (lp >= 500) return 'diamante';
  if (lp >= 250) return 'ouro';
  if (lp >= 100) return 'prata';
  return 'bronze';
}

export const GameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
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
    guessResult,
    isMyTurn,
    gameMode,
    opponentEliminatedCount,
    lastChanceSuccess,
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
  const [opponentProfile, setOpponentProfile] = useState<PublicProfile | null>(null);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [turnBannerMyTurn, setTurnBannerMyTurn] = useState(false);
  const prevTurnPlayerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) { navigate('/'); return; }

    let cancelled = false;

    const loadRoom = () => {
      if (cancelled) return;
      // Sempre chama joinRoom para garantir que o socket entre no room antes de qualquer ação
      socketService.joinRoom(roomId, (joinResponse) => {
        if (cancelled) return;
        if (!joinResponse.success) { navigate('/'); return; }
        socketService.getRoom(roomId, (response) => {
          if (cancelled) return;
          if (!response.success) { navigate('/'); return; }
          setRoom(response.room);
        });
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

  // Busca perfil público do oponente quando o jogo começa
  useEffect(() => {
    if (!gameState || !user?.id) return;
    const opponentId = gameState.player1Id === user.id ? gameState.player2Id : gameState.player1Id;
    if (!opponentId) return;
    fetch(`${API_URL}/api/users/${opponentId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setOpponentProfile(data); })
      .catch(() => {});
  }, [gameState, user?.id]);

  // Quando entra em sala com jogo em andamento, solicita restauração do estado
  useEffect(() => {
    if (!room || !roomId) return;
    if (room.status === 'playing' && !gameStarted) {
      socketService.emit('request_game_state', { roomId }, (response: any) => {
        if (!response.success) {
          console.error('[GameRoom] Falha ao restaurar estado do jogo:', response.error);
        }
      });
    }
  }, [room?.status, gameStarted, roomId]);

  useEffect(() => {
    if (gameEnded) {
      setShowResult(true);
      refreshUser();
    }
  }, [gameEnded, refreshUser]);

  useEffect(() => {
    // Sai do modo de adivinhação ao mudar de turno
    if (!isMyTurn) setGuessingMode(false);
  }, [isMyTurn]);

  useEffect(() => {
    if (!gameState || !gameStarted) return;
    const currentId = gameState.currentTurnPlayerId;
    if (prevTurnPlayerRef.current !== null && prevTurnPlayerRef.current !== currentId) {
      prevTurnPlayerRef.current = currentId;
      setTurnBannerMyTurn(currentId === user?.id);
      setShowTurnBanner(true);
      const timer = setTimeout(() => setShowTurnBanner(false), 2500);
      return () => clearTimeout(timer);
    }
    prevTurnPlayerRef.current = currentId;
  }, [gameState?.currentTurnPlayerId, gameStarted, user?.id]);

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
    if (turnPhase === 'last_chance_my_turn') {
      submitGuess(characterId);
      return;
    }
    if (guessingMode) {
      submitGuess(characterId);
      setGuessingMode(false);
    } else {
      eliminateCharacter(characterId);
    }
  };

  if (!room) return <div className="game-room loading">Carregando...</div>;

  const opponentName = room.players.find(p => p.id !== user?.id)?.username || 'Adversário';
  const isWinner = winnerId === user?.id;

  const equipped = user?.equippedItems ?? {};
  const boardSkinClass = ITEM_BY_ID[equipped.boardSkin ?? DEFAULT_EQUIPPED.boardSkin]?.cssClass ?? '';
  const cardFrameClass = ITEM_BY_ID[equipped.cardFrame ?? DEFAULT_EQUIPPED.cardFrame]?.cssClass ?? '';
  const myBannerClass = ITEM_BY_ID[equipped.turnBanner ?? DEFAULT_EQUIPPED.turnBanner]?.cssClass ?? 'banner-default';
  const oppBannerClass = ITEM_BY_ID[opponentProfile?.equippedItems?.turnBanner ?? DEFAULT_EQUIPPED.turnBanner]?.cssClass ?? 'banner-default';
  const myProfileFrameClass = ITEM_BY_ID[equipped.profileFrame ?? DEFAULT_EQUIPPED.profileFrame]?.cssClass ?? '';
  const oppProfileFrameClass = ITEM_BY_ID[opponentProfile?.equippedItems?.profileFrame ?? DEFAULT_EQUIPPED.profileFrame]?.cssClass ?? '';

  const renderPlayersBar = () => {
    if (!gameStarted) return null;

    const myLP = user?.leaguePoints ?? 0;
    const oppLP = opponentProfile?.leaguePoints ?? 0;

    return (
      <div className="players-bar">
        {/* My card */}
        <div className={`player-card player-card-me ${isMyTurn ? `active ${myBannerClass}` : 'inactive'}`}>
          <UserAvatar
            username={user?.username ?? ''}
            avatarUrl={user?.avatarUrl}
            size={52}
            profileFrameClass={myProfileFrameClass}
          />
          <div className="player-card-info">
            <span className="player-card-name">{user?.username ?? 'Você'}</span>
            <span className="player-card-league">
              {LEAGUE_ICON[getLeagueKey(myLP)]} {myLP} LP
            </span>
          </div>
          {isMyTurn && <div className="player-card-turn-label">⚡ Seu turno</div>}
        </div>

        {/* VS */}
        <div className="players-bar-vs">VS</div>

        {/* Opponent card */}
        <div className={`player-card player-card-opp ${!isMyTurn ? `active ${oppBannerClass}` : 'inactive'}`}>
          <UserAvatar
            username={opponentProfile?.username ?? opponentName}
            avatarUrl={opponentProfile?.avatarUrl}
            size={52}
            profileFrameClass={oppProfileFrameClass}
          />
          <div className="player-card-info">
            <span className="player-card-name">{opponentProfile?.username ?? opponentName}</span>
            <span className="player-card-league">
              {LEAGUE_ICON[getLeagueKey(oppLP)]} {oppLP} LP
            </span>
            {characters.length > 0 && (
              <span className="player-card-remaining">
                🎭 {characters.length - opponentEliminatedCount} personagens
              </span>
            )}
          </div>
          {!isMyTurn && <div className="player-card-turn-label">⏳ Pensando...</div>}
        </div>
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

    // Meu turno: preciso fazer uma pergunta (apenas modo online)
    if (turnPhase === 'my_turn_ask' && gameMode === 'online') {
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
              : gameMode === 'local'
                ? '💬 Faça sua pergunta verbalmente. Clique nos personagens para eliminá-los.'
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
          <p className="action-hint">
            {gameMode === 'local'
              ? `Aguarde ${opponentName} fazer sua pergunta verbalmente e eliminar os personagens.`
              : `Aguarde o adversário fazer sua pergunta...`}
          </p>
        </div>
      );
    }

    // Última chance: minha vez de adivinhar
    if (turnPhase === 'last_chance_my_turn') {
      return (
        <div className="action-area last-chance-area">
          <h3>⚡ Última Chance!</h3>
          <p className="action-hint">
            {opponentName} acertou o seu personagem, mas você ainda tem uma chance!
            Clique no personagem que você acha que é de {opponentName}.
          </p>
          {error && <div className="error-message">{error}</div>}
          {guessResult && !gameEnded && (
            <div className={`guess-feedback ${guessResult.isCorrect ? 'correct' : 'incorrect'}`}>
              {guessResult.message}
            </div>
          )}
        </div>
      );
    }

    // Última chance: aguardando o adversário adivinhar
    if (turnPhase === 'last_chance_opponent_turn') {
      return (
        <div className="action-area waiting-area last-chance-area">
          <h3>⚡ Última Chance do Adversário!</h3>
          <p className="action-hint">
            Você acertou! Mas {opponentName} ainda tem uma última chance de adivinhar o seu personagem.
            {guessResult && ` Você acertou: era ${guessResult.characterName}!`}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`game-room-page ${boardSkinClass}`} style={{ minHeight: '100vh' }}>
      <SkinEffectLayer skinClass={boardSkinClass} />
      <div className="game-header">
        <div className="header-left">
          <h1>{room.name}</h1>
        </div>
        <Button variant="secondary" size="small" onClick={handleBackToLobby}>
          Voltar ao Lobby
        </Button>
      </div>

      {renderPlayersBar()}

      {!gameStarted ? (
        <div className="game-waiting">
          <div className="waiting-content">
            {room.status === 'playing' ? (
              <>
                <h2>Restaurando Partida...</h2>
                <p className="action-hint">Reconectando ao jogo em andamento</p>
              </>
            ) : (
              <>
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
              </>
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
            {gameMode === 'online' && (
              <div className="question-history-section">
                <h3>Histórico de perguntas</h3>
                <QuestionHistory questions={questions} currentUsername={user?.username} />
              </div>
            )}
          </div>

          {/* Painel direito: grade de personagens */}
          <div className="game-panel right-panel">
            <div className="grid-header">
              <h3>Personagens do adversário</h3>
              <div className="character-stats">
                <span className="remaining-count">
                  {characters.length - opponentEliminatedCount} restantes
                </span>
                {isMyTurn && turnPhase !== 'my_turn_ask' && turnPhase !== 'my_turn_wait_answer' && (
                  <span className="eliminated-count">
                    {eliminatedCharacters.size} eliminados
                  </span>
                )}
              </div>
            </div>
            <CharacterGrid
              characters={characters}
              eliminatedCharacters={eliminatedCharacters}
              onCardClick={handleGuessCharacter}
              guessingMode={guessingMode || turnPhase === 'last_chance_my_turn'}
              interactive={(isMyTurn && turnPhase === 'my_turn_after_answer') || turnPhase === 'last_chance_my_turn'}
              isLoading={isLoading}
              cardFrameClass={cardFrameClass}
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
          lastChanceSuccess={lastChanceSuccess}
          onClose={handleCloseResult}
        />
      )}

      {showTurnBanner && (
        <div className="turn-announcement-overlay">
          {turnBannerMyTurn ? (
            <div className={`turn-announcement-card ${myBannerClass}`}>
              <span className="turn-announcement-icon">⚡</span>
              <div className="turn-announcement-title">SEU TURNO!</div>
            </div>
          ) : (
            <div className={`turn-announcement-card turn-announcement-card--opp ${oppBannerClass}`}>
              <div className="turn-announcement-player">
                <UserAvatar
                  username={opponentProfile?.username ?? opponentName}
                  avatarUrl={opponentProfile?.avatarUrl}
                  size={68}
                  profileFrameClass={oppProfileFrameClass}
                />
                <div className="turn-announcement-player-info">
                  <span className="turn-announcement-label">VEZ DE</span>
                  <span className="turn-announcement-name">
                    {opponentProfile?.username ?? opponentName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
