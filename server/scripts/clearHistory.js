/**
 * One-time cleanup script — deletes ALL AttendanceRecord rows.
 * Run: node server/scripts/clearHistory.js
 *
 * Safe to run while server is stopped OR running (Prisma handles connections).
 * Prior Attendance (initialTotal / initialAttended on Subject) is NOT touched.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.attendanceRecord.count();
  console.log(`\n📋 Found ${count} attendance record(s) in the database.`);

  if (count === 0) {
    console.log('✅ Nothing to delete. History is already empty.\n');
    return;
  }

  const { count: deleted } = await prisma.attendanceRecord.deleteMany({});
  console.log(`🗑️  Deleted ${deleted} record(s) successfully.`);
  console.log('✅ History cleared. Tracking will start fresh from tomorrow.\n');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
