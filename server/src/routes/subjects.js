const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const prisma = require('../services/prisma');

const router = Router();
router.use(auth); // all subject routes are protected

const subjectSchema = z.object({
  name: z.string().min(1).max(100),
  minThreshold: z.number().int().min(1).max(100).optional().nullable(),
  isMustAttend: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  initialTotal: z.number().int().min(0).optional().default(0),
  initialAttended: z.number().int().min(0).optional().default(0),
});

// GET /api/subjects
router.get('/', async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' },
    });
    res.json({ subjects });
  } catch (err) { next(err); }
});

// POST /api/subjects
router.post('/', validate(subjectSchema), async (req, res, next) => {
  try {
    const subject = await prisma.subject.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json({ subject });
  } catch (err) { next(err); }
});

// PUT /api/subjects/:id
router.put('/:id', validate(subjectSchema.partial()), async (req, res, next) => {
  try {
    const subject = await prisma.subject.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const updated = await prisma.subject.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ subject: updated });
  } catch (err) { next(err); }
});

// DELETE /api/subjects/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const subject = await prisma.subject.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ message: 'Subject deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
