import React, { createContext, useContext, useState } from 'react';
import type { RoomWithoutPassword, Room, GameRound, GameMessage } from '../types/index';

interface GameContextType {
  rooms: RoomWithoutPassword[];
  currentRoom: Room | null;
  currentGame: GameRound | null;
  gameStatus: 'waiting' | 'playing' | 'ended';
  messages: GameMessage[];
  setRooms: (rooms: RoomWithoutPassword[]) => void;
  setCurrentRoom: (room: Room | null) => void;
  setCurrentGame: (game: GameRound | null) => void;
  setGameStatus: (status: 'waiting' | 'playing' | 'ended') => void;
  addMessage: (message: GameMessage) => void;
  clearMessages: () => void;
  reset: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<RoomWithoutPassword[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentGame, setCurrentGame] = useState<GameRound | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting');
  const [messages, setMessages] = useState<GameMessage[]>([]);

  const addMessage = (message: GameMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const reset = () => {
    setCurrentRoom(null);
    setCurrentGame(null);
    setGameStatus('waiting');
    setMessages([]);
  };

  return (
    <GameContext.Provider
      value={{
        rooms,
        currentRoom,
        currentGame,
        gameStatus,
        messages,
        setRooms,
        setCurrentRoom,
        setCurrentGame,
        setGameStatus,
        addMessage,
        clearMessages,
        reset,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
