import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

const createSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  isAnonymous: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(true),
  categoryId: z.string().optional().nullable(),
});

router.post('/', requireAuth, requireRole(['STUDENT', 'ADMIN', 'TEACHER']), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const data = parsed.data;
  const complaint = await prisma.complaint.create({
    data: {
      title: data.title,
      description: data.description,
      isAnonymous: data.isAnonymous ?? false,
      isPublic: data.isPublic ?? true,
      studentId: req.authUser!.id,
      categoryId: data.categoryId ?? undefined,
    },
  });
  res.json(complaint);
});

router.get('/', requireAuth, async (req, res) => {
  const role = req.authUser!.role;
  if (role === 'STUDENT') {
    const mine = await prisma.complaint.findMany({
      where: { studentId: req.authUser!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(mine);
  }
  // Teachers/Admins see all
  const all = await prisma.complaint.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(all);
});

router.get('/public', async (_req, res) => {
  const items = await prisma.complaint.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const c = await prisma.complaint.findUnique({ where: { id } });
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (req.authUser!.role === 'STUDENT' && c.studentId !== req.authUser!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(c);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.complaint.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const role = req.authUser!.role;
  if (role === 'STUDENT' && existing.studentId !== req.authUser!.id) return res.status(403).json({ error: 'Forbidden' });

  const allowed: Record<string, unknown> = {};
  if (typeof req.body.title === 'string') allowed.title = req.body.title;
  if (typeof req.body.description === 'string') allowed.description = req.body.description;
  if (typeof req.body.isPublic === 'boolean') allowed.isPublic = req.body.isPublic;

  if (role !== 'STUDENT') {
    if (typeof req.body.status === 'string') allowed.status = req.body.status;
    if (typeof req.body.assignedToId === 'string') allowed.assignedToId = req.body.assignedToId;
  }

  const updated = await prisma.complaint.update({ where: { id }, data: allowed });
  res.json(updated);
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { body, isInternal } = req.body ?? {};
  if (!body || typeof body !== 'string') return res.status(400).json({ error: 'body required' });
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return res.status(404).json({ error: 'Not found' });
  if (req.authUser!.role === 'STUDENT' && complaint.studentId !== req.authUser!.id) return res.status(403).json({ error: 'Forbidden' });
  const comment = await prisma.comment.create({
    data: {
      body,
      isInternal: !!isInternal && req.authUser!.role !== 'STUDENT',
      complaintId: id,
      authorId: req.authUser!.id,
    },
  });
  res.json(comment);
});

export default router;

