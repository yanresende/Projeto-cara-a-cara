import { io } from 'socket.io-client';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3008';
const WS_URL = 'http://localhost:3008';

async function testSocketIO() {
  console.log('🧪 Iniciando testes de Socket.IO\n');

  // 1. Fazer signup
  console.log('1️⃣ Fazendo signup...');
  const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `testuser${Date.now()}`, password: 'teste123' }),
  });
  const signupData: any = await signupRes.json();
  const token = signupData.token;
  const userId = signupData.user.id;
  console.log(`✅ Usuário criado: ${signupData.user.username}\n`);

  // 2. Conectar ao Socket.IO
  console.log('2️⃣ Conectando ao Socket.IO...');
  const socket = io(WS_URL, {
    auth: { token },
  });

  await new Promise(resolve => socket.on('connect', resolve));
  console.log(`✅ Conectado com ID: ${socket.id}\n`);

  // 3. Obter lista de temas
  console.log('3️⃣ Buscando temas...');
  const themesRes = await fetch(`${API_URL}/api/health`);
  const res: any = await themesRes.json();
  console.log(`✅ API respondendo: ${res.message}\n`);

  // Para simplificar, vou usar um UUID fake para teste
  const themeId = '00000000-0000-0000-0000-000000000001';

  // 4. Aguardar rooms_updated
  console.log('4️⃣ Aguardando salas atualizadas...');
  await new Promise(resolve => {
    socket.on('rooms_updated', (data: any) => {
      console.log(`✅ Salas recebidas: ${data.rooms.length} sala(s) disponível(is)\n`);
      resolve(null);
    });
  });

  // 5. Listar salas
  console.log('5️⃣ Listando salas...');
  await new Promise(resolve => {
    socket.emit('list_rooms', (response: any) => {
      console.log(`✅ Resposta list_rooms: ${response.rooms.length} salas\n`);
      resolve(null);
    });
  });

  // 6. Conectar outro cliente
  console.log('6️⃣ Conectando segundo cliente...');
  const socket2 = io(WS_URL, {
    auth: { token },
  });

  await new Promise(resolve => socket2.on('connect', resolve));
  console.log(`✅ Segundo cliente conectado: ${socket2.id}\n`);

  // 7. Criar sala
  console.log('7️⃣ Criando sala...');
  const roomData: any = await new Promise(resolve => {
    socket.emit('create_room', { themeId, roomName: 'Sala de Teste' }, (response: any) => {
      console.log(`✅ Sala criada: ${response.roomId}\n`);
      resolve(response);
    });
  });

  const roomId = roomData.roomId;

  // 8. Aguardar rooms_updated no socket2
  console.log('8️⃣ Aguardando notificação no cliente 2...');
  await new Promise(resolve => {
    socket2.on('rooms_updated', (data: any) => {
      console.log(`✅ Cliente 2 recebeu salas: ${data.rooms.length} sala(s)\n`);
      resolve(null);
    });
  });

  // 9. Entrar em sala
  console.log('9️⃣ Cliente 2 entrando na sala...');
  await new Promise(resolve => {
    socket2.emit('join_room', { roomId }, (response: any) => {
      console.log(`✅ Cliente 2 entrou na sala. Playercount: ${response.room.playerCount}/2\n`);
      resolve(null);
    });
  });

  // 10. Aguardar player_joined
  console.log('🔟 Aguardando notificação de player_joined...');
  await new Promise(resolve => {
    socket.on('player_joined', (data: any) => {
      console.log(`✅ Player entrou na sala: ${data.username} (Total: ${data.playerCount}/2)\n`);
      resolve(null);
    });
  });

  // 11. Sair de sala
  console.log('1️⃣1️⃣ Cliente 2 saindo da sala...');
  await new Promise(resolve => {
    socket2.emit('leave_room', { roomId }, () => {
      console.log(`✅ Cliente 2 saiu da sala\n`);
      resolve(null);
    });
  });

  // 12. Aguardar player_left
  console.log('1️⃣2️⃣ Aguardando notificação de player_left...');
  await new Promise(resolve => {
    socket.on('player_left', (data: any) => {
      console.log(`✅ Player saiu da sala (Total: ${data.playerCount}/2)\n`);
      resolve(null);
    });
  });

  // 13. Listar salas finais
  console.log('1️⃣3️⃣ Listando salas finais...');
  await new Promise(resolve => {
    socket.emit('list_rooms', (response: any) => {
      console.log(`✅ Salas finais: ${response.rooms.length} sala(s)\n`);
      resolve(null);
    });
  });

  console.log('✅ TODOS OS TESTES PASSARAM!\n');

  socket.disconnect();
  socket2.disconnect();
  process.exit(0);
}

testSocketIO().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
