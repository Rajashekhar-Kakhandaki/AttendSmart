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

// GET /api/bunk/forecast — predict end-of-semester attendance per subject
router.get('/forecast', async (req, res, next) => {
  try {
    const stats = await getFullStats(req.user.id, req.user.minThreshold);

    // Fetch timetable slots and academic calendar
    const [slots, calendarEntries] = await Promise.all([
      prisma.timetableSlot.findMany({ where: { userId: req.user.id } }),
      prisma.academicCalendar.findMany({ where: { userId: req.user.id }, orderBy: { date: 'asc' } }),
    ]);

    const semesterEnd = calendarEntries.find((e) => e.type === 'SEMESTER_END');

    const forecast = stats.map((s) => {
      // Get slots for this subject's days
      const subjectSlots = slots.filter((sl) => sl.subjectId === s.subject.id);
      // Count remaining class days for this subject
      const remaining = getRemainingDays(subjectSlots, calendarEntries, semesterEnd?.date);

      // ── Best case: attend every remaining class ──────────────────────────
      const bestAttended = s.attended + remaining;
      const bestTotal    = s.total + remaining;
      const bestPct      = bestTotal > 0
        ? parseFloat(((bestAttended / bestTotal) * 100).toFixed(1))
        : 0;

      // ── Worst case: continue at current rate (skip as many as safe allows) ─
      // Current attendance rate
      const currentRate = s.total > 0 ? s.attended / s.total : 1;
      const worstAttended = s.attended + Math.round(currentRate * remaining);
      const worstTotal    = s.total + remaining;
      const worstPct      = worstTotal > 0
        ? parseFloat(((worstAttended / worstTotal) * 100).toFixed(1))
        : 0;

      // ── Minimum classes needed from remaining to hit threshold ────────────
      // Need: (attended + x) / (total + remaining) >= threshold/100
      // x >= threshold/100 * (total + remaining) - attended
      const minNeeded = Math.max(
        0,
        Math.ceil((s.threshold / 100) * (s.total + remaining) - s.attended)
      );
      const mustAttendFromRemaining = Math.min(minNeeded, remaining);

      const onTrack = worstPct >= s.threshold;

      return {
        subjectId:    s.subject.id,
        subjectName:  s.subject.name,
        subjectColor: s.subject.color,
        currentPct:   s.percentage,
        threshold:    s.threshold,
        remaining,
        bestPct,
        worstPct,
        onTrack,
        mustAttendFromRemaining,
        canBunkFromRemaining: remaining - mustAttendFromRemaining,
        semesterEndDate: semesterEnd?.date || null,
      };
    });

    res.json({ forecast, semesterEndDate: semesterEnd?.date || null });
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

// GET /api/bunk/mood-history?days=30
router.get('/mood-history', async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
    const since = new Date(Date.now() - days * 86400000);

    const logs = await prisma.moodLog.findMany({
      where: { userId: req.user.id, date: { gte: since } },
      orderBy: { date: 'asc' },
      select: { date: true, mood: true },
    });

    // Format dates as YYYY-MM-DD strings for the client
    const formatted = logs.map((l) => ({
      date: new Date(l.date).toISOString().split('T')[0],
      mood: l.mood,
    }));

    res.json({ logs: formatted });
  } catch (err) { next(err); }
});

// POST /api/bunk/ai-suggest — Gemini-powered suggestion
router.post('/ai-suggest', async (req, res, next) => {
  try {
    const stats = await getFullStats(req.user.id, req.user.minThreshold);

    // Use local YYYY-MM-DD string — same approach as the mood POST route
    // so the date keys always match regardless of server TZ offset.
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const todayLocal = new Date(todayStr); // local midnight
    const tomorrowLocal = new Date(todayLocal.getTime() + 86400000);

    // Use findFirst with a range — resilient to any remaining TZ drift
    const todayMood = await prisma.moodLog.findFirst({
      where: { userId: req.user.id, date: { gte: todayLocal, lt: tomorrowLocal } },
      orderBy: { date: 'desc' },
    });

    const sevenDaysAgo = new Date(todayLocal.getTime() - 7 * 86400000);

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
