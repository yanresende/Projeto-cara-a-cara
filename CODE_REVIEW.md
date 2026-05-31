# Code Review — Projeto Cara a Cara

**Revisor:** Vitor Azevedo (@vitorazevedop7)  
**Projeto revisado:** Projeto Cara a Cara — Jogo multiplayer em tempo real  
**Disciplina:** Laboratório de Desenvolvimento de Software

---

## Resumo Executivo

O projeto apresenta uma base sólida: arquitetura separada em frontend (React 19 + TypeScript + Vite) e backend (Node.js + Express + Socket.IO + Prisma), com sistema de autenticação JWT, jogo em tempo real via WebSockets e banco de dados PostgreSQL.

O código funciona, mas apresenta oportunidades significativas de melhoria em **type safety**, **separação de responsabilidades**, **segurança** e **testabilidade** que serão detalhadas nos comentários inline abaixo.

---

## Principais Achados

### Críticos
- `backend/tsconfig.json`: TypeScript com `"strict": false` — desabilita checagens essenciais como `strictNullChecks` e `noImplicitAny`
- `backend/src/utils/jwt.ts`: JWT_SECRET com fallback hardcoded `'your-secret-key'`
- `backend/src/server.ts`: Arquivo monolítico de 513 linhas misturando setup do servidor com toda a lógica Socket.IO
- Uso excessivo de `any` em pontos críticos (Prisma, Socket.IO, callbacks)

### Arquiteturais
- Estado de jogo armazenado em `Map` em memória (sem persistência em crash)
- `useGameSocket.ts` (400 linhas, 17 `useState`) é um "God Hook" com responsabilidades excessivas
- `persistGame()` executa múltiplas queries sem transação atômica

### Boas Práticas
- `authHeaders()` duplicada em múltiplos services
- `console.log` como substituto de logger estruturado (~47 ocorrências)
- Ausência total de testes automatizados
- Sem arquivo `.env.example`
- CORS aberto (`origin: '*'`)

---

## Estrutura dos Comentários

Os comentários de revisão estão distribuídos nos seguintes arquivos:

| Arquivo | Nº de Comentários | Categoria |
|---|---|---|
| `backend/src/server.ts` | 5 | Arquitetura, Segurança, TypeScript |
| `backend/src/services/gameService.ts` | 4 | Arquitetura, Banco de dados |
| `backend/src/utils/jwt.ts` | 1 | Segurança |
| `backend/tsconfig.json` | 1 | TypeScript |
| `backend/src/routes/ranking.ts` | 2 | Performance, DRY |
| `frontend/src/hooks/useGameSocket.ts` | 4 | Arquitetura, TypeScript |
| `frontend/src/pages/GameRoomPage.tsx` | 2 | Componentização |
| `frontend/src/services/shopService.ts` | 1 | DRY |
| `frontend/src/services/socketService.ts` | 1 | TypeScript |
| `frontend/src/context/AuthContext.tsx` | 1 | Segurança |
| `frontend/src/types/index.ts` | 1 | TypeScript |
| Projeto geral | 2 | Testes, DevEx |

**Total: 25 comentários de revisão**

---

## Recomendações Prioritárias

1. **Ativar TypeScript strict mode** (`"strict": true`) no backend e corrigir os erros resultantes
2. **Remover fallback inseguro** do JWT_SECRET — lançar erro se a variável não estiver configurada
3. **Refatorar `server.ts`** — extrair handlers Socket.IO em módulos dedicados (`socketHandlers/`)
4. **Decompor `useGameSocket`** em hooks menores com responsabilidade única
5. **Usar `prisma.$transaction()`** em `persistGame()` para garantir atomicidade
6. **Criar `apiClient.ts` centralizado** — eliminar duplicação de `authHeaders()`
7. **Implementar logger estruturado** (pino ou winston) substituindo `console.log`
8. **Adicionar testes** — Vitest no frontend, Jest no backend, começando por `gameService.ts`
