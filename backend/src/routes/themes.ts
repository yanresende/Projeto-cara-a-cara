import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
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

// GET /api/themes/:themeId/characters — used for avatar picker
router.get('/:themeId/characters', authMiddleware, async (req, res) => {
  try {
    const { themeId } = req.params;

    const theme = await prisma.theme.findUnique({ where: { id: themeId } });
    if (!theme) {
      res.status(404).json({ error: 'Tema não encontrado' });
      return;
    }

    const characters = await prisma.character.findMany({
      where: { themeId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, imageUrl: true },
    });

    res.json({ characters });
  } catch (error) {
    console.error('Get characters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
