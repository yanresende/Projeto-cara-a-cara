import { io, Socket } from 'socket.io-client';
import { WS_URL, SOCKET_EVENTS } from '../utils/constants';

type SocketCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<SocketCallback>> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(WS_URL, {
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          console.log('[Socket] Conectado ao servidor');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('[Socket] Erro de conexão:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('[Socket] Desconectado do servidor');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  on(event: string, callback: SocketCallback): void {
    if (!this.socket) return;

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    this.socket.on(event, callback);
  }

  off(event: string, callback: SocketCallback): void {
    if (!this.socket) return;

    this.socket.off(event, callback);

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: string, data?: any, callback?: (response: any) => void): void {
    if (!this.socket) {
      console.error('[Socket] Socket não está conectado');
      return;
    }

    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  // High-level methods
  createRoom(themeId: string, roomName: string, callback: (response: any) => void): void {
    this.emit(SOCKET_EVENTS.CREATE_ROOM, { themeId, roomName }, callback);
  }

  joinRoom(roomId: string, callback: (response: any) => void): void {
    this.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId }, callback);
  }

  leaveRoom(roomId: string, callback?: (response: any) => void): void {
    this.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId }, callback);
  }

  listRooms(callback: (response: any) => void): void {
    this.emit(SOCKET_EVENTS.LIST_ROOMS, callback);
  }

  startGame(roomId: string, callback: (response: any) => void): void {
    this.emit(SOCKET_EVENTS.START_GAME, { roomId }, callback);
  }

  submitQuestion(roomId: string, question: string, callback: (response: any) => void): void {
    this.emit(SOCKET_EVENTS.SUBMIT_QUESTION, { roomId, question }, callback);
  }

  submitGuess(roomId: string, characterId: string, callback: (response: any) => void): void {
    this.emit(SOCKET_EVENTS.SUBMIT_GUESS, { roomId, characterId }, callback);
  }
}

export const socketService = new SocketService();
