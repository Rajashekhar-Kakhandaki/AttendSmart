import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useTodayAttendance, useUpdateAttendance } from '../api/hooks';

const STATUS_CONFIG = {
  PRESENT:  { label: 'Present',  color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30',  icon: CheckCircle2 },
  ABSENT:   { label: 'Absent',   color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30',       icon: XCircle },
  LATE:     { label: 'Late',     color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', icon: Clock },
  EXCUSED:  { label: 'Excused',  color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30',    icon: AlertCircle },
};

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

function AttendanceCard({ record, onUpdate }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[record.status];
  const Icon = cfg.icon;

  return (
    <div className={`card border transition-all ${cfg.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: record.subject.color }}
          />
          <div>
            <p className="font-medium text-white">{record.subject.name}</p>
            <p className="text-xs text-gray-500">Period {record.slot?.periodNumber} · {record.slot?.startTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-sm font-medium ${cfg.color}`}>
            <Icon size={14} />
            {cfg.label}
          </span>

          {/* Quick mark absent button - the key UX */}
          {record.status === 'PRESENT' && (
            <button
              onClick={() => onUpdate(record.id, 'ABSENT')}
              className="text-xs px-2.5 py-1 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20 transition-colors"
            >
              Mark absent
            </button>
          )}

          {record.status !== 'PRESENT' && (
            <button
              onClick={() => onUpdate(record.id, 'PRESENT')}
              className="text-xs px-2.5 py-1 rounded-lg bg-green-400/10 text-green-400 hover:bg-green-400/20 border border-green-400/20 transition-colors"
            >
              I attended
            </button>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded transition-colors"
          >
            ···
          </button>
        </div>
      </div>

      {/* Dropdown for other statuses */}
      {open && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {STATUSES.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => { onUpdate(record.id, s); setOpen(false); }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  record.status === s
                    ? `${c.bg} ${c.color} font-medium`
                    : 'border-surface-border text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Today() {
  const { data, isLoading, refetch } = useTodayAttendance();
  const updateMutation = useUpdateAttendance();

  const handleUpdate = (id, status) => {
    updateMutation.mutate({ id, status });
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-gray-400">
        <RefreshCw size={16} className="animate-spin" />
        Loading today's schedule...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Today's Classes</h1>
          <p className="text-sm text-gray-400 mt-0.5">{today}</p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost flex items-center gap-1.5 text-sm">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {data?.blocked && (
        <div className="card border-yellow-400/30 bg-yellow-400/5 text-yellow-400 text-sm">
          🎉 {data.blocked.type === 'HOLIDAY' ? 'Holiday' : 'Exam day'} — {data.blocked.label}. No classes to track.
        </div>
      )}

      {data?.records?.length === 0 && !data?.blocked && (
        <div className="card text-gray-400 text-sm text-center py-8">
          No classes scheduled today. Enjoy your day! 🎉
        </div>
      )}

      {data?.records?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 mb-4">
            All classes defaulted to <span className="text-green-400 font-medium">Present</span>. Tap "Mark absent" only if you skipped.
          </p>
          {data.records.map((record) => (
            <AttendanceCard key={record.id} record={record} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
