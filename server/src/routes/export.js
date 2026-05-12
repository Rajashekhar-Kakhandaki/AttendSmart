const { Router } = require('express');
const auth = require('../middleware/auth');
const prisma = require('../services/prisma');

const router = Router();
router.use(auth);

// GET /api/export/csv — download full attendance as CSV
router.get('/csv', async (req, res, next) => {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { userId: req.user.id },
      include: { subject: true, slot: true },
      orderBy: [{ date: 'desc' }, { slot: { periodNumber: 'asc' } }],
    });

    const rows = [
      ['Date', 'Subject', 'Period', 'Start Time', 'Status'],
      ...records.map((r) => [
        new Date(r.date).toLocaleDateString('en-IN'),
        r.subject.name,
        r.slot?.periodNumber || '-',
        r.slot?.startTime || '-',
        r.status,
      ]),
    ];

    const csv = rows.map((r) => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendsmart-attendance.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /api/export/stats — summary JSON (for sharing / future PDF)
router.get('/stats', async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({ where: { userId: req.user.id } });

    const stats = await Promise.all(
      subjects.map(async (subject) => {
        const records = await prisma.attendanceRecord.findMany({
          where: { userId: req.user.id, subjectId: subject.id },
        });
        const appTotal    = records.length;
        const appAttended = records.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length;

        // Add pre-app history as an offset
        const total    = appTotal    + (subject.initialTotal    || 0);
        const attended = appAttended + (subject.initialAttended || 0);
        const absent   = total - attended;

        const threshold  = subject.minThreshold ?? req.user.minThreshold;
        const percentage = total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0;
        return { subject: subject.name, total, attended, absent, percentage, threshold, safe: percentage >= threshold };
      })
    );

    res.json({
      generatedAt: new Date().toISOString(),
      student: req.user.name,
      stats,
    });
  } catch (err) { next(err); }
});

module.exports = router;
