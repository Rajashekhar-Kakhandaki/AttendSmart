import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Search, Filter, Pencil, Check, X } from 'lucide-react';
import { useAttendanceHistory, useSubjects, useUpdateAttendance } from '../api/hooks';
import { PageLoader, EmptyState } from '../components/UI';

const STATUS_CONFIG = {
  PRESENT:  { label: 'Present', colorClass: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/25',  icon: CheckCircle2, leftColor: '#22c55e' },
  ABSENT:   { label: 'Absent',  colorClass: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/25',       icon: XCircle,      leftColor: '#ef4444' },
  LATE:     { label: 'Late',    colorClass: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/25', icon: Clock,        leftColor: '#eab308' },
  EXCUSED:  { label: 'Excused', colorClass: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/25',    icon: AlertCircle,  leftColor: '#3b82f6' },
};

const ALL_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

export default function History() {
  const [filters, setFilters] = useState({ subjectId: '', from: '', to: '' });
  const [applied, setApplied] = useState({});
  const [editingId, setEditingId]   = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [toast, setToast]           = useState(null);

  const { data: subjects } = useSubjects();
  const { data: records, isLoading } = useAttendanceHistory(applied);
  const updateAttendance = useUpdateAttendance();

  const apply = () => {
    const f = {};
    if (filters.subjectId) f.subjectId = filters.subjectId;
    if (filters.from) f.from = filters.from;
    if (filters.to)   f.to   = filters.to;
    setApplied(f);
  };

  const clear = () => { setFilters({ subjectId: '', from: '', to: '' }); setApplied({}); };
  const startEdit = (record) => { setEditingId(record.id); setEditStatus(record.status); };
  const cancelEdit = () => { setEditingId(null); setEditStatus(''); };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const confirmEdit = (recordId) => {
    updateAttendance.mutate({ id: recordId, status: editStatus }, {
      onSuccess: () => { showToast('success', 'Attendance updated!'); cancelEdit(); },
      onError:   () => { showToast('error', 'Failed to update.'); },
    });
  };

  const grouped = records?.reduce((acc, r) => {
    const d = new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {}) || {};

  return (
    <div className="p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold animate-[fadeIn_0.2s_ease-out] transition-all ${
            toast.type === 'success'
              ? 'text-green-300 border border-green-500/25'
              : 'text-red-300 border border-red-500/25'
          }`}
          style={{
            background: toast.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {toast.type === 'success' ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Attendance History</h1>
        <p className="text-sm text-gray-500 mt-0.5">Full log of all your classes · tap ✏️ to correct a record</p>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={13} className="text-brand-400" />
          <span className="text-sm font-semibold text-white">Filter</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="label">Subject</label>
            <select className="input text-sm py-2" value={filters.subjectId}
              onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}>
              <option value="">All subjects</option>
              {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" className="input text-sm py-2" value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input text-sm py-2" value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={apply} className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5">
            <Search size={12} /> Apply filters
          </button>
          {Object.keys(applied).length > 0 && (
            <button onClick={clear} className="btn-ghost text-sm px-3 py-1.5">Clear</button>
          )}
        </div>
      </div>

      {/* Summary badges */}
      {records?.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {['PRESENT','ABSENT','LATE','EXCUSED'].map((s) => {
            const count = records.filter((r) => r.status === s).length;
            if (!count) return null;
            const cfg = STATUS_CONFIG[s];
            return (
              <span key={s} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.bg} ${cfg.colorClass}`}>
                {count} {cfg.label}
              </span>
            );
          })}
        </div>
      )}

      {isLoading && <PageLoader message="Loading history..." />}

      {!isLoading && !records?.length && (
        <EmptyState icon="📋" title="No records found" message="Try adjusting your filters, or start logging attendance today." />
      )}

      <div className="flex flex-col gap-4">
      {!isLoading && Object.entries(grouped).map(([date, dayRecords]) => (
        <div key={date} className="mb-0 animate-[fadeIn_0.3s_ease-out]">
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-medium mb-2 px-1">{date}</p>
          <div className="card p-0 overflow-hidden">
            {dayRecords.map((record, i) => {
              const cfg = STATUS_CONFIG[record.status];
              const Icon = cfg.icon;
              const isEditing = editingId === record.id;
              const isSaving  = updateAttendance.isPending && editingId === record.id;

              return (
                <div
                  key={record.id}
                  className={`flex items-center justify-between px-4 py-3 transition-all ${
                    isEditing ? 'bg-brand-500/5' : 'hover:bg-white/2'
                  } ${i !== dayRecords.length - 1 ? 'border-b border-surface-border/60' : ''}`}
                  style={isEditing ? {} : {
                    borderLeft: `3px solid ${cfg.leftColor}40`,
                  }}
                >
                  {/* Left */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: record.subject.color }} />
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{record.subject.name}</p>
                      <p className="text-xs text-gray-600">P{record.slot?.periodNumber} · {record.slot?.startTime}</p>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {isEditing ? (
                      <>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="input text-xs py-1 px-2 h-auto"
                          disabled={isSaving}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => confirmEdit(record.id)}
                          disabled={isSaving || editStatus === record.status}
                          className="w-7 h-7 flex items-center justify-center rounded-xl bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all disabled:opacity-40"
                        >
                          {isSaving
                            ? <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                            : <Check size={13} />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.colorClass}`}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                        <button
                          onClick={() => startEdit(record)}
                          className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                        >
                          <Pencil size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
