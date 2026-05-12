import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
} from 'recharts';
import { useAttendanceStats, useAttendanceHistory, useMoodHistory } from '../api/hooks';
import { PageLoader } from '../components/UI';
import { Shield, TrendingDown, TrendingUp } from 'lucide-react';

const SUBJECT_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6'];

const MOOD_META = {
  HAPPY:    { emoji: '😄', label: 'Happy',   color: '#22c55e' },
  CHILL:    { emoji: '😌', label: 'Chill',   color: '#6366f1' },
  TIRED:    { emoji: '😴', label: 'Tired',   color: '#f59e0b' },
  STRESSED: { emoji: '😰', label: 'Stressed', color: '#ef4444' },
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs shadow-2xl"
      style={{ background: 'rgba(17,17,21,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
      <p className="text-gray-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-semibold" style={{ color: p.color }}>{p.value}%</span>
        </p>
      ))}
    </div>
  );
}

function MoodTrendsSection({ logs }) {
  if (!logs?.length) {
    return (
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-white mb-1">Mood Trends</h2>
        <p className="text-xs text-gray-500 mb-6">Your emotional patterns over the last 30 days</p>
        <div className="flex flex-col items-center justify-center h-20 gap-2">
          <p className="text-3xl">🙂</p>
          <p className="text-sm text-gray-500">Log your mood daily to see patterns here</p>
        </div>
      </div>
    );
  }

  const counts = { HAPPY: 0, CHILL: 0, TIRED: 0, STRESSED: 0 };
  logs.forEach((l) => { if (counts[l.mood] !== undefined) counts[l.mood]++; });
  const total = logs.length;
  const distribution = Object.entries(counts).map(([mood, count]) => ({
    mood,
    label: MOOD_META[mood].label,
    count,
    pct: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
    color: MOOD_META[mood].color,
  }));

  const moodByDate = {};
  logs.forEach((l) => { moodByDate[l.date] = l.mood; });

  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    days.push({ key, label, mood: moodByDate[key] || null });
  }

  const dominant = distribution.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-white">Mood Trends</h2>
        <span className="text-xs text-gray-600">Last 30 days · {total} logged</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        You're mostly{' '}
        <span style={{ color: dominant.color }} className="font-semibold">
          {MOOD_META[dominant.mood]?.emoji} {dominant.label}
        </span>{' '}
        ({dominant.pct}% of days)
      </p>

      <div className="mb-4">
        <p className="text-[11px] text-gray-600 mb-2 uppercase tracking-widest font-medium">30-day timeline</p>
        <div className="flex flex-wrap gap-1">
          {days.map((d) => (
            <div
              key={d.key}
              title={d.mood ? `${d.label}: ${MOOD_META[d.mood]?.label}` : `${d.label}: not logged`}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm cursor-default transition-transform hover:scale-125"
              style={{
                backgroundColor: d.mood ? `${MOOD_META[d.mood]?.color}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${d.mood ? MOOD_META[d.mood]?.color + '35' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              {d.mood ? MOOD_META[d.mood]?.emoji : <span className="text-gray-700 text-xs">·</span>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] text-gray-600 mb-3 uppercase tracking-widest font-medium">Distribution</p>
        <div className="space-y-2.5">
          {distribution.map((d) => (
            <div key={d.mood} className="flex items-center gap-3">
              <span className="text-lg w-7 text-center">{MOOD_META[d.mood]?.emoji}</span>
              <span className="text-xs text-gray-500 w-14">{d.label}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${d.pct}%`, backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}60` }}
                />
              </div>
              <span className="text-xs font-bold w-10 text-right tabular-nums" style={{ color: d.color }}>{d.pct}%</span>
              <span className="text-xs text-gray-600 w-8 text-right tabular-nums">{d.count}d</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AttendancePieAlternative({ stats }) {
  return (
    <div className="card mb-4">
      <h2 className="text-sm font-semibold text-white mb-1">Attendance by Subject</h2>
      <p className="text-xs text-gray-500 mb-4">Your current attendance percentage for each subject</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats} layout="vertical" margin={{ left: 10, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 11 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="subject.name" tick={{ fill: '#9ca3af', fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="percentage" radius={[0, 6, 6, 0]} name="Attendance">
              {stats.map((s, i) => (
                <Cell key={s.subject.id} fill={s.subject.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WeeklyTrendChart({ records, subjects }) {
  const emptyCard = (msg) => (
    <div className="card mb-4">
      <h2 className="text-sm font-semibold text-white mb-1">Weekly Attendance Trend</h2>
      <p className="text-xs text-gray-500 mb-4">How your attendance % changes week-by-week per subject</p>
      <div className="flex flex-col items-center justify-center h-28 gap-2">
        <p className="text-3xl">📈</p>
        <p className="text-sm text-gray-500">{msg}</p>
        <p className="text-xs text-gray-600">Data will appear as you log classes each day</p>
      </div>
    </div>
  );

  if (!records?.length) return emptyCard('No attendance history yet');

  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
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

  const hasData = weeks.some((w) => subjects?.some((sub) => w[sub.name] !== null && w[sub.name] !== undefined));
  if (!hasData) return emptyCard('No records in the last 4 weeks');

  return (
    <div className="card mb-4">
      <h2 className="text-sm font-semibold text-white mb-1">Weekly Attendance Trend</h2>
      <p className="text-xs text-gray-500 mb-4">How your attendance % changes week-by-week per subject</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeks} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 11 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
            {subjects?.map((sub, i) => (
              <Line
                key={sub.id}
                type="monotone"
                dataKey={sub.name}
                stroke={sub.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 0, fill: sub.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}
                activeDot={{ r: 6, strokeWidth: 0 }}
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
      <div className="card text-center hover:scale-[1.02] transition-transform cursor-default"
        style={{ borderColor: 'rgba(99,102,241,0.20)', boxShadow: '0 0 20px rgba(99,102,241,0.10)' }}>
        <div className="w-8 h-8 rounded-xl bg-brand-500/15 flex items-center justify-center mx-auto mb-2">
          <Shield size={15} className="text-brand-400" />
        </div>
        <p className="text-xl font-display font-bold text-brand-400">{totalSafe}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Safe bunks left</p>
      </div>
      <div className="card text-center hover:scale-[1.02] transition-transform cursor-default"
        style={{ borderColor: avgPct >= 75 ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.20)' }}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${avgPct >= 75 ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
          {avgPct >= 75 ? <TrendingUp size={15} className="text-green-400" /> : <TrendingDown size={15} className="text-red-400" />}
        </div>
        <p className={`text-xl font-display font-bold ${avgPct >= 75 ? 'text-green-400' : 'text-red-400'}`}>{avgPct}%</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Average attendance</p>
      </div>
      <div className="card text-center hover:scale-[1.02] transition-transform cursor-default"
        style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
        <div className="w-8 h-8 rounded-xl bg-red-400/10 flex items-center justify-center mx-auto mb-2">
          <span className="text-sm">📉</span>
        </div>
        <p className="text-xl font-display font-bold text-red-400">{totalAbsent}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Total absences</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data: stats, isLoading } = useAttendanceStats();
  const { data: records }          = useAttendanceHistory();
  const { data: moodLogs }         = useMoodHistory(30);

  if (isLoading) return <PageLoader message="Crunching the numbers..." />;

  if (!stats?.length) {
    return (
      <div className="p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">
        <h1 className="text-2xl font-display font-bold text-white mb-6">Analytics</h1>
        <div className="card text-center py-14">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-white mb-1 text-lg">No data yet</p>
          <p className="text-sm text-gray-500">Start logging attendance to see your trends.</p>
        </div>
      </div>
    );
  }

  const subjects = stats.map((s) => s.subject);

  return (
    <div className="p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Attendance trends and insights</p>
      </div>

      <BunkSavingsCard stats={stats} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AttendancePieAlternative stats={stats} />
        <WeeklyTrendChart records={records} subjects={subjects} />
      </div>
      <MoodTrendsSection logs={moodLogs} />
    </div>
  );
}
