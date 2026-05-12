const { Router } = require('express');
const auth = require('../middleware/auth');
const prisma = require('../services/prisma');

const router = Router();
router.use(auth);

/**
 * Get today's date as a YYYY-MM-DD string in server local time.
 * Avoids UTC-offset bugs with IST (UTC+5:30) where midnight local time
 * is still the previous day in UTC, causing @db.Date mismatches.
 */
function localDateStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`; // e.g. '2026-05-05'
}

function localDayName() {
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  return days[new Date().getDay()];
}

// GET /api/attendance/today
// Auto-creates PRESENT records for today's slots if not already present
router.get('/today', async (req, res, next) => {
  try {
    const todayStr = localDateStr();          // '2026-05-05'
    const todayDate = new Date(todayStr);     // parsed as local midnight — correct for @db.Date
    const todayDay  = localDayName();         // 'TUE'

    // Check for holiday/exam
    const calendarBlock = await prisma.academicCalendar.findFirst({
      where: {
        userId: req.user.id,
        date: todayDate,
        type: { in: ['HOLIDAY', 'EXAM'] },
      },
    });

    if (calendarBlock) {
      return res.json({ records: [], blocked: calendarBlock });
    }

    // Get today's timetable slots
    const slots = await prisma.timetableSlot.findMany({
      where: { userId: req.user.id, dayOfWeek: todayDay },
      include: { subject: true },
      orderBy: { periodNumber: 'asc' },
    });

    if (slots.length === 0) {
      return res.json({ records: [], message: 'No classes scheduled today' });
    }

    // Upsert PRESENT for each slot (default-present model)
    const records = await Promise.all(
      slots.map((slot) =>
        prisma.attendanceRecord.upsert({
          where: { userId_slotId_date: { userId: req.user.id, slotId: slot.id, date: todayDate } },
          update: {},  // Don't overwrite if already marked
          create: {
            userId: req.user.id,
            subjectId: slot.subjectId,
            slotId: slot.id,
            date: todayDate,
            status: 'PRESENT',
          },
          include: { subject: true, slot: true },
        })
      )
    );

    res.json({ records, date: todayStr });
  } catch (err) { next(err); }
});

// PUT /api/attendance/:id — mark absent/late/excused
router.put('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const record = await prisma.attendanceRecord.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const updated = await prisma.attendanceRecord.update({
      where: { id: req.params.id },
      data: { status },
      include: { subject: true },
    });
    res.json({ record: updated });
  } catch (err) { next(err); }
});

// GET /api/attendance/stats — percentage per subject, projections
router.get('/stats', async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: req.user.id },
    });

    const stats = await Promise.all(
      subjects.map(async (subject) => {
        const records = await prisma.attendanceRecord.findMany({
          where: { userId: req.user.id, subjectId: subject.id },
        });

        // App-tracked counts
        const appTotal    = records.length;
        const appAttended = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const appAbsent   = records.filter((r) => r.status === 'ABSENT').length;

        // Add pre-app history as an offset
        const total    = appTotal    + (subject.initialTotal    || 0);
        const attended = appAttended + (subject.initialAttended || 0);
        const absent   = appAbsent  + Math.max(0, (subject.initialTotal || 0) - (subject.initialAttended || 0));

        const threshold  = subject.minThreshold ?? req.user.minThreshold;
        const percentage = total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0;

        const safeBunks = percentage >= threshold
          ? Math.floor((attended - (threshold / 100) * total) / (threshold / 100))
          : 0;

        const needed = percentage < threshold
          ? Math.ceil((threshold * total - 100 * attended) / (100 - threshold))
          : 0;

        return {
          subject,
          total,
          attended,
          absent,
          percentage,
          threshold,
          safeBunks: Math.max(0, safeBunks),
          classesNeeded: needed,
          isSafe: percentage >= threshold,
          initialTotal: subject.initialTotal || 0,
          initialAttended: subject.initialAttended || 0,
        };
      })
    );

    res.json({ stats });
  } catch (err) { next(err); }
});

// GET /api/attendance/history?subjectId=&from=&to=
router.get('/history', async (req, res, next) => {
  try {
    const { subjectId, from, to } = req.query;

    const where = {
      userId: req.user.id,
      ...(subjectId && { subjectId }),
      ...(from || to) && {
        date: {
          ...(from && { gte: new Date(from) }),
          ...(to   && { lte: new Date(to) }),
        },
      },
    };

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: { subject: true, slot: true },
      orderBy: { date: 'desc' },
    });

    res.json({ records });
  } catch (err) { next(err); }
});

// GET /api/attendance/streak — consecutive days of full attendance
router.get('/streak', async (req, res, next) => {
  try {
    // Get all records grouped by date, newest first
    const records = await prisma.attendanceRecord.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
      select: { date: true, status: true },
    });

    if (!records.length) return res.json({ streak: 0, bestStreak: 0 });

    // Group by date string
    const byDate = {};
    for (const r of records) {
      const key = new Date(r.date).toDateString();
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(r.status);
    }

    // Walk days in reverse chronological order
    const sortedDays = Object.keys(byDate).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    // A day "counts" if every class that day was PRESENT or LATE
    const isGoodDay = (statuses) =>
      statuses.length > 0 && statuses.every((s) => s === 'PRESENT' || s === 'LATE');

    let streak = 0;
    let bestStreak = 0;
    let current = 0;

    for (const day of sortedDays) {
      if (isGoodDay(byDate[day])) {
        current++;
        if (current > bestStreak) bestStreak = current;
      } else {
        if (streak === 0) streak = current; // freeze current as active streak once we hit a break
        current = 0;
      }
    }
    if (streak === 0) streak = current; // all days were good

    res.json({ streak, bestStreak });
  } catch (err) { next(err); }
});

module.exports = router;

