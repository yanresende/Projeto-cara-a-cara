"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const server_1 = require("../server");
const router = (0, express_1.Router)();
// GET /api/ranking/leaderboard
router.get('/leaderboard', auth_1.authMiddleware, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = parseInt(req.query.offset) || 0;
        const users = await server_1.prisma.user.findMany({
            where: { gamesPlayed: { gt: 0 } },
            select: {
                id: true,
                username: true,
                gamesPlayed: true,
                gamesWon: true,
            },
            orderBy: [{ gamesWon: 'desc' }, { gamesPlayed: 'desc' }],
            take: limit,
            skip: offset,
        });
        const usersWithStats = users.map((user, index) => ({
            rank: offset + index + 1,
            id: user.id,
            username: user.username,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            winRate: user.gamesPlayed > 0 ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2) : '0.00',
            score: user.gamesWon * 10,
        }));
        res.json({ players: usersWithStats, limit, offset });
    }
    catch (error) {
        console.error('Erro ao buscar leaderboard:', error);
        res.status(500).json({ error: 'Erro ao buscar leaderboard' });
    }
});
// GET /api/ranking/user/:userId
router.get('/user/:userId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await server_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                gamesPlayed: true,
                gamesWon: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        // Fetch user's won games (as winner)
        const wonGames = await server_1.prisma.game.findMany({
            where: { winnerId: userId },
            select: {
                id: true,
                winnerId: true,
                questionerId: true,
                thinkerId: true,
                questionCount: true,
                createdAt: true,
                questioner: { select: { username: true } },
                thinker: { select: { username: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        const recentGames = wonGames.map(game => ({
            id: game.id,
            opponentName: game.questionerId === userId
                ? game.thinker.username
                : game.questioner.username,
            result: 'win',
            questionsCount: game.questionCount,
            createdAt: game.createdAt,
        }));
        // Also fetch games where user participated but didn't win
        const lostGames = await server_1.prisma.game.findMany({
            where: {
                OR: [
                    { questionerId: userId, winnerId: { not: userId } },
                    { thinkerId: userId, winnerId: { not: userId } },
                ],
            },
            select: {
                id: true,
                winnerId: true,
                questionerId: true,
                thinkerId: true,
                questionCount: true,
                createdAt: true,
                questioner: { select: { username: true } },
                thinker: { select: { username: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        const recentLosses = lostGames.map(game => ({
            id: game.id,
            opponentName: game.questionerId === userId
                ? game.thinker.username
                : game.questioner.username,
            result: 'loss',
            questionsCount: game.questionCount,
            createdAt: game.createdAt,
        }));
        const allRecentGames = [...recentGames, ...recentLosses]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
        // Rank calculation
        const allUsers = await server_1.prisma.user.findMany({
            where: { gamesPlayed: { gt: 0 } },
            select: { id: true, gamesWon: true, gamesPlayed: true },
            orderBy: [{ gamesWon: 'desc' }, { gamesPlayed: 'desc' }],
        });
        const rank = allUsers.findIndex(u => u.id === userId) + 1;
        res.json({
            user: {
                id: user.id,
                username: user.username,
                gamesPlayed: user.gamesPlayed,
                gamesWon: user.gamesWon,
                winRate: user.gamesPlayed > 0 ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2) : '0.00',
            },
            rank: rank || 0,
            recentGames: allRecentGames,
        });
    }
    catch (error) {
        console.error('Erro ao buscar stats de usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar stats' });
    }
});
// GET /api/ranking/stats
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const totalGames = await server_1.prisma.game.count();
        const totalPlayers = await server_1.prisma.user.count();
        const gameStats = await server_1.prisma.user.aggregate({
            _avg: {
                gamesWon: true,
                gamesPlayed: true,
            },
        });
        const avgWinRate = gameStats._avg.gamesPlayed && gameStats._avg.gamesWon
            ? ((gameStats._avg.gamesWon / gameStats._avg.gamesPlayed) * 100).toFixed(2)
            : '0.00';
        res.json({
            totalGames,
            totalPlayers,
            avgWinRate: parseFloat(avgWinRate),
        });
    }
    catch (error) {
        console.error('Erro ao buscar stats globais:', error);
        res.status(500).json({ error: 'Erro ao buscar stats' });
    }
});
exports.default = router;
