const { Router } = require('express');
const auth = require('../middleware/auth');
const prisma = require('../services/prisma');
const { calculateSafeBunks, getRemainingDays, simulateWhatIf } = require('../services/bunkCalculator');
const { getBunkSuggestion, chat } = require('../services/gemini');

const router = Router();
router.use(auth);

// Helper: get full attendance stats for a user
async function getFullStats(userId, userThreshold) {
  const subjects = await prisma.subject.findMany({ where: { userId } });

  return Promise.all(
    subjects.map(async (subject) => {
      const records = await prisma.attendanceRecord.findMany({
        where: { userId, subjectId: subject.id },
      });

      // App-tracked counts
      const appTotal    = records.length;
      const appAttended = records.filter((r) => ['PRESENT','LATE'].includes(r.status)).length;
      const appAbsent   = records.filter((r) => r.status === 'ABSENT').length;

      // Add pre-app history as an offset
      const total    = appTotal    + (subject.initialTotal    || 0);
      const attended = appAttended + (subject.initialAttended || 0);
      const absent   = appAbsent  + Math.max(0, (subject.initialTotal || 0) - (subject.initialAttended || 0));

      const threshold  = subject.minThreshold ?? userThreshold;
      const percentage = total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0;
      const safeBunks  = percentage >= threshold
        ? Math.floor((attended - (threshold / 100) * total) / (threshold / 100))
        : 0;
      const classesNeeded = percentage < threshold
        ? Math.ceil((threshold * total - 100 * attended) / (100 - threshold))
        : 0;

      return {
        subject, total, attended, absent, percentage, threshold,
        safeBunks: Math.max(0, safeBunks), classesNeeded,
        isSafe: percentage >= threshold,
        initialTotal: subject.initialTotal || 0,
        initialAttended: subject.initialAttended || 0,
      };
    })
  );
}

// GET /api/bunk/safe — safe bunks per subject
router.get('/safe', async (req, res, next) => {
  try {
    const stats = await getFullStats(req.user.id, req.user.minThreshold);
    res.json({ stats });
  } catch (err) { next(err); }
});

// GET /api/bunk/whatif?Physics=2&Math=1
// Query params: subjectName=N (number of extra bunks to simulate)
router.get('/whatif', async (req, res, next) => {
  try {
    const stats = await getFullStats(req.user.id, req.user.minThreshold);

    // Build additionalBunks map from query params (subjectId=count)
    const additionalBunks = {};
    for (const [key, val] of Object.entries(req.query)) {
      additionalBunks[key] = parseInt(val, 10) || 0;
    }

    const simulation = simulateWhatIf({ stats, additionalBunks });
    res.json({ simulation, warning: simulation.some((s) => !s.isSafeAfter) });
  } catch (err) { next(err); }
});

// POST /api/bunk/mood
router.post('/mood', async (req, res, next) => {
  try {
    const { mood } = req.body;
    const validMoods = ['HAPPY', 'CHILL', 'TIRED', 'STRESSED'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: `Mood must be one of: ${validMoods.join(', ')}` });
    }

    // Use a plain YYYY-MM-DD string anchored to local date to avoid
    // timezone shifts turning midnight IST into the previous UTC day.
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const today = new Date(todayStr); // parsed as local midnight → no TZ drift

    // Try to find an existing record first to avoid upsert TZ race
    const existing = await prisma.moodLog.findFirst({
      where: { userId: req.user.id, date: { gte: today, lt: new Date(today.getTime() + 86400000) } },
    });

    let log;
    if (existing) {
      log = await prisma.moodLog.update({
        where: { id: existing.id },
        data: { mood },
      });
    } else {
      try {
        log = await prisma.moodLog.create({
          data: { userId: req.user.id, date: today, mood },
        });
      } catch (createErr) {
        // Race condition safety net — just update whatever is there for today
        if (createErr.code === 'P2002') {
          await prisma.moodLog.updateMany({ where: { userId: req.user.id, date: today }, data: { mood } });
          log = await prisma.moodLog.findFirst({ where: { userId: req.user.id, date: today } });
        } else {
          throw createErr;
        }
      }
    }

    res.json({ log });
  } catch (err) { next(err); }
});

// POST /api/bunk/ai-suggest — Gemini-powered suggestion
router.post('/ai-suggest', async (req, res, next) => {
  try {
    const stats = await getFullStats(req.user.id, req.user.minThreshold);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMood = await prisma.moodLog.findUnique({
      where: { userId_date: { userId: req.user.id, date: today } },
    });

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const moodHistory = await prisma.moodLog.findMany({
      where: { userId: req.user.id, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'desc' },
    });

    const suggestion = await getBunkSuggestion({
      stats,
      mood: todayMood?.mood || null,
      moodHistory,
    });

    if (!suggestion) {
      return res.status(503).json({ error: 'AI suggestion unavailable. Check your Gemini API key.' });
    }

    res.json({ suggestion, stats });
  } catch (err) { next(err); }
});

// POST /api/bunk/chat — AI chatbot
router.post('/chat', async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const stats = await getFullStats(req.user.id, req.user.minThreshold);
    const reply = await chat({ message, stats, conversationHistory });

    res.json({ reply });
  } catch (err) { next(err); }
});

module.exports = router;
