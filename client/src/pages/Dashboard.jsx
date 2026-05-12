import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, Download, BookOpen, CheckCircle2, XCircle, Flame, Zap } from 'lucide-react';
import { useAttendanceStats, useStreak } from '../api/hooks';
import useAuthStore from '../store/authStore';
import api from '../api/client';
import ForecastSection from '../components/ForecastSection';

function StatCard({ label, value, sub, colorClass = 'text-white', icon: Icon, glowColor }) {
  return (
    <div className="card group hover:scale-[1.02] transition-transform duration-200 cursor-default"
      style={glowColor ? {
        borderColor: glowColor + '33',
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${glowColor}11, inset 0 1px 0 ${glowColor}08`,
      } : {}}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium">{label}</p>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${colorClass === 'text-green-400' ? 'bg-green-400/10' : colorClass === 'text-red-400' ? 'bg-red-400/10' : colorClass === 'text-brand-500' ? 'bg-brand-500/10' : colorClass === 'text-orange-400' ? 'bg-orange-400/10' : 'bg-white/5'}`}>
            <Icon size={13} className={colorClass} />
          </div>
        )}
      </div>
      <p className={`text-2xl font-display font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function SubjectBar({ stat }) {
  const threshold = stat.threshold;
  const pct = stat.percentage;
  const isSafe = stat.isSafe;
  const isGood = isSafe && stat.safeBunks > 3;
  const color = isGood ? '#22c55e' : isSafe ? '#eab308' : '#ef4444';
  const glowColor = isGood ? 'rgba(34,197,94,0.25)' : isSafe ? 'rgba(234,179,8,0.20)' : 'rgba(239,68,68,0.25)';

  return (
    <div className="card group hover:scale-[1.005] transition-transform duration-200"
      style={{ borderColor: color + '22', boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${color}0d` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-surface-card"
            style={{ backgroundColor: stat.subject.color, ringColor: stat.subject.color + '60' }} />
          <span className="text-sm font-semibold text-white">{stat.subject.name}</span>
          {stat.subject.isMustAttend && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/20 font-medium">
              100% goal
            </span>
          )}
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full mb-2.5 overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 8px ${glowColor}` }}
        />
        <div className="absolute top-0 h-full w-px" style={{ left: `${threshold}%`, background: 'rgba(255,255,255,0.25)' }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{stat.attended}/{stat.total} classes</span>
        {isSafe ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color, background: color + '15' }}>
            {stat.safeBunks} safe bunk{stat.safeBunks !== 1 ? 's' : ''} left
          </span>
        ) : (
          <span className="text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
            Attend {stat.classesNeeded} more
          </span>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { data: stats, isLoading } = useAttendanceStats();
  const { data: streakData } = useStreak();
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="skeleton h-8 w-48 mb-2 rounded-xl" />
        <div className="skeleton h-4 w-64 mb-6 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-36 rounded-2xl mb-4" />
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl mb-3" />)}
      </div>
    );
  }

  if (!stats?.length) {
    return (
      <div className="p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">
        <h1 className="text-2xl font-display font-bold text-white mb-2">Dashboard</h1>
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🎒</div>
          <p className="font-semibold text-white mb-1.5 text-lg">Nothing here yet</p>
          <p className="text-sm text-gray-500">Head to <strong className="text-brand-400">Setup</strong> to add your subjects and timetable first.</p>
        </div>
      </div>
    );
  }

  const avgPct = parseFloat((stats.reduce((s, x) => s + x.percentage, 0) / stats.length).toFixed(1));
  const safeCount = stats.filter((s) => s.isSafe).length;
  const totalSafeBunks = stats.reduce((s, x) => s + x.safeBunks, 0);
  const atRisk = stats.filter((s) => !s.isSafe).length;

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
    a.download = 'attendsmart-attendance.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 mb-0.5">{getGreeting()},</p>
          <h1 className="text-2xl font-display font-bold text-white">
            {user?.name?.split(' ')[0]} <span className="text-gray-600 font-normal text-xl">👋</span>
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">Target: ≥{user?.minThreshold}% across all subjects</p>
        </div>
        <button onClick={exportCSV} className="btn-ghost flex items-center gap-1.5 text-xs">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* At-risk alert */}
      {atRisk > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-red-500/25 text-red-400 text-sm mb-5"
          style={{ background: 'rgba(239,68,68,0.07)', boxShadow: '0 0 20px rgba(239,68,68,0.10)' }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold">
              {atRisk} subject{atRisk > 1 ? 's are' : ' is'} below your {user?.minThreshold}% threshold!
            </p>
            <p className="text-xs text-red-400/60 mt-0.5">Check the breakdown below and attend required classes to recover.</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          label="Average" value={`${avgPct}%`} sub="across all subjects"
          colorClass={avgPct >= user?.minThreshold ? 'text-green-400' : 'text-red-400'}
          icon={avgPct >= user?.minThreshold ? TrendingUp : TrendingDown}
          glowColor={avgPct >= user?.minThreshold ? '#22c55e' : '#ef4444'}
        />
        <StatCard
          label="Safe bunks" value={totalSafeBunks} sub="across all subjects"
          colorClass="text-brand-400" icon={Shield} glowColor="#6366f1"
        />
        <StatCard label="Safe subjects" value={`${safeCount}/${stats.length}`} sub="above threshold" colorClass="text-green-400" glowColor="#22c55e" />
        <StatCard
          label="At risk" value={atRisk}
          sub={atRisk > 0 ? 'below threshold' : 'all good!'}
          colorClass={atRisk > 0 ? 'text-red-400' : 'text-green-400'}
          icon={atRisk > 0 ? AlertTriangle : undefined}
          glowColor={atRisk > 0 ? '#ef4444' : '#22c55e'}
        />
        <StatCard
          label="🔥 Streak" value={`${streakData?.streak ?? 0}d`}
          sub={streakData?.bestStreak ? `Best: ${streakData.bestStreak}d` : 'Keep attending!'}
          colorClass={streakData?.streak > 0 ? 'text-orange-400' : 'text-gray-500'}
          icon={streakData?.streak > 0 ? Flame : undefined}
          glowColor={streakData?.streak > 0 ? '#f97316' : undefined}
        />
      </div>

      {/* Overall Attendance Banner */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-brand-400" />
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Overall Attendance</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <BookOpen size={14} className="text-gray-400" />
            <p className="text-2xl font-display font-bold text-white">{totalHeld}</p>
            <p className="text-[11px] text-gray-500">Classes Held</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <CheckCircle2 size={14} className="text-green-400" />
            <p className="text-2xl font-display font-bold text-green-400">{totalAttended}</p>
            <p className="text-[11px] text-gray-500">Attended</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <XCircle size={14} className="text-red-400" />
            <p className="text-2xl font-display font-bold text-red-400">{totalAbsent}</p>
            <p className="text-[11px] text-gray-500">Absent</p>
          </div>
        </div>

        {totalHeld > 0 && (
          <div className="space-y-1.5">
            <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full transition-all duration-700"
                style={{ width: `${attendedPct}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)', boxShadow: '0 0 10px rgba(34,197,94,0.4)' }} />
              <div className="h-full transition-all duration-700"
                style={{ width: `${absentPct}%`, background: 'rgba(239,68,68,0.7)' }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-400 font-medium">{attendedPct}% present</span>
              <span className="text-red-400 font-medium">{absentPct}% absent</span>
            </div>
          </div>
        )}
      </div>

      {/* Subject breakdown */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-surface-border" />
        <p className="text-xs text-gray-600 uppercase tracking-widest font-medium px-2">Subject Breakdown</p>
        <div className="h-px flex-1 bg-surface-border" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="grid grid-cols-1 gap-3">
          {stats
            .sort((a, b) => a.percentage - b.percentage)
            .map((stat) => <SubjectBar key={stat.subject.id} stat={stat} />)}
        </div>
        <div>
          <ForecastSection />
        </div>
      </div>
    </div>
  );
}
