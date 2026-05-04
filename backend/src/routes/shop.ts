import { Router, Response } from 'express';
import { AuthRequest, EquippedItems } from '../types/index';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../server';

const router = Router();

const ITEM_PRICES: Record<string, number> = {
  // Board skins
  dark_void: 200,
  neon_city: 350,
  enchanted_forest: 300,
  galaxy: 500,
  sunset: 250,
  // Card frames
  gold_frame: 150,
  holographic: 300,
  fire_frame: 250,
  ice_frame: 200,
  // Profile frames
  bronze_border: 100,
  champion_ring: 400,
  neon_ring: 250,
  diamond_ring: 350,
};

const VALID_ITEM_IDS = new Set(Object.keys(ITEM_PRICES));

// POST /api/shop/buy/:itemId
router.post('/buy/:itemId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const itemId = String(req.params.itemId);
    if (!VALID_ITEM_IDS.has(itemId)) { res.status(400).json({ error: 'Item inválido' }); return; }

    const price = ITEM_PRICES[itemId];
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { items: true },
    });

    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }
    if (user.coins < price) { res.status(400).json({ error: 'Moedas insuficientes' }); return; }

    const alreadyOwned = user.items.some((item: any) => item.itemId === itemId);
    if (alreadyOwned) { res.status(400).json({ error: 'Item já comprado' }); return; }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { coins: { decrement: price } },
      }),
      prisma.userItem.create({
        data: { userId: req.user.id, itemId },
      }),
    ]);

    const updated = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { items: true },
    });

    res.json({
      success: true,
      coins: updated?.coins ?? 0,
      ownedItemIds: (updated?.items ?? []).map((i: any) => i.itemId),
    });
  } catch (error) {
    console.error('Buy item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shop/equip
router.post('/equip', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { itemId, category } = req.body as { itemId: string | null; category: keyof EquippedItems };
    const validCategories: Array<keyof EquippedItems> = ['boardSkin', 'cardFrame', 'profileFrame'];

    if (!validCategories.includes(category)) { res.status(400).json({ error: 'Categoria inválida' }); return; }

    if (itemId && VALID_ITEM_IDS.has(itemId)) {
      const owned = await prisma.userItem.findUnique({
        where: { userId_itemId: { userId: req.user.id, itemId } },
      });
      if (!owned) { res.status(400).json({ error: 'Item não adquirido' }); return; }
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const current = (user?.equippedItems as EquippedItems) ?? {};
    const newEquipped: EquippedItems = { ...current, [category]: itemId || null };

    await prisma.user.update({
      where: { id: req.user.id },
      data: { equippedItems: newEquipped },
    });

    res.json({ success: true, equippedItems: newEquipped });
  } catch (error) {
    console.error('Equip item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
