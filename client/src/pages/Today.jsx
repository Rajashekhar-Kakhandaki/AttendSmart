import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, CheckCheck, X } from 'lucide-react';
import { useTodayAttendance, useUpdateAttendance } from '../api/hooks';

const STATUS_CONFIG = {
  PRESENT:  { label: 'Present',  colorClass: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20',  icon: CheckCircle2, leftColor: '#22c55e' },
  ABSENT:   { label: 'Absent',   colorClass: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20',       icon: XCircle,      leftColor: '#ef4444' },
  LATE:     { label: 'Late',     colorClass: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: Clock,        leftColor: '#eab308' },
  EXCUSED:  { label: 'Excused',  colorClass: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20',    icon: AlertCircle,  leftColor: '#3b82f6' },
};

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

function AttendanceCard({ record, onUpdate, index, total }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[record.status];
  const Icon = cfg.icon;
  const isLast = index === total - 1;

  return (
    <div className="flex gap-4 items-start">
      {/* ── Timeline column ────────────────────────── */}
      <div className="flex flex-col items-center shrink-0 pt-3.5">
        <div
          className="w-3.5 h-3.5 rounded-full ring-2 ring-offset-2 z-10"
          style={{
            backgroundColor: cfg.leftColor,
            ringColor: cfg.leftColor + '50',
            boxShadow: `0 0 8px ${cfg.leftColor}80`,
            ringOffsetColor: '#09090b',
          }}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)', minHeight: '28px' }} />
        )}
      </div>

      {/* ── Card ───────────────────────────────────── */}
      <div
        className="flex-1 rounded-2xl overflow-hidden transition-all duration-200 hover:translate-y-[-1px] mb-3"
        style={{
          background: 'rgba(17,17,21,0.92)',
          border: `1px solid ${cfg.leftColor}28`,
          boxShadow: `0 2px 16px rgba(0,0,0,0.35), 0 0 0 1px ${cfg.leftColor}10`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Top accent line */}
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, ${cfg.leftColor}60, transparent)` }} />

        <div className="flex items-center justify-between px-5 py-4">
          {/* Left: subject info */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${record.subject.color}cc, ${record.subject.color}66)`, boxShadow: `0 4px 12px ${record.subject.color}40` }}
            >
              {record.subject.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{record.subject.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Period {record.slot?.periodNumber}
                <span className="mx-1.5 text-gray-700">·</span>
                <Clock size={10} className="inline mb-0.5 mr-0.5 text-gray-600" />
                {record.slot?.startTime}
              </p>
            </div>
          </div>

          {/* Right: status + actions */}
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.colorClass}`}>
              <Icon size={11} />
              {cfg.label}
            </span>

            {record.status === 'PRESENT' ? (
              <button
                onClick={() => onUpdate(record.id, 'ABSENT')}
                className="text-xs px-3 py-1.5 rounded-xl bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20 transition-all font-medium whitespace-nowrap"
              >
                Mark absent
              </button>
            ) : (
              <button
                onClick={() => onUpdate(record.id, 'PRESENT')}
                className="text-xs px-3 py-1.5 rounded-xl bg-green-400/10 text-green-400 hover:bg-green-400/20 border border-green-400/20 transition-all font-medium whitespace-nowrap"
              >
                I attended
              </button>
            )}

            <button
              onClick={() => setOpen(!open)}
              className="text-gray-500 hover:text-gray-300 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all text-base leading-none"
            >
              ···
            </button>
          </div>
        </div>

        {open && (
          <div className="px-5 pb-4 flex gap-2 flex-wrap border-t border-white/5 pt-3">
            <p className="text-[10px] text-gray-600 w-full mb-1 uppercase tracking-wider font-medium">Change status</p>
            {STATUSES.map((s) => {
              const c = STATUS_CONFIG[s];
              const CIcon = c.icon;
              return (
                <button
                  key={s}
                  onClick={() => { onUpdate(record.id, s); setOpen(false); }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all font-medium ${
                    record.status === s
                      ? `${c.bg} ${c.colorClass}`
                      : 'border-surface-border text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CIcon size={11} />
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Today() {
  const { data, isLoading, refetch } = useTodayAttendance();
  const updateMutation = useUpdateAttendance();
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleUpdate = (id, status) => updateMutation.mutate({ id, status });

  const handleBulkMark = async (status) => {
    const records = data?.records;
    if (!records?.length) return;
    setBulkLoading(true);
    try {
      await Promise.all(records.map((r) => updateMutation.mutateAsync({ id: r.id, status })));
    } finally {
      setBulkLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="skeleton h-7 w-44 mb-2 rounded-xl" />
        <div className="skeleton h-4 w-36 mb-6 rounded-lg" />
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl mb-3" />)}
      </div>
    );
  }

  const records = data?.records || [];
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount  = records.filter((r) => r.status === 'ABSENT').length;
  const lateCount    = records.filter((r) => r.status === 'LATE').length;

  return (
    <div className="p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Today's Classes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost flex items-center gap-1.5 text-xs">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {data?.blocked && (
        <div className="card border-yellow-400/20 mb-4"
          style={{ background: 'rgba(234,179,8,0.06)', boxShadow: '0 0 20px rgba(234,179,8,0.10)' }}>
          <p className="text-yellow-400 text-sm font-medium">
            🎉 {data.blocked.type === 'HOLIDAY' ? 'Holiday' : 'Exam day'} — {data.blocked.label}. No classes to track.
          </p>
        </div>
      )}

      {records.length === 0 && !data?.blocked && (
        <div className="card text-center py-14">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-semibold text-white mb-1">No classes today!</p>
          <p className="text-sm text-gray-500">Enjoy your free day.</p>
        </div>
      )}

      {records.length > 0 && (
        <div className="space-y-1">
          {/* Summary & bulk actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="badge-present">{presentCount} present</span>
              {absentCount > 0 && <span className="badge-absent">{absentCount} absent</span>}
              {lateCount > 0 && <span className="badge-late">{lateCount} late</span>}
              <span className="text-gray-600">· {records.length} total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-600">Bulk:</span>
              <button
                onClick={() => handleBulkMark('PRESENT')}
                disabled={bulkLoading}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-green-400/10 text-green-400 hover:bg-green-400/20 border border-green-400/20 transition-all disabled:opacity-50 font-medium"
              >
                <CheckCheck size={11} /> All present
              </button>
              <button
                onClick={() => handleBulkMark('ABSENT')}
                disabled={bulkLoading}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20 transition-all disabled:opacity-50 font-medium"
              >
                <X size={11} /> All absent
              </button>
            </div>
          </div>

          {/* Timeline card list */}
          <div>
            {records.map((record, i) => (
              <AttendanceCard
                key={record.id}
                record={record}
                onUpdate={handleUpdate}
                index={i}
                total={records.length}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
