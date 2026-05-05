const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes       = require('./routes/auth');
const subjectRoutes    = require('./routes/subjects');
const timetableRoutes  = require('./routes/timetable');
const attendanceRoutes = require('./routes/attendance');
const bunkRoutes       = require('./routes/bunk');
const exportRoutes     = require('./routes/export');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/subjects',   subjectRoutes);
app.use('/api/timetable',  timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/bunk',       bunkRoutes);
app.use('/api/export',     exportRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
