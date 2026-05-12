const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const prisma = require('../services/prisma');

const router = Router();
router.use(auth);

const slotSchema = z.object({
  subjectId:    z.string().uuid(),
  dayOfWeek:    z.enum(['MON','TUE','WED','THU','FRI','SAT']),
  periodNumber: z.number().int().min(1).max(10),
  startTime:    z.string().regex(/^\d{2}:\d{2}$/),
  endTime:      z.string().regex(/^\d{2}:\d{2}$/),
});

// GET /api/timetable — full weekly schedule grouped by day
router.get('/', async (req, res, next) => {
  try {
    const slots = await prisma.timetableSlot.findMany({
      where: { userId: req.user.id },
      include: { subject: true },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });

    // Group by day for convenience
    const byDay = slots.reduce((acc, slot) => {
      if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
      acc[slot.dayOfWeek].push(slot);
      return acc;
    }, {});

    res.json({ slots, byDay });
  } catch (err) { next(err); }
});

// GET /api/timetable/today — today's slots (auto-excluding holidays)
router.get('/today', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const todayDay = days[today.getDay()];

    // Check if today is a holiday or exam
    const calendarEntry = await prisma.academicCalendar.findFirst({
      where: {
        userId: req.user.id,
        date: today,
        type: { in: ['HOLIDAY', 'EXAM'] },
      },
    });

    if (calendarEntry) {
      return res.json({
        slots: [],
        isHoliday: calendarEntry.type === 'HOLIDAY',
        isExam: calendarEntry.type === 'EXAM',
        label: calendarEntry.label,
      });
    }

    // Check if within semester
    const semesterEnd = await prisma.academicCalendar.findFirst({
      where: { userId: req.user.id, type: 'SEMESTER_END' },
    });
    const semesterStart = await prisma.academicCalendar.findFirst({
      where: { userId: req.user.id, type: 'SEMESTER_START' },
    });

    if (semesterStart && today < semesterStart.date) {
      return res.json({ slots: [], message: 'Semester has not started yet' });
    }
    if (semesterEnd && today > semesterEnd.date) {
      return res.json({ slots: [], message: 'Semester has ended' });
    }

    const slots = await prisma.timetableSlot.findMany({
      where: { userId: req.user.id, dayOfWeek: todayDay },
      include: { subject: true },
      orderBy: { periodNumber: 'asc' },
    });

    res.json({ slots, day: todayDay, date: today.toISOString().split('T')[0] });
  } catch (err) { next(err); }
});

// POST /api/timetable/slots — add a period slot
router.post('/slots', validate(slotSchema), async (req, res, next) => {
  try {
    // Verify subject belongs to user
    const subject = await prisma.subject.findFirst({
      where: { id: req.body.subjectId, userId: req.user.id },
    });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const slot = await prisma.timetableSlot.create({
      data: { ...req.body, userId: req.user.id },
      include: { subject: true },
    });
    res.status(201).json({ slot });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A class already exists at that day/period' });
    }
    next(err);
  }
});



// DELETE /api/timetable/slots/:id
router.delete('/slots/:id', async (req, res, next) => {
  try {
    const slot = await prisma.timetableSlot.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    await prisma.timetableSlot.delete({ where: { id: req.params.id } });
    res.json({ message: 'Slot removed' });
  } catch (err) { next(err); }
});

// POST /api/timetable/calendar — add holiday/exam/semester dates
router.post('/calendar', async (req, res, next) => {
  try {
    const { date, type, label } = req.body;
    const entry = await prisma.academicCalendar.upsert({
      where: { userId_date_type: { userId: req.user.id, date: new Date(date), type } },
      update: { label },
      create: { userId: req.user.id, date: new Date(date), type, label },
    });
    res.status(201).json({ entry });
  } catch (err) { next(err); }
});

// GET /api/timetable/calendar
router.get('/calendar', async (req, res, next) => {
  try {
    const entries = await prisma.academicCalendar.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'asc' },
    });
    res.json({ entries });
  } catch (err) { next(err); }
});

// PUT /api/timetable/slots/:id — update a period slot
router.put('/slots/:id', validate(slotSchema), async (req, res, next) => {
  try {
    const slot = await prisma.timetableSlot.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    // Verify subject belongs to user
    const subject = await prisma.subject.findFirst({
      where: { id: req.body.subjectId, userId: req.user.id },
    });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const updated = await prisma.timetableSlot.update({
      where: { id: req.params.id },
      data: req.body,
      include: { subject: true },
    });
    res.json({ slot: updated });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A class already exists at that day/period' });
    }
    next(err);
  }
});



// DELETE /api/timetable/calendar/:id
router.delete('/calendar/:id', async (req, res, next) => {
  try {
    const entry = await prisma.academicCalendar.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    await prisma.academicCalendar.delete({ where: { id: req.params.id } });
    res.json({ message: 'Calendar entry removed' });
  } catch (err) { next(err); }
});

// PUT /api/timetable/calendar/:id — update a calendar entry
router.put('/calendar/:id', async (req, res, next) => {
  try {
    const entry = await prisma.academicCalendar.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const { date, type, label } = req.body;
    const updated = await prisma.academicCalendar.update({
      where: { id: req.params.id },
      data: { date: new Date(date), type, label },
    });
    res.json({ entry: updated });
  } catch (err) { next(err); }
});

module.exports = router;
