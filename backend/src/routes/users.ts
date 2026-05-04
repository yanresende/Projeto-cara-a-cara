import { Router } from 'express';
import { prisma } from '../server';
import { EquippedItems } from '../types/index';

const router = Router();

// GET /api/users/:userId — public profile for in-game display
router.get('/:userId', async (req, res): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        leaguePoints: true,
        equippedItems: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl ?? null,
      leaguePoints: user.leaguePoints,
      equippedItems: (user.equippedItems as EquippedItems) ?? {},
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
