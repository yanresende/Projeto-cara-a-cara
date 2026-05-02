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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API do Cara a Cara está rodando!' });
});

app.use('/api/auth', authRouter);
app.use('/api/themes', themesRouter);

io.use(socketAuthMiddleware);

// Helper: encontra o socket de um jogador específico na sala
async function getPlayerSocket(roomId: string, userId: string) {
  const sockets = await io.in(roomId).fetchSockets();
  return sockets.find(s => (s as any).userId === userId);
}

io.on('connection', async (socket: CustomSocket) => {
  console.log(`[Socket] Usuário ${socket.userId} conectado: ${socket.id}`);

  try {
    const user = await prisma.user.findUnique({ where: { id: socket.userId } });
    if (user) socket.username = user.username;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
  }

  socket.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });

  // --- create_room ---
  socket.on('create_room', async (data, callback) => {
    try {
      const { themeId, roomName } = data;
      const theme = await prisma.theme.findUnique({ where: { id: themeId } });
      if (!theme) return callback({ success: false, error: 'Tema não encontrado' });

      const room = roomService.createRoom(themeId, roomName, socket.userId!, socket.username || 'Anônimo');
      socket.join(room.id);
      io.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });
      callback({ success: true, roomId: room.id, room: roomService.roomToDTO(room) });
      console.log(`[Room] Sala criada: ${room.id} por ${socket.username}`);
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      callback({ success: false, error: 'Erro ao criar sala' });
    }
  });

  // --- join_room ---
  socket.on('join_room', (data, callback) => {
    try {
      const { roomId } = data;
      const room = roomService.getRoomById(roomId);
      if (!room) return callback({ success: false, error: 'Sala não encontrada' });

      if (!roomService.joinRoom(roomId, socket.userId!, socket.username || 'Anônimo')) {
        return callback({ success: false, error: 'Não foi possível entrar na sala' });
      }

      socket.join(roomId);
      io.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });
      io.to(roomId).emit('player_joined', {
        roomId,
        userId: socket.userId!,
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

  // --- leave_room ---
  socket.on('leave_room', (data, callback) => {
    try {
      const { roomId } = data;
      roomService.leaveRoom(roomId, socket.userId!);
      socket.leave(roomId);

      const room = roomService.getRoomById(roomId);
      if (room) {
        io.to(roomId).emit('player_left', {
          roomId,
          userId: socket.userId!,
          playerCount: room.players.length,
        });
        roomService.deleteRoomIfEmpty(roomId);
      }

      io.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });
      callback?.({ success: true });
      console.log(`[Room] ${socket.username} saiu da sala ${roomId}`);
    } catch (error) {
      console.error('Erro ao sair de sala:', error);
      callback?.({ success: false, error: 'Erro ao sair de sala' });
    }
  });

  // --- list_rooms ---
  socket.on('list_rooms', (callback) => {
    callback({ rooms: roomService.getAvailableRoomsDTO() });
  });

  // --- get_room ---
  socket.on('get_room', (data: { roomId: string }, callback) => {
    const room = roomService.getRoomById(data.roomId);
    if (!room) return callback({ success: false, error: 'Sala não encontrada' });
    callback({ success: true, room: { ...roomService.roomToDTO(room), players: room.players } });
  });

  // --- start_game ---
  socket.on('start_game', async (data, callback) => {
    try {
      const { roomId } = data;
      const room = roomService.getRoomById(roomId);
      if (!room) return callback({ success: false, error: 'Sala não encontrada' });
      if (room.players.length !== 2) return callback({ success: false, error: 'A sala precisa ter 2 jogadores' });
      if (gameService.isGameActive(roomId)) return callback({ success: false, error: 'Já há um jogo ativo nessa sala' });

      const game = await gameService.startGame(roomId, room.themeId, room.players[0].id, room.players[1].id);
      roomService.updateRoomStatus(roomId, 'playing');

      const characters = await gameService.getCharactersByTheme(room.themeId);
      const player1Username = room.players.find(p => p.id === game.player1Id)?.username || 'Jogador 1';
      const player2Username = room.players.find(p => p.id === game.player2Id)?.username || 'Jogador 2';
      const firstTurnUsername = game.currentTurnPlayerId === game.player1Id ? player1Username : player2Username;

      // Emite game_started individualmente para cada socket com o seu próprio personagem secreto
      const roomSockets = await io.in(roomId).fetchSockets();
      for (const sock of roomSockets) {
        const sockUserId = (sock as any).userId as string;
        const mySecretCharacterId = sockUserId === game.player1Id
          ? game.player1SecretCharacterId
          : game.player2SecretCharacterId;

        sock.emit('game_started', {
          roomId,
          player1Id: game.player1Id,
          player1Username,
          player2Id: game.player2Id,
          player2Username,
          firstTurnPlayerId: game.currentTurnPlayerId,
          mySecretCharacterId,
          themeId: room.themeId,
          characters: characters.map(c => ({ id: c.id, name: c.name, imageUrl: c.imageUrl })),
        });
      }

      // Notifica quem começa o turno
      io.to(roomId).emit('turn_changed', {
        currentTurnPlayerId: game.currentTurnPlayerId,
        currentTurnUsername: firstTurnUsername,
      });

      callback({ success: true });
      console.log(`[Game] Jogo iniciado em sala ${roomId}. Primeiro turno: ${firstTurnUsername}`);
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error);
      callback({ success: false, error: 'Erro ao iniciar jogo' });
    }
  });

  // --- submit_question ---
  socket.on('submit_question', async (data, callback) => {
    try {
      const { roomId, question } = data;
      if (!question || question.trim().length === 0) {
        return callback({ success: false, error: 'Pergunta não pode estar vazia' });
      }

      const result = gameService.submitQuestion(roomId, question.trim(), socket.userId!);

      // Notifica o adversário que precisa responder
      const game = gameService.getGameByRoomId(roomId);
      if (game) {
        const opponentId = game.player1Id === socket.userId ? game.player2Id : game.player1Id;
        const opponentSocket = await getPlayerSocket(roomId, opponentId);
        opponentSocket?.emit('question_pending', {
          question: result.question,
          askedByUsername: socket.username || 'Adversário',
        });
      }

      callback({ success: true });
      console.log(`[Game] Pergunta em sala ${roomId}: "${question}"`);
    } catch (error: any) {
      console.error('Erro ao submeter pergunta:', error);
      callback({ success: false, error: error.message || 'Erro ao enviar pergunta' });
    }
  });

  // --- answer_question ---
  socket.on('answer_question', (data, callback) => {
    try {
      const { roomId, answer } = data;

      const q = gameService.answerQuestion(roomId, answer, socket.userId!);

      const game = gameService.getGameByRoomId(roomId);
      const askedByUsername = game
        ? (game.player1Id === q.askedBy
          ? roomService.getRoomById(roomId)?.players.find(p => p.id === game.player1Id)?.username
          : roomService.getRoomById(roomId)?.players.find(p => p.id === game.player2Id)?.username)
        : 'Jogador';

      io.to(roomId).emit('question_answered', {
        question: q.content,
        answer: q.answer,
        askedByUsername: askedByUsername || 'Jogador',
      });

      callback({ success: true });
      console.log(`[Game] Resposta em sala ${roomId}: "${q.content}" → ${answer}`);
    } catch (error: any) {
      console.error('Erro ao responder pergunta:', error);
      callback({ success: false, error: error.message || 'Erro ao responder' });
    }
  });

  // --- submit_guess ---
  socket.on('submit_guess', async (data, callback) => {
    try {
      const { roomId, characterId } = data;

      const result = await gameService.submitGuess(roomId, characterId, socket.userId!);
      const room = roomService.getRoomById(roomId);
      const winnerUsername = room?.players.find(p => {
        const game = gameService.getGameByRoomId(roomId);
        return p.id === game?.winner;
      })?.username || 'Jogador';

      const game = gameService.getGameByRoomId(roomId);

      io.to(roomId).emit('guess_result', {
        characterName: result.characterName,
        opponentSecretName: result.opponentSecretName,
        isCorrect: result.correct,
        message: result.correct
          ? `${socket.username} acertou! Era ${result.characterName}!`
          : `${socket.username} errou! Não era ${result.characterName}. O personagem correto era ${result.opponentSecretName}.`,
        winnerId: game?.winner || '',
        winnerUsername,
      });

      if (game?.completed) {
        io.to(roomId).emit('game_ended', {
          winnerId: game.winner || '',
          winnerUsername,
          message: result.correct
            ? `${socket.username} adivinhou e venceu!`
            : `${socket.username} errou a adivinhação e perdeu!`,
        });

        roomService.updateRoomStatus(roomId, 'finished');
        console.log(`[Game] Sala ${roomId} finalizada. Vencedor: ${winnerUsername}`);

        setTimeout(() => {
          gameService.endGame(roomId);
          roomService.updateRoomStatus(roomId, 'waiting');
          io.emit('rooms_updated', { rooms: roomService.getAvailableRoomsDTO() });
        }, 5000);
      }

      callback({ success: true, correct: result.correct });
    } catch (error: any) {
      console.error('Erro ao submeter adivinhação:', error);
      callback({ success: false, error: error.message || 'Erro ao adivinhar' });
    }
  });

  // --- end_turn ---
  socket.on('end_turn', (data, callback) => {
    try {
      const { roomId } = data;

      const result = gameService.endTurn(roomId, socket.userId!);
      const room = roomService.getRoomById(roomId);
      const nextTurnUsername = room?.players.find(p => p.id === result.nextTurnPlayerId)?.username || 'Jogador';

      io.to(roomId).emit('turn_changed', {
        currentTurnPlayerId: result.nextTurnPlayerId,
        currentTurnUsername: nextTurnUsername,
      });

      callback({ success: true });
      console.log(`[Game] Turno finalizado em sala ${roomId}. Próximo turno: ${nextTurnUsername}`);
    } catch (error: any) {
      console.error('Erro ao finalizar turno:', error);
      callback({ success: false, error: error.message || 'Erro ao finalizar turno' });
    }
  });

  // --- disconnect ---
  socket.on('disconnect', () => {
    console.log(`[Socket] Usuário ${socket.username} desconectado: ${socket.id}`);
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
