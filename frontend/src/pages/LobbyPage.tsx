import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { socketService } from '../services/socketService';
import { API_URL } from '../utils/constants';
import type { Theme } from '../types/index';
import { Button } from '../components/common/Button';
import './LobbyPage.css';

export const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { rooms, setRooms } = useGame();
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeError, setThemeError] = useState<string | null>(null);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/themes`);

        if (!response.ok) {
          throw new Error('Falha ao carregar temas');
        }

        const data = await response.json();
        setThemes(data.themes || []);
        setThemeError(null);
      } catch (error) {
        console.error('Erro ao carregar temas:', error);
        setThemeError('Não foi possível carregar os temas disponíveis.');
      }
    };

    loadThemes();
  }, []);

  useEffect(() => {
    const handleRoomsUpdated = (data: { rooms: Parameters<typeof setRooms>[0] }) => {
      setRooms(data.rooms);
    };

    socketService.on('rooms_updated', handleRoomsUpdated);

    return () => {
      socketService.off('rooms_updated', handleRoomsUpdated);
    };
  }, [setRooms]);

  const handleLogout = () => {
    logout();
    socketService.disconnect();
    navigate('/login');
  };

  const handleCreateRoom = () => {
    if (!selectedThemeId || !roomName.trim()) {
      return;
    }

    socketService.createRoom(selectedThemeId, roomName, (response) => {
      if (response.success) {
        navigate(`/room/${response.roomId}`);
      }
    });
  };

  const handleJoinRoom = (roomId: string) => {
    socketService.joinRoom(roomId, (response) => {
      if (response.success) {
        navigate(`/room/${roomId}`);
      }
    });
  };

  return (
    <div className="lobby-page">
      <div className="lobby-header">
        <h1>Cara a Cara - Lobby</h1>
        <div className="header-right">
          <span>Bem-vindo, {user?.username}!</span>
          <Button variant="danger" size="small" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>

      <div className="lobby-content">
        <div className="create-room-section">
          <h2>Criar Nova Sala</h2>
          {themeError && <p className="empty-message">{themeError}</p>}
          <div className="create-form">
            <select
              value={selectedThemeId}
              onChange={e => setSelectedThemeId(e.target.value)}
              disabled={themes.length === 0}
            >
              <option value="">Selecione um tema</option>
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nome da sala"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
            />
            <Button
              onClick={handleCreateRoom}
              disabled={!selectedThemeId || !roomName.trim() || themes.length === 0}
            >
              Criar Sala
            </Button>
          </div>
        </div>

        <div className="rooms-section">
          <h2>Salas Disponíveis ({rooms.length})</h2>
          {rooms.length === 0 ? (
            <p className="empty-message">Nenhuma sala disponível. Crie uma!</p>
          ) : (
            <div className="rooms-grid">
              {rooms.map(room => (
                <div key={room.id} className="room-card">
                  <h3>{room.name}</h3>
                  <p className="theme">Tema: {room.themeId}</p>
                  <p className="players">
                    Jogadores: {room.playerCount}/{room.maxPlayers}
                  </p>
                  <Button
                    size="small"
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={room.playerCount >= room.maxPlayers}
                  >
                    Entrar na Sala
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
