import { v4 as uuidv4 } from 'uuid';
import { Room, Player, GameStatus, RoomWithoutPassword } from '../types/index';

export class RoomService {
  private rooms: Map<string, Room> = new Map();

  generateRoomId(): string {
    return uuidv4();
  }

  createRoom(themeId: string, roomName: string, userId: string, username: string): Room {
    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      name: roomName,
      themeId,
      players: [{ id: userId, username, joinedAt: new Date() }],
      maxPlayers: 2,
      createdAt: new Date(),
      status: 'waiting',
    };
    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, userId: string, username: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.players.length >= room.maxPlayers) return false;
    if (room.players.some(p => p.id === userId)) return false;

    room.players.push({ id: userId, username, joinedAt: new Date() });
    return true;
  }

  leaveRoom(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.players = room.players.filter(p => p.id !== userId);
    }
  }

  getRoomById(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  getAvailableRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(room => room.status === 'waiting');
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  deleteRoomIfEmpty(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room && room.players.length === 0) {
      this.rooms.delete(roomId);
    }
  }

  updateRoomStatus(roomId: string, status: 'waiting' | 'starting' | 'playing' | 'finished'): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
    }
  }

  roomToDTO(room: Room): RoomWithoutPassword {
    return {
      id: room.id,
      name: room.name,
      themeId: room.themeId,
      playerCount: room.players.length,
      playerIds: room.players.map(p => p.id),
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt,
      status: room.status,
    };
  }

  getAvailableRoomsDTO(): RoomWithoutPassword[] {
    return this.getAvailableRooms().map(room => this.roomToDTO(room));
  }

  getAllNonFinishedRoomsDTO(): RoomWithoutPassword[] {
    return Array.from(this.rooms.values())
      .filter(room => room.status !== 'finished')
      .map(room => this.roomToDTO(room));
  }
}

export const roomService = new RoomService();
