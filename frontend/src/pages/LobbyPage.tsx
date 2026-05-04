import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { socketService } from '../services/socketService';
import { API_URL } from '../utils/constants';
import type { Theme } from '../types/index';
import { Button } from '../components/common/Button';
import { UserAvatar } from '../components/common/UserAvatar';
import { ITEM_BY_ID, DEFAULT_EQUIPPED } from '../utils/shopItems';
import './LobbyPage.css';

type League = 'bronze' | 'prata' | 'ouro' | 'diamante' | 'campeao';

const LEAGUE_BADGE: Record<League, { icon: string; color: string; bg: string }> = {
  campeao:  { icon: '👑', color: '#7c3aed', bg: '#f5f3ff' },
  diamante: { icon: '💎', color: '#0891b2', bg: '#ecfeff' },
  ouro:     { icon: '🏆', color: '#d97706', bg: '#fffbeb' },
  prata:    { icon: '🥈', color: '#6b7280', bg: '#f9fafb' },
  bronze:   { icon: '🥉', color: '#b45309', bg: '#fef3c7' },
};

function getUserLeague(lp: number): League {
  if (lp >= 500) return 'diamante';
  if (lp >= 250) return 'ouro';
  if (lp >= 100) return 'prata';
  return 'bronze';
}

const THEME_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { rooms, setRooms } = useGame();
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [selectedMode, setSelectedMode] = useState<'online' | 'local'>('online');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeError, setThemeError] = useState<string | null>(null);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/themes`);
        if (!response.ok) throw new Error('Falha ao carregar temas');
        const data = await response.json();
        setThemes(data.themes || []);
        setThemeError(null);
      } catch {
        setThemeError('Não foi possível carregar os temas disponíveis.');
      }
    };
    loadThemes();
  }, []);

  useEffect(() => {
    socketService.waitForConnection().then(() => {
      socketService.listRooms((response: { rooms: Parameters<typeof setRooms>[0] }) => {
        if (response.rooms) setRooms(response.rooms);
      });
    });
  }, [setRooms]);

  useEffect(() => {
    const handleRoomsUpdated = (data: { rooms: Parameters<typeof setRooms>[0] }) => {
      setRooms(data.rooms);
    };
    socketService.on('rooms_updated', handleRoomsUpdated);
    return () => { socketService.off('rooms_updated', handleRoomsUpdated); };
  }, [setRooms]);

  const handleLogout = () => {
    logout();
    socketService.disconnect();
    navigate('/login');
  };

  const handleCreateRoom = () => {
    if (!selectedThemeId || !roomName.trim()) return;
    localStorage.setItem('gameMode', selectedMode);
    socketService.createRoom(selectedThemeId, roomName, selectedMode, (response) => {
      if (response.success) navigate(`/room/${response.roomId}`);
    });
  };

  const handleJoinRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room?.gameMode) localStorage.setItem('gameMode', room.gameMode);
    socketService.joinRoom(roomId, (response) => {
      if (response.success) navigate(`/room/${roomId}`);
    });
  };

  const lp = user?.leaguePoints ?? 0;
  const league = getUserLeague(lp);
  const badge = LEAGUE_BADGE[league];
  const coins = user?.coins ?? 0;
  const profileFrameClass = ITEM_BY_ID[user?.equippedItems?.profileFrame ?? DEFAULT_EQUIPPED.profileFrame]?.cssClass ?? '';

  const waitingRooms = rooms.filter(r => r.status === 'waiting');
  const playingRooms = rooms.filter(r => r.status === 'playing');
  const myActiveRoom = playingRooms.find(r => r.playerIds?.includes(user?.id || ''));

  const selectedTheme = themes.find(t => t.id === selectedThemeId);

  return (
    <div className="lobby-page">

      {/* ── Header ── */}
      <header className="lobby-header">
        <div className="lobby-header-brand">
          <div className="lobby-logo">🎭</div>
          <div>
            <h1 className="lobby-title">Cara a Cara</h1>
            <p className="lobby-subtitle">Adivinhe o personagem do adversário</p>
          </div>
        </div>

        <div className="lobby-header-user">
          <div
            className="user-league-chip"
            style={{ background: badge.bg, border: `1.5px solid ${badge.color}`, color: badge.color }}
            onClick={() => navigate('/ranking')}
            title="Ver ranking"
          >
            <span>{badge.icon}</span>
            <span className="chip-lp">{lp} LP</span>
          </div>

          <div
            className="user-coins-chip"
            onClick={() => navigate('/shop')}
            title="Ir à loja"
          >
            <span>🪙</span>
            <span>{coins}</span>
          </div>

          <UserAvatar
            username={user?.username || ''}
            avatarUrl={user?.avatarUrl}
            size={40}
            className="user-avatar"
            onClick={() => navigate('/profile')}
            profileFrameClass={profileFrameClass}
          />

          <div className="header-nav">
            <button className="header-nav-btn" onClick={() => navigate('/shop')}>Loja</button>
            <button className="header-nav-btn" onClick={() => navigate('/ranking')}>Ranking</button>
            <button className="header-nav-btn" onClick={() => navigate('/profile')}>Perfil</button>
            <button className="header-nav-btn header-nav-logout" onClick={handleLogout}>Sair</button>
          </div>
        </div>
      </header>

      <div className="lobby-body">

        {/* ── Active game banner ── */}
        {myActiveRoom && (
          <div className="active-game-banner">
            <div className="active-game-info">
              <span className="active-pulse" />
              <span>Partida em andamento: <strong>{myActiveRoom.name}</strong></span>
            </div>
            <Button size="small" onClick={() => navigate(`/room/${myActiveRoom.id}`)}>
              Voltar para a Partida →
            </Button>
          </div>
        )}

        <div className="lobby-columns">

          {/* ── LEFT: Create room ── */}
          <section className="create-section">
            <h2 className="section-title">Nova Partida</h2>

            {/* Step 1: Theme */}
            <div className="form-step">
              <label className="form-step-label">
                <span className="step-number">1</span> Escolha o tema
              </label>

              {themeError && <p className="form-error">{themeError}</p>}

              {themes.length === 0 && !themeError && (
                <div className="themes-loading">Carregando temas...</div>
              )}

              {themes.length > 0 && (
                <div className="theme-grid">
                  {themes.map((theme, i) => {
                    const isSelected = theme.id === selectedThemeId;
                    const gradient = THEME_GRADIENTS[i % THEME_GRADIENTS.length];
                    return (
                      <button
                        key={theme.id}
                        className={`theme-card ${isSelected ? 'theme-card-selected' : ''}`}
                        onClick={() => setSelectedThemeId(theme.id)}
                        type="button"
                      >
                        <div
                          className="theme-card-cover"
                          style={{
                            background: theme.coverImageUrl ? undefined : gradient,
                          }}
                        >
                          {theme.coverImageUrl
                            ? <img src={theme.coverImageUrl} alt={theme.name} />
                            : <span className="theme-card-initial">{theme.name.charAt(0)}</span>
                          }
                          {isSelected && <div className="theme-card-check">✓</div>}
                        </div>
                        <div className="theme-card-info">
                          <span className="theme-card-name">{theme.name}</span>
                          {theme.description && (
                            <span className="theme-card-desc">{theme.description}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Room name */}
            <div className="form-step">
              <label className="form-step-label">
                <span className="step-number">2</span> Nome da sala
              </label>
              <input
                className="lobby-input"
                type="text"
                placeholder="Ex: Partida do João"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
              />
            </div>

            {/* Step 3: Mode */}
            <div className="form-step">
              <label className="form-step-label">
                <span className="step-number">3</span> Modo de jogo
              </label>
              <div className="mode-cards">
                <button
                  className={`mode-card ${selectedMode === 'online' ? 'mode-card-active' : ''}`}
                  onClick={() => setSelectedMode('online')}
                  type="button"
                >
                  <span className="mode-card-icon">🌐</span>
                  <span className="mode-card-title">Online</span>
                  <span className="mode-card-desc">Digite perguntas e respostas</span>
                </button>
                <button
                  className={`mode-card ${selectedMode === 'local' ? 'mode-card-active' : ''}`}
                  onClick={() => setSelectedMode('local')}
                  type="button"
                >
                  <span className="mode-card-icon">🤝</span>
                  <span className="mode-card-title">Presencial</span>
                  <span className="mode-card-desc">Perguntas faladas ao vivo</span>
                </button>
              </div>
            </div>

            {/* Create button */}
            <div className="create-btn-row">
              {selectedTheme && (
                <div className="create-summary">
                  <div
                    className="create-summary-thumb"
                    style={{ background: selectedTheme.coverImageUrl ? undefined : THEME_GRADIENTS[themes.indexOf(selectedTheme) % THEME_GRADIENTS.length] }}
                  >
                    {selectedTheme.coverImageUrl
                      ? <img src={selectedTheme.coverImageUrl} alt="" />
                      : selectedTheme.name.charAt(0)
                    }
                  </div>
                  <span>{selectedTheme.name} · {selectedMode === 'online' ? 'Online' : 'Presencial'}</span>
                </div>
              )}
              <Button
                onClick={handleCreateRoom}
                disabled={!selectedThemeId || !roomName.trim() || themes.length === 0}
                size="large"
              >
                Criar Sala
              </Button>
            </div>
          </section>

          {/* ── RIGHT: Rooms list ── */}
          <section className="rooms-section">
            <h2 className="section-title">
              Salas Disponíveis
              {waitingRooms.length > 0 && (
                <span className="section-count">{waitingRooms.length}</span>
              )}
            </h2>

            {waitingRooms.length === 0 ? (
              <div className="rooms-empty">
                <span className="rooms-empty-icon">🎮</span>
                <p>Nenhuma sala disponível.</p>
                <p>Crie uma e convide alguém!</p>
              </div>
            ) : (
              <div className="rooms-grid">
                {waitingRooms.map(room => {
                  const theme = themes.find(t => t.id === room.themeId);
                  const gradient = THEME_GRADIENTS[themes.indexOf(theme!) % THEME_GRADIENTS.length] || THEME_GRADIENTS[0];
                  return (
                    <div key={room.id} className="room-card">
                      <div
                        className="room-card-cover"
                        style={{ background: theme?.coverImageUrl ? undefined : gradient }}
                      >
                        {theme?.coverImageUrl
                          ? <img src={theme.coverImageUrl} alt={theme.name} />
                          : <span className="room-cover-initial">{theme?.name?.charAt(0) ?? '?'}</span>
                        }
                        <span className={`room-mode-pill room-mode-${room.gameMode || 'online'}`}>
                          {room.gameMode === 'local' ? '🤝 Local' : '🌐 Online'}
                        </span>
                      </div>
                      <div className="room-card-body">
                        <h3 className="room-card-name">{room.name}</h3>
                        <p className="room-card-theme">{theme?.name ?? room.themeId}</p>
                        <div className="room-card-footer">
                          <div className="room-players">
                            {Array.from({ length: room.maxPlayers }).map((_, i) => (
                              <div
                                key={i}
                                className={`player-dot ${i < room.playerCount ? 'player-dot-filled' : ''}`}
                              />
                            ))}
                            <span>{room.playerCount}/{room.maxPlayers}</span>
                          </div>
                          <Button
                            size="small"
                            onClick={() => handleJoinRoom(room.id)}
                            disabled={room.playerCount >= room.maxPlayers}
                          >
                            Entrar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {playingRooms.length > 0 && (
              <>
                <h2 className="section-title section-title-mt">
                  Em Andamento
                  <span className="section-count">{playingRooms.length}</span>
                </h2>
                <div className="rooms-grid">
                  {playingRooms.map(room => {
                    const isMyGame = room.playerIds?.includes(user?.id || '');
                    const theme = themes.find(t => t.id === room.themeId);
                    const gradient = THEME_GRADIENTS[themes.indexOf(theme!) % THEME_GRADIENTS.length] || THEME_GRADIENTS[0];
                    return (
                      <div key={room.id} className={`room-card room-card-playing ${isMyGame ? 'room-card-mine' : ''}`}>
                        <div
                          className="room-card-cover"
                          style={{ background: theme?.coverImageUrl ? undefined : gradient, opacity: 0.75 }}
                        >
                          {theme?.coverImageUrl
                            ? <img src={theme.coverImageUrl} alt={theme.name} />
                            : <span className="room-cover-initial">{theme?.name?.charAt(0) ?? '?'}</span>
                          }
                          <span className="room-live-pill">● AO VIVO</span>
                          <span className={`room-mode-pill room-mode-${room.gameMode || 'online'}`}>
                            {room.gameMode === 'local' ? '🤝 Local' : '🌐 Online'}
                          </span>
                        </div>
                        <div className="room-card-body">
                          <h3 className="room-card-name">{room.name}</h3>
                          <p className="room-card-theme">{theme?.name ?? room.themeId}</p>
                          <div className="room-card-footer">
                            <div className="room-players">
                              {Array.from({ length: room.maxPlayers }).map((_, i) => (
                                <div key={i} className="player-dot player-dot-filled" />
                              ))}
                              <span>{room.playerCount}/{room.maxPlayers}</span>
                            </div>
                            {isMyGame
                              ? <Button size="small" onClick={() => navigate(`/room/${room.id}`)}>Reconectar</Button>
                              : <Button size="small" disabled>Assistir</Button>
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};
