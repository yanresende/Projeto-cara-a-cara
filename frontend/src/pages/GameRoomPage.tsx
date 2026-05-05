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

function renderSkinEffect(skinClass: string): React.ReactNode {
  if (skinClass === 'skin-enchanted-forest') {
    const lefts   = [3, 9, 17, 23, 31, 38, 45, 52, 59, 66, 73, 80, 87, 92, 97];
    const delays  = [0, 2.1, 0.7, 3.5, 1.3, 4.2, 0.3, 5.1, 2.8, 1.0, 3.9, 0.5, 2.4, 4.7, 1.8];
    const durs    = [9, 11, 8, 13, 7.5, 10, 9.5, 12, 8.5, 11.5, 7, 10.5, 9, 13, 8];
    const sizes   = [14, 16, 12, 18, 11, 15, 17, 13, 16, 14, 18, 12, 15, 11, 17];
    const emojis  = ['🍃', '🍂', '🌿'];
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(15)].map((_, i) => (
          <span
            key={i}
            className="forest-leaf"
            style={{
              left: `${lefts[i]}%`,
              animationDelay: `${delays[i]}s`,
              animationDuration: `${durs[i]}s`,
              fontSize: `${sizes[i]}px`,
            }}
          >
            {emojis[i % 3]}
          </span>
        ))}
      </div>
    );
  }

  if (skinClass === 'skin-sunset') {
    const angles  = [-60, -30, 0, 30, 60];
    const delays  = [0, 1.5, 0.5, 2, 1];
    const widths  = [70, 90, 110, 85, 95];
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="sun-ray"
            style={{
              '--ray-angle': `${angles[i]}deg`,
              animationDelay: `${delays[i]}s`,
              width: `${widths[i]}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    );
  }

  if (skinClass === 'skin-galaxy') {
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="galaxy-star"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${(i * 0.37) % 5}s`,
              animationDuration: `${2 + (i % 4) * 0.8}s`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
            }}
          />
        ))}
        <div className="shooting-star" />
        <div className="shooting-star" style={{ animationDelay: '8s', top: '18%', left: '65%' }} />
      </div>
    );
  }

  if (skinClass === 'skin-neon-city') {
    const tops    = [8, 22, 38, 55, 70, 85];
    const delays  = [0, 2.3, 1.1, 3.7, 0.5, 4.5];
    const durs    = [6, 8, 5, 7, 9, 6.5];
    const colors  = ['#00fff9', '#ff00aa', '#aa00ff', '#00ff88', '#ff6600', '#0099ff'];
    const heights = [1, 2, 1, 2, 1, 2];
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="neon-scan-line"
            style={{
              top: `${tops[i]}%`,
              animationDelay: `${delays[i]}s`,
              animationDuration: `${durs[i]}s`,
              background: colors[i],
              boxShadow: `0 0 8px 2px ${colors[i]}`,
              height: `${heights[i]}px`,
            }}
          />
        ))}
      </div>
    );
  }

  if (skinClass === 'skin-dark-void') {
    const sizes    = [800, 600, 420, 280, 160];
    const spinDurs = [30, 22, 16, 11, 8];
    const borders  = [
      'rgba(100,0,255,0.28)', 'rgba(60,0,200,0.22)',
      'rgba(30,0,180,0.18)',  'rgba(80,0,255,0.22)',
      'rgba(120,0,255,0.32)',
    ];
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`void-ring ${i % 2 === 0 ? 'void-ring-cw' : 'void-ring-ccw'}`}
            style={{
              width: `${sizes[i]}px`,
              height: `${sizes[i]}px`,
              animationDuration: `${spinDurs[i]}s`,
              borderColor: borders[i],
            }}
          />
        ))}
        <div className="void-core" />
      </div>
    );
  }

  return null;
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

    return null;
  };

  return (
    <div className={`game-room-page ${boardSkinClass}`}>
      {renderSkinEffect(boardSkinClass)}
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
              guessingMode={guessingMode}
              interactive={isMyTurn && (turnPhase === 'my_turn_after_answer')}
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
