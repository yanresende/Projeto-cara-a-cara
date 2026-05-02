import { Router, Response } from 'express';
import { AuthRequest } from '../types/index';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminAuth';
import { prisma } from '../server';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/themes
router.get('/themes', async (_req, res: Response): Promise<void> => {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: { createdAt: 'asc' },
      include: { characters: { orderBy: { createdAt: 'asc' } } },
    });
    res.json({ themes });
  } catch (error) {
    console.error('Admin get themes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/themes
router.post('/themes', async (req, res: Response): Promise<void> => {
  try {
    const { name, description, coverImageUrl } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Nome do tema é obrigatório' });
      return;
    }
    const theme = await prisma.theme.create({
      data: { name: name.trim(), description, coverImageUrl },
      include: { characters: true },
    });
    res.status(201).json({ theme });
  } catch (error) {
    console.error('Admin create theme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/themes/:id
router.put('/themes/:id', async (req, res: Response): Promise<void> => {
  try {
    const { name, description, coverImageUrl } = req.body;
    const theme = await prisma.theme.update({
      where: { id: req.params.id },
      data: { name, description, coverImageUrl },
      include: { characters: true },
    });
    res.json({ theme });
  } catch (error) {
    console.error('Admin update theme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/themes/:id
router.delete('/themes/:id', async (req, res: Response): Promise<void> => {
  try {
    await prisma.character.deleteMany({ where: { themeId: req.params.id } });
    await prisma.theme.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete theme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/themes/:id/characters
router.post('/themes/:id/characters', async (req, res: Response): Promise<void> => {
  try {
    const { name, imageUrl, attributes } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Nome do personagem é obrigatório' });
      return;
    }
    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({ error: 'URL da imagem é obrigatória' });
      return;
    }
    const character = await prisma.character.create({
      data: { themeId: req.params.id, name: name.trim(), imageUrl, attributes },
    });
    res.status(201).json({ character });
  } catch (error) {
    console.error('Admin create character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/themes/:id/characters/:charId
router.put('/themes/:id/characters/:charId', async (req, res: Response): Promise<void> => {
  try {
    const { name, imageUrl, attributes } = req.body;
    const character = await prisma.character.update({
      where: { id: req.params.charId },
      data: { name: name?.trim(), imageUrl, attributes },
    });
    res.json({ character });
  } catch (error) {
    console.error('Admin update character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/themes/:id/characters/:charId
router.delete('/themes/:id/characters/:charId', async (req, res: Response): Promise<void> => {
  try {
    await prisma.character.delete({ where: { id: req.params.charId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
