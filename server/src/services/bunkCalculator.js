/**
 * BunkSmart — Bunk Calculator Service
 * Pure math, no AI. Gemini reads the output of this.
 */

/**
 * Count remaining countable class days for a subject
 * (excludes weekends with no class, holidays, exams, days after semester end)
 */
function getRemainingDays(timetableSlots, calendarEntries, semesterEndDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = semesterEndDate ? new Date(semesterEndDate) : null;
  const blockedDates = new Set(
    calendarEntries
      .filter((e) => e.type === 'HOLIDAY' || e.type === 'EXAM')
      .map((e) => new Date(e.date).toDateString())
  );

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const slotDays = new Set(timetableSlots.map((s) => s.dayOfWeek));

  let count = 0;
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1); // start from tomorrow

  // Count up to semester end or 120 days ahead
  const limit = end || new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000);

  while (cursor <= limit) {
    const dayName = days[cursor.getDay()];
    if (slotDays.has(dayName) && !blockedDates.has(cursor.toDateString())) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

/**
 * Calculate safe bunks remaining for one subject
 */
function calculateSafeBunks({ attended, total, threshold, remainingClasses }) {
  // After remaining classes, if we bunk B of them:
  // new attended = attended, new total = total + remaining
  // We need: attended / (total + remaining) >= threshold/100
  // Rearranged: attended >= threshold/100 * (total + remaining)
  // So max bunks from remaining = remaining - ceil(threshold/100 * (total + remaining) - attended)

  const thresholdRatio = threshold / 100;
  const minAttendRequired = Math.ceil(thresholdRatio * (total + remainingClasses));
  const canSkip = attended - minAttendRequired;

  // Also add bunk room from remaining classes
  const futureMustAttend = Math.max(0, minAttendRequired - attended);
  const safeBunksFromFuture = remainingClasses - futureMustAttend;

  return Math.max(0, safeBunksFromFuture);
}

/**
 * What-if simulator: if I bunk N more classes across subjects, what happens?
 */
function simulateWhatIf({ stats, additionalBunks }) {
  return stats.map((s) => {
    const newAbsent   = s.absent + (additionalBunks[s.subject.id] || 0);
    const newAttended = s.attended - (additionalBunks[s.subject.id] || 0);
    const newTotal    = s.total;
    const newPct = newTotal > 0 ? parseFloat(((newAttended / newTotal) * 100).toFixed(2)) : 0;

    return {
      subjectId:     s.subject.id,
      subjectName:   s.subject.name,
      currentPct:    s.percentage,
      simulatedPct:  Math.max(0, newPct),
      simulatedAbsent: newAbsent,
      isSafeAfter:   newPct >= s.threshold,
      delta:         Math.max(0, newPct) - s.percentage,
    };
  });
}

module.exports = { calculateSafeBunks, getRemainingDays, simulateWhatIf };
