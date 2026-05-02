import { Socket } from 'socket.io';
import { RoomWithoutPassword, GameRound } from './index';

export interface CustomSocket extends Socket {
  userId?: string;
  username?: string;
}

export interface ServerToClientEvents {
  rooms_updated: (data: { rooms: RoomWithoutPassword[] }) => void;
  player_joined: (data: { roomId: string; userId: string; username: string; playerCount: number }) => void;
  player_left: (data: { roomId: string; userId: string; playerCount: number }) => void;
  error: (data: { message: string }) => void;
  game_started: (data: { roomId: string; questionerId: string; questionerUsername: string; thinkerId: string; thinkerUsername: string; themeId: string; characters: any[] }) => void;
  game_state_updated: (data: { game: GameRound; currentQuestionerId: string }) => void;
  question_submitted: (data: { question: string; answer: 'sim' | 'nao'; questionerUsername: string }) => void;
  guess_result: (data: { characterName: string; isCorrect: boolean; message: string }) => void;
  game_ended: (data: { winnerId: string; winnerUsername: string; message: string }) => void;
  game_error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  create_room: (data: { themeId: string; roomName: string }, callback: (response: any) => void) => void;
  join_room: (data: { roomId: string }, callback: (response: any) => void) => void;
  leave_room: (data: { roomId: string }, callback: (response: any) => void) => void;
  list_rooms: (callback: (response: { rooms: RoomWithoutPassword[] }) => void) => void;
  get_room: (data: { roomId: string }, callback: (response: any) => void) => void;
  start_game: (data: { roomId: string }, callback: (response: any) => void) => void;
  submit_question: (data: { roomId: string; question: string }, callback: (response: any) => void) => void;
  submit_guess: (data: { roomId: string; characterId: string }, callback: (response: any) => void) => void;
}

export interface InterServerEvents {}

export interface SocketData {}

