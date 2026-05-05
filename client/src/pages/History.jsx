import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Search, Filter, Pencil, Check, X } from 'lucide-react';
import { useAttendanceHistory, useSubjects, useUpdateAttendance } from '../api/hooks';
import { PageLoader, EmptyState } from '../components/UI';

const STATUS_CONFIG = {
  PRESENT:  { label: 'Present', color: 'text-green-400',  bg: 'bg-green-400/10',  icon: CheckCircle2 },
  ABSENT:   { label: 'Absent',  color: 'text-red-400',    bg: 'bg-red-400/10',    icon: XCircle },
  LATE:     { label: 'Late',    color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
  EXCUSED:  { label: 'Excused', color: 'text-blue-400',   bg: 'bg-blue-400/10',   icon: AlertCircle },
};

const ALL_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

export default function History() {
  const [filters, setFilters] = useState({ subjectId: '', from: '', to: '' });
  const [applied, setApplied]   = useState({});

  // id of the record currently being edited
  const [editingId, setEditingId]     = useState(null);
  const [editStatus, setEditStatus]   = useState('');
  const [toast, setToast]             = useState(null); // { type: 'success'|'error', msg }

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

  const clear = () => {
    setFilters({ subjectId: '', from: '', to: '' });
    setApplied({});
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditStatus(record.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStatus('');
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const confirmEdit = (recordId) => {
    updateAttendance.mutate(
      { id: recordId, status: editStatus },
      {
        onSuccess: () => {
          showToast('success', 'Attendance updated successfully!');
          cancelEdit();
        },
        onError: () => {
          showToast('error', 'Failed to update. Please try again.');
        },
      }
    );
  };

  // Group records by date
  const grouped = records?.reduce((acc, r) => {
    const d = new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {}) || {};

  return (
    <div className="p-6 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
            ${toast.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}
        >
          {toast.type === 'success' ? <Check size={15} /> : <X size={15} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Attendance History</h1>
        <p className="text-sm text-gray-400 mt-0.5">Full log of all your classes · click ✏️ to correct a record</p>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-brand-500" />
          <span className="text-sm font-medium text-white">Filter</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="label">Subject</label>
            <select className="input text-sm" value={filters.subjectId}
              onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}>
              <option value="">All subjects</option>
              {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" className="input text-sm" value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input text-sm" value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={apply} className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5">
            <Search size={13} /> Apply filters
          </button>
          {Object.keys(applied).length > 0 && (
            <button onClick={clear} className="btn-ghost text-sm px-3 py-1.5">Clear</button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {records?.length > 0 && (
        <div className="flex gap-3 mb-4 text-xs flex-wrap">
          {['PRESENT','ABSENT','LATE','EXCUSED'].map((s) => {
            const count = records.filter((r) => r.status === s).length;
            if (!count) return null;
            const cfg = STATUS_CONFIG[s];
            return (
              <span key={s} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} border-current/20`}>
                {count} {cfg.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Records */}
      {isLoading && <PageLoader message="Loading history..." />}

      {!isLoading && !records?.length && (
        <EmptyState icon="📋" title="No records found" message="Try adjusting your filters, or start logging attendance today." />
      )}

      {!isLoading && Object.entries(grouped).map(([date, dayRecords]) => (
        <div key={date} className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{date}</p>
          <div className="card p-0 overflow-hidden">
            {dayRecords.map((record, i) => {
              const cfg = STATUS_CONFIG[record.status];
              const Icon = cfg.icon;
              const isEditing = editingId === record.id;
              const isSaving  = updateAttendance.isPending && editingId === record.id;

              return (
                <div
                  key={record.id}
                  className={`flex items-center justify-between px-4 py-3 transition-colors
                    ${isEditing ? 'bg-white/5' : ''}
                    ${i !== dayRecords.length - 1 ? 'border-b border-surface-border' : ''}`}
                >
                  {/* Left — subject info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: record.subject.color }} />
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{record.subject.name}</p>
                      <p className="text-xs text-gray-500">
                        P{record.slot?.periodNumber} · {record.slot?.startTime}
                      </p>
                    </div>
                  </div>

                  {/* Right — status badge OR edit UI */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {isEditing ? (
                      <>
                        {/* Status dropdown */}
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

                        {/* Confirm */}
                        <button
                          onClick={() => confirmEdit(record.id)}
                          disabled={isSaving || editStatus === record.status}
                          title="Save"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/20 text-green-400
                            hover:bg-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check size={13} />
                          )}
                        </button>

                        {/* Cancel */}
                        <button
                          onClick={cancelEdit}
                          disabled={isSaving}
                          title="Cancel"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-gray-400
                            hover:bg-white/10 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Current status badge */}
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>

                        {/* Edit button */}
                        <button
                          onClick={() => startEdit(record)}
                          title="Edit attendance"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500
                            hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
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
  );
}
