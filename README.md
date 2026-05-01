# Projeto-cara-a-cara

# Documento de Planejamento: Jogo "Cara a Cara" Multiplayer

## 1. Objetivo
Desenvolver uma versão web multiplayer em tempo real do clássico jogo de tabuleiro "Cara a Cara" (Guess Who?). O sistema permitirá criação de salas, partidas online contra outros jogadores, gerenciamento de diferentes temas de personagens e um ranking global.

## 2. Arquitetura do Sistema

*   **Frontend:** React com TypeScript para tipagem estática e segurança. Estilização baseada em CSS Modules ou Vanilla CSS para maior controle das animações dos cards.
*   **Backend:** Node.js com Express para API RESTful (autenticação, cadastro, ranking) e `Socket.IO` para comunicação bidirecional em tempo real (lobby e partidas).
*   **Banco de Dados (Persistência):** PostgreSQL via Prisma ORM para armazenar usuários, histórico de partidas, temas e estatísticas.
*   **Estado em Tempo Real:** A memória do servidor Node.js gerenciará o estado ativo das salas. Se necessário no futuro para escalabilidade, migraremos esse estado para Redis.

## 3. Estrutura de Dados (PostgreSQL)

### Model `User`
*   `id`: UUID
*   `username`: String (único)
*   `password_hash`: String
*   `score`: Int (pontuação para o ranking)
*   `games_played`: Int
*   `games_won`: Int

### Model `Theme`
*   `id`: UUID
*   `name`: String (ex: "Animais", "Personagens Clássicos")
*   `description`: String
*   `cover_image_url`: String

### Model `Character` (Cartas/Imagens)
*   `id`: UUID
*   `theme_id`: UUID (relacionamento com Theme)
*   `name`: String
*   `image_url`: String
*   `attributes`: JSON (ex: `{"hasGlasses": true, "hairColor": "blonde"}` - útil para bots futuros, mas para PvP a imagem basta).

### Model `MatchHistory`
*   `id`: UUID
*   `winner_id`: UUID
*   `loser_id`: UUID
*   `theme_id`: UUID
*   `created_at`: DateTime

## 4. Eventos de Comunicação em Tempo Real (Socket.IO)

### Lobby
*   `Client -> Server:` `create_room` (payload: themeId, roomName)
*   `Client -> Server:` `join_room` (payload: roomId)
*   `Server -> Client:` `rooms_updated` (lista atualizada de salas disponíveis no lobby)

### Fluxo do Jogo
*   `Server -> Client:` `game_started` (inicia a partida quando 2 entram na sala. Envia o array de personagens do tema e o personagem sorteado para o jogador atual).
*   `Client -> Server:` `ask_question` (payload: "O seu personagem tem chapéu?")
*   `Server -> Client:` `receive_question` (repasse da pergunta para o oponente)
*   `Client -> Server:` `answer_question` (payload: boolean - Sim ou Não)
*   `Server -> Client:` `receive_answer` (repasse da resposta para quem perguntou)
*   `Client -> Server:` `guess_character` (payload: characterId - tentativa final de adivinhar)
*   `Server -> Client:` `game_over` (payload: winnerId, reason - fim de jogo e repasse de pontos)

## 5. Fases de Implementação

**Fase 1: Setup e Autenticação**
*   Inicialização do repositório (Frontend React/Vite + Backend Node).
*   Setup do PostgreSQL e criação do schema.
*   Implementação de login/cadastro e rotas da API REST.

**Fase 2: Infraestrutura em Tempo Real e Lobby**
*   Configuração do servidor Socket.IO.
*   Implementação do gerenciamento de salas na memória do servidor.
*   Interface do Lobby (listar salas, criar sala, entrar em sala).

**Fase 3: Lógica Central do Jogo**
*   Sincronização do estado inicial do jogo (distribuição das cartas secretas de forma segura).
*   Implementação dos turnos e do chat/sistema de perguntas e respostas.
*   Lógica de vitória (tentativa de adivinhar o personagem final).
*   Atualização do ranking ao fim da partida.

**Fase 4: Interface de Jogo (Tabuleiro)**
*   Construção do grid de cartas.
*   Mecanismo visual de "abaixar" as cartas descartadas.
*   Avisos visuais de turnos (de quem é a vez).

**Fase 5: Temas e Polimento**
*   Inserção de assets reais (imagens) para pelo menos 2 temas iniciais.
*   Página de Ranking (Leaderboard).
*   Testes de responsividade e correções finais.