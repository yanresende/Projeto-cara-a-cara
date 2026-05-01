import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import themesRouter from './routes/themes';
import rankingRouter from './routes/ranking';
import { roomService } from './services/roomService';
import { gameService } from './services/gameService';
import { socketAuthMiddleware } from './middleware/socketAuth';
import { CustomSocket, ServerToClientEvents, ClientToServerEvents } from './types/socket';

dotenv.config();

const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

export const prisma: any = new PrismaClient();

app.use(cors());
app.use(express.json());

// --- Rotas da API REST ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API do Cara a Cara está rodando!' });
});

app.use('/api/auth', authRouter);
app.use('/api/themes', themesRouter);

// --- Socket.IO Middleware ---
io.use(socketAuthMiddleware);

// --- Socket.IO Connection ---
io.on('connection', async (socket: CustomSocket) => {
  console.log(`[Socket] Usuário ${socket.userId} conectado: ${socket.id}`);

  // Buscar username do banco de dados
  try {
    const user = await prisma.user.findUnique({ where: { id: socket.userId } });
    if (user) {
      socket.username = user.username;
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
  }

  // Emit salas disponíveis ao conectar
  socket.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });

  // --- Evento: create_room ---
  socket.on('create_room', async (data, callback) => {
    try {
      const { themeId, roomName } = data;

      // Validar se tema existe
      const theme = await prisma.theme.findUnique({ where: { id: themeId } });
      if (!theme) {
        return callback({ success: false, error: 'Tema não encontrado' });
      }

      // Criar sala
      const room = roomService.createRoom(themeId, roomName, socket.userId!, socket.username || 'Anônimo');
      socket.join(room.id);

      // Notificar todos sobre salas atualizadas
      io.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });

      const response = { success: true, roomId: room.id, room: roomService.roomToDTO(room) };
      callback(response);
      console.log(`[Room] Sala criada: ${room.id} por ${socket.username}`);
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      callback({ success: false, error: 'Erro ao criar sala' });
    }
  });

  // --- Evento: join_room ---
  socket.on('join_room', (data, callback) => {
    try {
      const { roomId } = data;

      const room = roomService.getRoomById(roomId);
      if (!room) {
        return callback({ success: false, error: 'Sala não encontrada' });
      }

      if (!roomService.joinRoom(roomId, socket.userId!, socket.username || 'Anônimo')) {
        return callback({ success: false, error: 'Não foi possível entrar na sala' });
      }

      socket.join(roomId);

      // Notificar todos sobre salas atualizadas
      io.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });

      // Notificar a sala que um jogador entrou
      io.to(roomId).emit('player_joined', {
        roomId,
        userId: socket.userId,
        username: socket.username || 'Anônimo',
        playerCount: room.players.length,
      });

      callback({ success: true, room: roomService.roomToDTO(room) });
      console.log(`[Room] ${socket.username} entrou na sala ${roomId}`);
    } catch (error) {
      console.error('Erro ao entrar em sala:', error);
      callback({ success: false, error: 'Erro ao entrar em sala' });
    }
  });

  // --- Evento: leave_room ---
  socket.on('leave_room', (data, callback) => {
    try {
      const { roomId } = data;

      roomService.leaveRoom(roomId, socket.userId!);
      socket.leave(roomId);

      // Notificar a sala que um jogador saiu
      const room = roomService.getRoomById(roomId);
      if (room) {
        io.to(roomId).emit('player_left', {
          roomId,
          userId: socket.userId,
          playerCount: room.players.length,
        });

        // Deletar sala se estiver vazia
        roomService.deleteRoomIfEmpty(roomId);
      }

      // Notificar todos sobre salas atualizadas
      io.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });

      callback?.({ success: true });
      console.log(`[Room] ${socket.username} saiu da sala ${roomId}`);
    } catch (error) {
      console.error('Erro ao sair de sala:', error);
      callback?.({ success: false, error: 'Erro ao sair de sala' });
    }
  });

  // --- Evento: list_rooms ---
  socket.on('list_rooms', (callback) => {
    callback({ rooms: roomService.getAvailableRoomsDTO() });
  });

  // --- Evento: get_room ---
  socket.on('get_room', (data: { roomId: string }, callback) => {
    const room = roomService.getRoomById(data.roomId);
    if (!room) {
      return callback({ success: false, error: 'Sala não encontrada' });
    }
    callback({
      success: true,
      room: { ...roomService.roomToDTO(room), players: room.players },
    });
  });

  // --- Evento: start_game ---
  socket.on('start_game', async (data, callback) => {
    try {
      const { roomId } = data;

      const room = roomService.getRoomById(roomId);
      if (!room) {
        return callback({ success: false, error: 'Sala não encontrada' });
      }

      if (room.players.length !== 2) {
        return callback({ success: false, error: 'A sala precisa ter 2 jogadores' });
      }

      if (gameService.isGameActive(roomId)) {
        return callback({ success: false, error: 'Já há um jogo ativo nessa sala' });
      }

      // Start game
      const game = await gameService.startGame(
        roomId,
        room.themeId,
        room.players[0].id,
        room.players[1].id
      );

      // Update room status
      roomService.updateRoomStatus(roomId, 'playing');

      // Fetch characters for UI
      const characters = await gameService.getCharactersByTheme(room.themeId);

      // Emit game_started to room
      io.to(roomId).emit('game_started', {
        roomId,
        questionerId: game.questionerPlayerId,
        questionerUsername: room.players.find(p => p.id === game.questionerPlayerId)?.username || 'Jogador',
        thinkerId: game.thinkerPlayerId,
        thinkerUsername: room.players.find(p => p.id === game.thinkerPlayerId)?.username || 'Jogador',
        themeId: room.themeId,
        characters: characters.map(c => ({ id: c.id, name: c.name, imageUrl: c.imageUrl })),
      });

      callback({ success: true, game });
      console.log(`[Game] Jogo iniciado em sala ${roomId}`);
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error);
      callback({ success: false, error: 'Erro ao iniciar jogo' });
    }
  });

  // --- Evento: submit_question ---
  socket.on('submit_question', async (data, callback) => {
    try {
      const { roomId, question } = data;

      if (!question || question.trim().length === 0) {
        return callback({ success: false, error: 'Pergunta não pode estar vazia' });
      }

      const game = gameService.getGameByRoomId(roomId);
      if (!game || game.completed) {
        return callback({ success: false, error: 'Nenhum jogo ativo nessa sala' });
      }

      if (game.questionerPlayerId !== socket.userId) {
        return callback({ success: false, error: 'Apenas o questionador pode fazer perguntas' });
      }

      const result = await gameService.submitQuestion(roomId, question, socket.userId!);

      // Emit to room
      io.to(roomId).emit('question_submitted', {
        question: result.question,
        answer: result.answer,
        questionerUsername: socket.username,
      });

      callback({ success: true, answer: result.answer });
      console.log(`[Game] Pergunta em sala ${roomId}: "${question}" → ${result.answer}`);
    } catch (error) {
      console.error('Erro ao submeter pergunta:', error);
      callback({ success: false, error: 'Erro ao submeter pergunta' });
    }
  });

  // --- Evento: submit_guess ---
  socket.on('submit_guess', async (data, callback) => {
    try {
      const { roomId, characterId } = data;

      const game = gameService.getGameByRoomId(roomId);
      if (!game || game.completed) {
        return callback({ success: false, error: 'Nenhum jogo ativo nessa sala' });
      }

      if (game.thinkerPlayerId !== socket.userId) {
        return callback({ success: false, error: 'Apenas o adivinhador pode fazer adivinhações' });
      }

      const result = await gameService.submitGuess(roomId, characterId, socket.userId!);
      const character = await gameService.getSecretCharacter(characterId);

      if (result.correct) {
        // Game ended - update room status
        roomService.updateRoomStatus(roomId, 'finished');

        io.to(roomId).emit('game_ended', {
          winnerId: socket.userId,
          winnerUsername: socket.username,
          message: `${socket.username} acertou! Era ${character.name}!`,
        });

        console.log(`[Game] Sala ${roomId} finalizada. Vencedor: ${socket.username}`);

        // Reset room after 3 seconds
        setTimeout(() => {
          gameService.endGame(roomId);
          roomService.updateRoomStatus(roomId, 'waiting');
          io.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });
        }, 3000);

        callback({ success: true, correct: true, message: 'Você acertou!' });
      } else {
        io.to(roomId).emit('guess_result', {
          characterName: character.name,
          isCorrect: false,
          message: `Errado! Não era ${character.name}. Continue tentando!`,
        });

        callback({ success: true, correct: false, message: 'Errado, tente de novo!' });
        console.log(`[Game] Adivinhação errada em sala ${roomId}: ${character.name}`);
      }
    } catch (error) {
      console.error('Erro ao submeter adivinhação:', error);
      callback({ success: false, error: 'Erro ao submeter adivinhação' });
    }
  });

  // --- Evento: disconnect ---
  socket.on('disconnect', () => {
    console.log(`[Socket] Usuário ${socket.username} desconectado: ${socket.id}`);
    // Nota: Socket.IO remove automaticamente o socket de todas as rooms
    // mas precisamos limpar o RoomService
    const allRooms = roomService.getAllRooms();
    for (const room of allRooms) {
      if (room.players.some(p => p.id === socket.userId)) {
        roomService.leaveRoom(room.id, socket.userId!);
        roomService.deleteRoomIfEmpty(room.id);
      }
    }
    io.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`[Server] Rodando na porta http://localhost:${PORT}`);
});
