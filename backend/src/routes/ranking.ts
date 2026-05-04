import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../server';

const router = Router();

export type League = 'bronze' | 'prata' | 'ouro' | 'diamante' | 'campeao';

// Campeão = top 20 com LP >= 500. Diamante = posições 21-30 com LP >= 500.
function getLeague(lp: number, rank: number): League {
  if (rank <= 20 && lp >= 500) return 'campeao';
  if (rank <= 30 && lp >= 500) return 'diamante';
  if (lp >= 250) return 'ouro';
  if (lp >= 100) return 'prata';
  return 'bronze';
}

function buildPlayer(user: { id: string; username: string; avatarUrl?: string | null; gamesPlayed: number; gamesWon: number; leaguePoints: number }, rank: number) {
  const winRate = user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed) * 100 : 0;
  return {
    rank,
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl ?? null,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    gamesLost: user.gamesPlayed - user.gamesWon,
    winRate: winRate.toFixed(1),
    leaguePoints: user.leaguePoints,
    league: getLeague(user.leaguePoints, rank),
  };
}

// GET /api/ranking/leaderboard
// Query params: limit (max 200), offset, league (filter by league)
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const leagueFilter = req.query.league as League | undefined;

    // Buscar todos para calcular rank e liga corretamente
    const allUsers = await prisma.user.findMany({
      where: { gamesPlayed: { gt: 0 } },
      select: { id: true, username: true, avatarUrl: true, gamesPlayed: true, gamesWon: true, leaguePoints: true },
    });

    // Ordenar: LP desc → winRate desc (desempate) → gamesWon desc
    allUsers.sort((a, b) => {
      if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
      const wrA = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0;
      const wrB = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0;
      if (wrB !== wrA) return wrB - wrA;
      return b.gamesWon - a.gamesWon;
    });

    // Atribuir ranks e ligas
    const ranked = allUsers.map((u, i) => buildPlayer(u, i + 1));

    // Contagem por liga
    const leagueCounts = {
      campeao: ranked.filter(p => p.league === 'campeao').length,
      diamante: ranked.filter(p => p.league === 'diamante').length,
      ouro: ranked.filter(p => p.league === 'ouro').length,
      prata: ranked.filter(p => p.league === 'prata').length,
      bronze: ranked.filter(p => p.league === 'bronze').length,
    };

    // Filtrar por liga se solicitado
    const filtered = leagueFilter ? ranked.filter(p => p.league === leagueFilter) : ranked;
    const paginated = filtered.slice(offset, offset + limit);

    res.json({
      players: paginated,
      total: filtered.length,
      totalAll: allUsers.length,
      leagueCounts,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    res.status(500).json({ error: 'Erro ao buscar leaderboard' });
  }
});

// GET /api/ranking/user/:userId
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, gamesPlayed: true, gamesWon: true, leaguePoints: true },
    });

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Calcular rank global com mesmo critério do leaderboard
    const allUsers = await prisma.user.findMany({
      where: { gamesPlayed: { gt: 0 } },
      select: { id: true, leaguePoints: true, gamesWon: true, gamesPlayed: true },
    });

    allUsers.sort((a, b) => {
      if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
      const wrA = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0;
      const wrB = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0;
      if (wrB !== wrA) return wrB - wrA;
      return b.gamesWon - a.gamesWon;
    });

    const rank = allUsers.findIndex(u => u.id === userId) + 1;
    const player = buildPlayer(user, rank || allUsers.length + 1);

    // Partidas recentes
    const wonGames = await prisma.game.findMany({
      where: { winnerId: userId },
      select: { id: true, questionerId: true, thinkerId: true, questionCount: true, createdAt: true,
        questioner: { select: { username: true } }, thinker: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const lostGames = await prisma.game.findMany({
      where: { OR: [{ questionerId: userId, winnerId: { not: userId } }, { thinkerId: userId, winnerId: { not: userId } }] },
      select: { id: true, questionerId: true, thinkerId: true, questionCount: true, createdAt: true,
        questioner: { select: { username: true } }, thinker: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const allRecentGames = [
      ...wonGames.map(g => ({ id: g.id, opponentName: g.questionerId === userId ? g.thinker.username : g.questioner.username, result: 'win', questionsCount: g.questionCount, createdAt: g.createdAt })),
      ...lostGames.map(g => ({ id: g.id, opponentName: g.questionerId === userId ? g.thinker.username : g.questioner.username, result: 'loss', questionsCount: g.questionCount, createdAt: g.createdAt })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    res.json({ user: player, rank: rank || 0, recentGames: allRecentGames });
  } catch (error) {
    console.error('Erro ao buscar stats de usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar stats' });
  }
});

// GET /api/ranking/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalGames = await prisma.game.count();
    const totalPlayers = await prisma.user.count();
    const gameStats = await prisma.user.aggregate({ _avg: { gamesWon: true, gamesPlayed: true } });
    const avgWinRate = gameStats._avg.gamesPlayed && gameStats._avg.gamesWon
      ? ((gameStats._avg.gamesWon / gameStats._avg.gamesPlayed) * 100).toFixed(2)
      : '0.00';

    res.json({ totalGames, totalPlayers, avgWinRate: parseFloat(avgWinRate) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar stats' });
  }
});

export default router;
