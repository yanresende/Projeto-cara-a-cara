import { Router } from 'express';
import { prisma } from '../server';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        coverImageUrl: true,
      },
    });

    res.json({ themes });
  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
