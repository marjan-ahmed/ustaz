import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

router.post('/', requireAuth, requireRole(['ADMIN']), async (req, res) => {
  const { name, description } = req.body ?? {};
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name required' });
  const category = await prisma.category.create({ data: { name, description } });
  res.json(category);
});

export default router;

