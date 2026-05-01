"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const roomService_1 = require("./services/roomService");
const socketAuth_1 = require("./middleware/socketAuth");
dotenv_1.default.config();
const { PrismaClient } = require('@prisma/client');
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
exports.prisma = new PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// --- Rotas da API REST ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API do Cara a Cara está rodando!' });
});
app.use('/api/auth', auth_1.default);
// --- Socket.IO Middleware ---
io.use(socketAuth_1.socketAuthMiddleware);
// --- Socket.IO Connection ---
io.on('connection', async (socket) => {
    console.log(`[Socket] Usuário ${socket.userId} conectado: ${socket.id}`);
    // Buscar username do banco de dados
    try {
        const user = await exports.prisma.user.findUnique({ where: { id: socket.userId } });
        if (user) {
            socket.username = user.username;
        }
    }
    catch (error) {
        console.error('Erro ao buscar usuário:', error);
    }
    // Emit salas disponíveis ao conectar
    socket.emit('rooms_updated', { rooms: roomService_1.roomService.getAvailableRoomsDTO() });
    // --- Evento: create_room ---
    socket.on('create_room', async (data, callback) => {
        try {
            const { themeId, roomName } = data;
            // Validar se tema existe
            const theme = await exports.prisma.theme.findUnique({ where: { id: themeId } });
            if (!theme) {
                return callback({ success: false, error: 'Tema não encontrado' });
            }
            // Criar sala
            const room = roomService_1.roomService.createRoom(themeId, roomName, socket.userId, socket.username || 'Anônimo');
            socket.join(room.id);
            // Notificar todos sobre salas atualizadas
            io.emit('rooms_updated', { rooms: roomService_1.roomService.getAvailableRoomsDTO() });
            const response = { success: true, roomId: room.id, room: roomService_1.roomService.roomToDTO(room) };
            callback(response);
            console.log(`[Room] Sala criada: ${room.id} por ${socket.username}`);
        }
        catch (error) {
            console.error('Erro ao criar sala:', error);
            callback({ success: false, error: 'Erro ao criar sala' });
        }
    });
    // --- Evento: join_room ---
    socket.on('join_room', (data, callback) => {
        try {
            const { roomId } = data;
            const room = roomService_1.roomService.getRoomById(roomId);
            if (!room) {
                return callback({ success: false, error: 'Sala não encontrada' });
            }
            if (!roomService_1.roomService.joinRoom(roomId, socket.userId, socket.username || 'Anônimo')) {
                return callback({ success: false, error: 'Não foi possível entrar na sala' });
            }
            socket.join(roomId);
            // Notificar todos sobre salas atualizadas
            io.emit('rooms_updated', { rooms: roomService_1.roomService.getAvailableRoomsDTO() });
            // Notificar a sala que um jogador entrou
            io.to(roomId).emit('player_joined', {
                roomId,
                playerCount: room.players.length,
                username: socket.username || 'Anônimo',
            });
            callback({ success: true, room: roomService_1.roomService.roomToDTO(room) });
            console.log(`[Room] ${socket.username} entrou na sala ${roomId}`);
        }
        catch (error) {
            console.error('Erro ao entrar em sala:', error);
            callback({ success: false, error: 'Erro ao entrar em sala' });
        }
    });
    // --- Evento: leave_room ---
    socket.on('leave_room', (data, callback) => {
        try {
            const { roomId } = data;
            roomService_1.roomService.leaveRoom(roomId, socket.userId);
            socket.leave(roomId);
            // Notificar a sala que um jogador saiu
            const room = roomService_1.roomService.getRoomById(roomId);
            if (room) {
                io.to(roomId).emit('player_left', {
                    roomId,
                    playerCount: room.players.length,
                });
                // Deletar sala se estiver vazia
                roomService_1.roomService.deleteRoomIfEmpty(roomId);
            }
            // Notificar todos sobre salas atualizadas
            io.emit('rooms_updated', { rooms: roomService_1.roomService.getAvailableRoomsDTO() });
            callback?.({ success: true });
            console.log(`[Room] ${socket.username} saiu da sala ${roomId}`);
        }
        catch (error) {
            console.error('Erro ao sair de sala:', error);
            callback?.({ success: false, error: 'Erro ao sair de sala' });
        }
    });
    // --- Evento: list_rooms ---
    socket.on('list_rooms', (callback) => {
        callback({ rooms: roomService_1.roomService.getAvailableRoomsDTO() });
    });
    // --- Evento: disconnect ---
    socket.on('disconnect', () => {
        console.log(`[Socket] Usuário ${socket.username} desconectado: ${socket.id}`);
        // Nota: Socket.IO remove automaticamente o socket de todas as rooms
        // mas precisamos limpar o RoomService
        const allRooms = roomService_1.roomService.getAllRooms();
        for (const room of allRooms) {
            if (room.players.some(p => p.id === socket.userId)) {
                roomService_1.roomService.leaveRoom(room.id, socket.userId);
                roomService_1.roomService.deleteRoomIfEmpty(room.id);
            }
        }
        io.emit('rooms_updated', { rooms: roomService_1.roomService.getAvailableRoomsDTO() });
    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`[Server] Rodando na porta http://localhost:${PORT}`);
});
