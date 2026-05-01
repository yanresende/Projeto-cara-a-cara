export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const GAME_STATUS = {
  WAITING: 'waiting',
  STARTING: 'starting',
  PLAYING: 'playing',
  FINISHED: 'finished',
} as const;

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'cara_cara_token',
  USER: 'cara_cara_user',
} as const;

export const SOCKET_EVENTS = {
  // Server to Client
  ROOMS_UPDATED: 'rooms_updated',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTED: 'game_started',
  QUESTION_SUBMITTED: 'question_submitted',
  GUESS_RESULT: 'guess_result',
  GAME_ENDED: 'game_ended',
  GAME_ERROR: 'game_error',
  ERROR: 'error',

  // Client to Server
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  LIST_ROOMS: 'list_rooms',
  START_GAME: 'start_game',
  SUBMIT_QUESTION: 'submit_question',
  SUBMIT_GUESS: 'submit_guess',
} as const;

export const THEME_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  dark: '#1f2937',
  light: '#f3f4f6',
} as const;
