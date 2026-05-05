import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
} from 'recharts';
import { useAttendanceStats, useAttendanceHistory } from '../api/hooks';
import { PageLoader } from '../components/UI';

const SUBJECT_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}%</p>
      ))}
    </div>
  );
}

function AttendancePieAlternative({ stats }) {
  return (
    <div className="card mb-4">
      <h2 className="text-sm font-medium text-white mb-1">Attendance by Subject</h2>
      <p className="text-xs text-gray-500 mb-4">Your current attendance percentage for each subject</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2b30" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="subject.name" tick={{ fill: '#9ca3af', fontSize: 12 }} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]} name="Attendance">
              {stats.map((s, i) => (
                <Cell key={s.subject.id} fill={s.subject.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WeeklyTrendChart({ records, subjects }) {
  // Empty state — no records at all
  const emptyCard = (msg) => (
    <div className="card mb-4">
      <h2 className="text-sm font-medium text-white mb-1">Weekly Attendance Trend</h2>
      <p className="text-xs text-gray-500 mb-4">
        How your attendance % changes week-by-week per subject
      </p>
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <p className="text-3xl">📈</p>
        <p className="text-sm text-gray-500">{msg}</p>
        <p className="text-xs text-gray-600">Data will appear as you log classes each day</p>
      </div>
    </div>
  );

  if (!records?.length) return emptyCard('No attendance history yet');

  // ── Correct week-boundary calculation ────────────────────────────────────────
  // Anchor to Monday of the CURRENT week, then step back w×7 days.
  // w=3 → W1 (3 weeks ago) | w=2 → W2 | w=1 → W3 | w=0 → W4 (this week)
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Mon=1 … Sun=7
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);

  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() - w * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Label: "W1 (Apr 14)" style
    const labelDate = weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const weekData = { name: `W${4 - w}`, label: labelDate };

    subjects?.forEach((sub) => {
      const weekRecords = records.filter((r) => {
        const d = new Date(r.date);
        return r.subjectId === sub.id && d >= weekStart && d <= weekEnd;
      });
      const total    = weekRecords.length;
      const attended = weekRecords.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length;
      weekData[sub.name] = total > 0 ? parseFloat(((attended / total) * 100).toFixed(1)) : null;
    });

    weeks.push(weekData);
  }

  // Check if there's at least one real data point to show
  const hasData = weeks.some((w) =>
    subjects?.some((sub) => w[sub.name] !== null && w[sub.name] !== undefined)
  );

  if (!hasData) return emptyCard('No records in the last 4 weeks');

  return (
    <div className="card mb-4">
      <h2 className="text-sm font-medium text-white mb-1">Weekly Attendance Trend</h2>
      <p className="text-xs text-gray-500 mb-4">
        How your attendance % changes week-by-week per subject
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeks} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2b30" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
            {subjects?.map((sub, i) => (
              <Line
                key={sub.id}
                type="monotone"
                dataKey={sub.name}
                stroke={sub.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BunkSavingsCard({ stats }) {
  const totalSafe   = stats.reduce((s, x) => s + x.safeBunks, 0);
  const totalAbsent = stats.reduce((s, x) => s + x.absent, 0);
  const avgPct      = stats.length ? parseFloat((stats.reduce((s, x) => s + x.percentage, 0) / stats.length).toFixed(1)) : 0;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="card text-center">
        <p className="text-2xl font-semibold text-brand-500">{totalSafe}</p>
        <p className="text-xs text-gray-500 mt-1">Safe bunks left</p>
      </div>
      <div className="card text-center">
        <p className="text-2xl font-semibold text-white">{avgPct}%</p>
        <p className="text-xs text-gray-500 mt-1">Average attendance</p>
      </div>
      <div className="card text-center">
        <p className="text-2xl font-semibold text-red-400">{totalAbsent}</p>
        <p className="text-xs text-gray-500 mt-1">Total absences</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data: stats, isLoading } = useAttendanceStats();
  const { data: records } = useAttendanceHistory();

  if (isLoading) return <PageLoader message="Crunching the numbers..." />;

  if (!stats?.length) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-white mb-6">Analytics</h1>
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium text-white mb-1">No data yet</p>
          <p className="text-sm">Start logging attendance to see your trends.</p>
        </div>
      </div>
    );
  }

  const subjects = stats.map((s) => s.subject);

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Attendance trends and insights</p>
      </div>

      <BunkSavingsCard stats={stats} />
      <AttendancePieAlternative stats={stats} />
      <WeeklyTrendChart records={records} subjects={subjects} />
    </div>
  );
}
