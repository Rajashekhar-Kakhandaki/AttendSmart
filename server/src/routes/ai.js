const { Router } = require('express');
const multer = require('multer');
const { extractFromImage } = require('../services/gemini');
const auth = require('../middleware/auth');
const prisma = require('../services/prisma');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.use(auth);

// POST /api/ai/extract
router.post('/extract', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { type } = req.body; // 'TIMETABLE' or 'CALENDAR'
    if (!['TIMETABLE', 'CALENDAR'].includes(type)) {
      return res.status(400).json({ error: 'Invalid extraction type' });
    }

    let context = {};
    if (type === 'TIMETABLE') {
      // Fetch user's subjects to pass as context
      const subjects = await prisma.subject.findMany({
        where: { userId: req.user.id },
        select: { id: true, name: true }
      });
      context.subjects = subjects;
    }

    const result = await extractFromImage({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      type,
      context
    });

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
