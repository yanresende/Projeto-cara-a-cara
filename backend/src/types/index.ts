import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    isAdmin: boolean;
  };
}

export interface AuthPayload {
  userId: string;
  isAdmin?: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string | null;
  score: number;
  gamesPlayed: number;
  gamesWon: number;
  leaguePoints: number;
  isAdmin?: boolean;
}

export type GameStatus = 'waiting' | 'starting' | 'playing' | 'finished';

export interface Player {
  id: string;
  username: string;
  joinedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  themeId: string;
  players: Player[];
  maxPlayers: number;
  createdAt: Date;
  status: GameStatus;
  gameMode: 'online' | 'local';
}

export interface RoomWithoutPassword {
  id: string;
  name: string;
  themeId: string;
  playerCount: number;
  playerIds: string[];
  maxPlayers: number;
  createdAt: Date;
  status: GameStatus;
  gameMode: 'online' | 'local';
}

export interface CreateRoomPayload {
  themeId: string;
  roomName: string;
}

export interface JoinRoomPayload {
  roomId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

// Game-related types
export interface Guess {
  characterId: string;
  createdAt: Date;
  correct: boolean;
}

export interface Question {
  id: string;
  content: string;
  askedBy: string;
  answer: 'sim' | 'nao';
  createdAt: Date;
}

export interface GameRound {
  id: string;
  roomId: string;
  themeId: string;
  player1Id: string;
  player2Id: string;
  player1SecretCharacterId: string;
  player2SecretCharacterId: string;
  currentTurnPlayerId: string;
  hasAskedThisTurn: boolean;
  pendingQuestion: { content: string; askedBy: string } | null;
  waitingForAnswer: boolean;
  questions: Question[];
  guesses: Guess[];
  completed: boolean;
  winner?: string;
  createdAt: Date;
}

export interface GameMessage {
  type: 'game_started' | 'turn_changed' | 'game_ended' | 'question_submitted' | 'guess_submitted';
  payload: any;
}
