"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomService = exports.RoomService = void 0;
const uuid_1 = require("uuid");
class RoomService {
    rooms = new Map();
    generateRoomId() {
        return (0, uuid_1.v4)();
    }
    createRoom(themeId, roomName, userId, username) {
        const roomId = this.generateRoomId();
        const room = {
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
    joinRoom(roomId, userId, username) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        if (room.players.length >= room.maxPlayers)
            return false;
        if (room.players.some(p => p.id === userId))
            return false;
        room.players.push({ id: userId, username, joinedAt: new Date() });
        return true;
    }
    leaveRoom(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.players = room.players.filter(p => p.id !== userId);
        }
    }
    getRoomById(roomId) {
        return this.rooms.get(roomId) || null;
    }
    getAvailableRooms() {
        return Array.from(this.rooms.values()).filter(room => room.status === 'waiting');
    }
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    deleteRoomIfEmpty(roomId) {
        const room = this.rooms.get(roomId);
        if (room && room.players.length === 0) {
            this.rooms.delete(roomId);
        }
    }
    updateRoomStatus(roomId, status) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.status = status;
        }
    }
    roomToDTO(room) {
        return {
            id: room.id,
            name: room.name,
            themeId: room.themeId,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers,
            createdAt: room.createdAt,
            status: room.status,
        };
    }
    getAvailableRoomsDTO() {
        return this.getAvailableRooms().map(room => this.roomToDTO(room));
    }
}
exports.RoomService = RoomService;
exports.roomService = new RoomService();
