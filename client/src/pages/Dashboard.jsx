import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, Download, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { useAttendanceStats } from '../api/hooks';
import useAuthStore from '../store/authStore';
import api from '../api/client';

function StatCard({ label, value, sub, color = 'text-white', icon: Icon }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon size={14} className={color} />}
      </div>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function SubjectBar({ stat }) {
  const threshold = stat.threshold;
  const pct = stat.percentage;
  const color = stat.isSafe
    ? stat.safeBunks > 3 ? '#22c55e' : '#eab308'
    : '#ef4444';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.subject.color }} />
          <span className="text-sm font-medium text-white">{stat.subject.name}</span>
          {stat.subject.isMustAttend && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/20">
              100% goal
            </span>
          )}
        </div>
        <span className="text-sm font-semibold" style={{ color }}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface rounded-full mb-2 relative overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        {/* Threshold marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-500"
          style={{ left: `${threshold}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{stat.attended}/{stat.total} classes</span>
        {stat.isSafe ? (
          <span className="text-green-400">
            {stat.safeBunks} safe bunk{stat.safeBunks !== 1 ? 's' : ''} left
          </span>
        ) : (
          <span className="text-red-400">
            Attend {stat.classesNeeded} more to recover
          </span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useAttendanceStats();
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return <div className="p-6 text-gray-400 text-sm">Loading your dashboard...</div>;
  }

  if (!stats?.length) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-white mb-2">Dashboard</h1>
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🎒</p>
          <p className="font-medium text-white mb-1">Nothing here yet</p>
          <p className="text-sm">Head to <strong>Setup</strong> to add your subjects and timetable first.</p>
        </div>
      </div>
    );
  }

  const avgPct = parseFloat((stats.reduce((s, x) => s + x.percentage, 0) / stats.length).toFixed(1));
  const safeCount = stats.filter((s) => s.isSafe).length;
  const totalSafeBunks = stats.reduce((s, x) => s + x.safeBunks, 0);
  const atRisk = stats.filter((s) => !s.isSafe).length;

  // Overall totals
  const totalHeld     = stats.reduce((s, x) => s + x.total, 0);
  const totalAttended = stats.reduce((s, x) => s + x.attended, 0);
  const totalAbsent   = stats.reduce((s, x) => s + x.absent, 0);
  const attendedPct   = totalHeld > 0 ? parseFloat(((totalAttended / totalHeld) * 100).toFixed(1)) : 0;
  const absentPct     = totalHeld > 0 ? parseFloat(((totalAbsent  / totalHeld) * 100).toFixed(1)) : 0;

  const exportCSV = async () => {
    const res = await api.get('/export/csv', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement('a');
    a.href    = url;
    a.download = 'bunksmart-attendance.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Target: ≥{user?.minThreshold}% across all subjects</p>
        </div>
        <button onClick={exportCSV} className="btn-ghost flex items-center gap-1.5 text-sm">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* At-risk alert */}
      {atRisk > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm mb-5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">
              {atRisk} subject{atRisk > 1 ? 's are' : ' is'} below your {user?.minThreshold}% threshold!
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">
              Check the breakdown below and attend required classes to recover.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Average"
          value={`${avgPct}%`}
          sub="across all subjects"
          color={avgPct >= user?.minThreshold ? 'text-green-400' : 'text-red-400'}
          icon={avgPct >= user?.minThreshold ? TrendingUp : TrendingDown}
        />
        <StatCard
          label="Safe bunks left"
          value={totalSafeBunks}
          sub="across all subjects"
          color="text-brand-500"
          icon={Shield}
        />
        <StatCard label="Safe subjects" value={`${safeCount}/${stats.length}`} sub="above threshold" color="text-green-400" />
        <StatCard
          label="At risk"
          value={atRisk}
          sub={atRisk > 0 ? 'subjects below threshold' : 'all good!'}
          color={atRisk > 0 ? 'text-red-400' : 'text-green-400'}
          icon={atRisk > 0 ? AlertTriangle : undefined}
        />
      </div>

      {/* Overall Attendance Banner */}
      <div className="card mb-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Overall Attendance</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Held */}
          <div className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <BookOpen size={15} className="text-gray-400" />
            <p className="text-2xl font-bold text-white">{totalHeld}</p>
            <p className="text-xs text-gray-500">Classes Held</p>
          </div>
          {/* Attended */}
          <div className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle2 size={15} className="text-green-400" />
            <p className="text-2xl font-bold text-green-400">{totalAttended}</p>
            <p className="text-xs text-gray-500">Attended</p>
          </div>
          {/* Absent */}
          <div className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <XCircle size={15} className="text-red-400" />
            <p className="text-2xl font-bold text-red-400">{totalAbsent}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </div>
        </div>

        {/* Segmented progress bar */}
        {totalHeld > 0 && (
          <div className="space-y-1.5">
            <div className="h-2.5 rounded-full overflow-hidden flex bg-white/5">
              <div
                className="h-full bg-green-500 transition-all duration-700"
                style={{ width: `${attendedPct}%` }}
              />
              <div
                className="h-full bg-red-500/70 transition-all duration-700"
                style={{ width: `${absentPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="text-green-400">{attendedPct}% present</span>
              <span className="text-red-400">{absentPct}% absent</span>
            </div>
          </div>
        )}
      </div>

      {/* Per-subject breakdown */}
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
        Subject breakdown
      </h2>
      <div className="space-y-3">
        {stats
          .sort((a, b) => a.percentage - b.percentage) // lowest first
          .map((stat) => (
            <SubjectBar key={stat.subject.id} stat={stat} />
          ))}
      </div>
    </div>
  );
}
