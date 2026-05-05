import { useState } from 'react';
import { Plus, Trash2, BookOpen, Calendar, Clock, Pencil, X, Check, History } from 'lucide-react';
import {
  useSubjects, useCreateSubject, useDeleteSubject, useUpdateSubject,
  useAddSlot, useDeleteSlot, useUpdateSlot, useTimetable,
  useAddCalendarEntry, useDeleteCalendarEntry, useUpdateCalendarEntry, useCalendar,
} from '../api/hooks';

const DAYS = ['MON','TUE','WED','THU','FRI','SAT'];
const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
const CALENDAR_TYPES = ['SEMESTER_START','SEMESTER_END','HOLIDAY','EXAM'];

// ─── Subjects ────────────────────────────────────────────────────────────────
function SubjectsSection() {
  const { data: subjects } = useSubjects();
  const create = useCreateSubject();
  const del = useDeleteSubject();
  const update = useUpdateSubject();

  const [form, setForm] = useState({ name: '', color: COLORS[0], isMustAttend: false });
  // Which subject's prior-attendance panel is open: { id, total, attended }
  const [historyEdit, setHistoryEdit] = useState(null);

  const add = async () => {
    if (!form.name.trim()) return;
    await create.mutateAsync(form);
    setForm({ name: '', color: COLORS[0], isMustAttend: false });
  };

  const openHistory = (s) => setHistoryEdit({
    id: s.id,
    name: s.name,
    total: s.initialTotal ?? 0,
    attended: s.initialAttended ?? 0,
  });

  const saveHistory = async () => {
    if (!historyEdit) return;
    const total = Math.max(0, historyEdit.total);
    const attended = Math.min(total, Math.max(0, historyEdit.attended));
    await update.mutateAsync({ id: historyEdit.id, initialTotal: total, initialAttended: attended });
    setHistoryEdit(null);
  };

  return (
    <div className="card mb-4">
      <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <BookOpen size={15} className="text-brand-500" /> Subjects
      </h2>

      <div className="space-y-2 mb-4">
        {subjects?.map((s) => (
          <div key={s.id}>
            <div className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-sm text-white truncate">{s.name}</span>
                {s.isMustAttend && <span className="text-xs text-purple-400 shrink-0">100% goal</span>}
                {s.minThreshold && <span className="text-xs text-gray-500 shrink-0">≥{s.minThreshold}%</span>}
                {(s.initialTotal > 0) && (
                  <span className="text-xs text-amber-400 shrink-0">
                    {s.initialAttended}/{s.initialTotal} prior
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => historyEdit?.id === s.id ? setHistoryEdit(null) : openHistory(s)}
                  className={`p-1 transition-colors ${historyEdit?.id === s.id ? 'text-amber-400' : 'text-gray-600 hover:text-amber-400'}`}
                  title="Set prior attendance (before using app)"
                >
                  <History size={13} />
                </button>
                <button onClick={() => del.mutate(s.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Prior attendance inline editor */}
            {historyEdit?.id === s.id && (
              <div className="mx-0 mb-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1.5">
                  <History size={11} /> Prior Attendance — before you started using BunkSmart
                </p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Total classes held</label>
                    <input
                      type="number" min="0" className="input text-sm w-full"
                      value={historyEdit.total}
                      onChange={(e) => setHistoryEdit({ ...historyEdit, total: Number(e.target.value) })}
                      placeholder="e.g. 40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Classes you attended</label>
                    <input
                      type="number" min="0" max={historyEdit.total} className="input text-sm w-full"
                      value={historyEdit.attended}
                      onChange={(e) => setHistoryEdit({ ...historyEdit, attended: Number(e.target.value) })}
                      placeholder="e.g. 32"
                    />
                  </div>
                </div>
                {historyEdit.total > 0 && (
                  <p className="text-xs text-gray-500 mb-2">
                    Prior: {Math.round((historyEdit.attended / historyEdit.total) * 100)}% attendance
                    ({historyEdit.total - historyEdit.attended} absent)
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={saveHistory} disabled={update.isPending} className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1">
                    <Check size={11} /> Save
                  </button>
                  <button onClick={() => setHistoryEdit(null)} className="text-xs px-2.5 py-1 rounded border border-surface-border text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    <X size={11} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!subjects?.length && <p className="text-sm text-gray-500">No subjects yet.</p>}
      </div>

      <div className="border-t border-surface-border pt-4 space-y-3">
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" placeholder="Subject name (e.g. Physics)"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && add()} />
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })}
                className={`w-5 h-5 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.isMustAttend}
              onChange={(e) => setForm({ ...form, isMustAttend: e.target.checked })} />
            Must-attend (100% goal)
          </label>
          <button onClick={add} disabled={create.isPending} className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5">
            <Plus size={13} /> Add subject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Timetable ────────────────────────────────────────────────────────────────
const EMPTY_SLOT = { subjectId: '', dayOfWeek: 'MON', periodNumber: 1, startTime: '09:00', endTime: '10:00' };

function TimetableSection() {
  const { data: subjects } = useSubjects();
  const { data: timetable } = useTimetable();
  const addSlot = useAddSlot();
  const delSlot = useDeleteSlot();
  const updSlot = useUpdateSlot();

  const [form, setForm] = useState(EMPTY_SLOT);
  const [editingId, setEditingId] = useState(null);

  const startEdit = (slot) => {
    setEditingId(slot.id);
    setForm({
      subjectId: slot.subjectId,
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_SLOT); };

  const save = async () => {
    if (!form.subjectId) return;
    if (editingId) {
      await updSlot.mutateAsync({ id: editingId, ...form });
    } else {
      await addSlot.mutateAsync(form);
    }
    cancelEdit();
  };

  const isPending = addSlot.isPending || updSlot.isPending;

  return (
    <div className="card mb-4">
      <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <Clock size={15} className="text-brand-500" /> Weekly Timetable
      </h2>

      {DAYS.map((day) => {
        const slots = timetable?.byDay?.[day] || [];
        if (!slots.length) return null;
        return (
          <div key={day} className="mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{day}</p>
            <div className="space-y-1">
              {slots.map((slot) => (
                <div key={slot.id} className={`flex items-center gap-2 text-sm py-1 px-2 rounded-md transition-colors ${editingId === slot.id ? 'bg-brand-500/10 ring-1 ring-brand-500/30' : 'hover:bg-white/5'}`}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slot.subject.color }} />
                  <span className="text-white flex-1">{slot.subject.name}</span>
                  <span className="text-gray-500 text-xs">P{slot.periodNumber} · {slot.startTime}–{slot.endTime}</span>
                  <button onClick={() => startEdit(slot)} className="text-gray-600 hover:text-brand-400 transition-colors p-0.5 ml-1" title="Edit">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => delSlot.mutate(slot.id)} className="text-gray-600 hover:text-red-400 transition-colors p-0.5" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="border-t border-surface-border pt-4 space-y-3">
        {editingId && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-brand-400 font-medium">✏️ Editing slot</span>
            <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
              <X size={12} /> Cancel
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Subject</label>
            <select className="input text-sm" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">Select subject</option>
              {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Day</label>
            <select className="input text-sm" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Period number</label>
            <input type="number" className="input text-sm" min="1" max="10" value={form.periodNumber}
              onChange={(e) => setForm({ ...form, periodNumber: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Start time</label>
            <input type="time" className="input text-sm" value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <div>
            <label className="label">End time</label>
            <input type="time" className="input text-sm" value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={isPending || !form.subjectId} className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5">
            {editingId ? <><Check size={13} /> Update slot</> : <><Plus size={13} /> Add slot</>}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="text-sm px-3 py-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
          )}
        </div>
        {(addSlot.isError || updSlot.isError) && (
          <p className="text-xs text-red-400">
            Failed: {(addSlot.error || updSlot.error)?.response?.data?.error}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
const EMPTY_CAL = { date: '', type: 'HOLIDAY', label: '' };

function CalendarSection() {
  const { data: entries } = useCalendar();
  const addEntry = useAddCalendarEntry();
  const delEntry = useDeleteCalendarEntry();
  const updEntry = useUpdateCalendarEntry();

  const [form, setForm] = useState(EMPTY_CAL);
  const [editingId, setEditingId] = useState(null);

  const typeColors = { HOLIDAY:'text-green-400', EXAM:'text-yellow-400', SEMESTER_START:'text-blue-400', SEMESTER_END:'text-red-400' };

  const startEdit = (e) => {
    setEditingId(e.id);
    setForm({
      date: new Date(e.date).toISOString().split('T')[0],
      type: e.type,
      label: e.label,
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_CAL); };

  const save = async () => {
    if (!form.date || !form.label) return;
    if (editingId) {
      await updEntry.mutateAsync({ id: editingId, ...form });
    } else {
      await addEntry.mutateAsync(form);
    }
    cancelEdit();
  };

  const isPending = addEntry.isPending || updEntry.isPending;

  return (
    <div className="card">
      <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <Calendar size={15} className="text-brand-500" /> Academic Calendar
      </h2>

      <div className="space-y-1 mb-4 max-h-64 overflow-y-auto pr-1">
        {entries?.map((e) => (
          <div key={e.id} className={`flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0 text-sm transition-colors ${editingId === e.id ? 'bg-brand-500/10' : ''}`}>
            <span className="text-gray-400 w-24 shrink-0">{new Date(e.date).toLocaleDateString('en-IN')}</span>
            <span className={`${typeColors[e.type] || 'text-gray-400'} w-32 shrink-0 text-xs`}>{e.type.replace(/_/g, ' ')}</span>
            <span className="text-white flex-1 truncate">{e.label}</span>
            <button onClick={() => startEdit(e)} className="text-gray-600 hover:text-brand-400 transition-colors p-0.5 shrink-0" title="Edit">
              <Pencil size={12} />
            </button>
            <button onClick={() => delEntry.mutate(e.id)} className="text-gray-600 hover:text-red-400 transition-colors p-0.5 shrink-0" title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {!entries?.length && <p className="text-sm text-gray-500">No calendar entries yet.</p>}
      </div>

      <div className="border-t border-surface-border pt-4 space-y-3">
        {editingId && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-brand-400 font-medium">✏️ Editing entry</span>
            <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
              <X size={12} /> Cancel
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input text-sm" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input text-sm" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {CALENDAR_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Label</label>
            <input className="input text-sm" placeholder="e.g. Diwali, Internal Exam 1, ..."
              value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={isPending} className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5">
            {editingId ? <><Check size={13} /> Update entry</> : <><Plus size={13} /> Add entry</>}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="text-sm px-3 py-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Setup() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Setup</h1>
        <p className="text-sm text-gray-400 mt-0.5">Add your subjects, weekly timetable, and academic calendar</p>
      </div>

      <SubjectsSection />
      <TimetableSection />
      <CalendarSection />
    </div>
  );
}
