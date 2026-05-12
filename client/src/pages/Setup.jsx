import { useState } from 'react';
import { Plus, Trash2, BookOpen, Clock, Pencil, X, Check, History, Target, UploadCloud, Loader2 } from 'lucide-react';
import {
  useSubjects, useCreateSubject, useDeleteSubject, useUpdateSubject,
  useAddSlot, useDeleteSlot, useUpdateSlot, useTimetable,
  useCalendar, useAddCalendarEntry, useDeleteCalendarEntry, useUpdateCalendarEntry,
  useExtractFromImage
} from '../api/hooks';
import useAuthStore from '../store/authStore';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const CALENDAR_TYPES = ['SEMESTER_START', 'SEMESTER_END', 'HOLIDAY', 'EXAM'];

// ─── Subjects Grid ──────────────────────────────────────────────────────────
function SubjectsGrid() {
  const { data: subjects } = useSubjects();
  const create = useCreateSubject();
  const del = useDeleteSubject();
  const update = useUpdateSubject();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({ name: '', color: COLORS[0], isMustAttend: false, minThreshold: '' });
  const [historyEdit, setHistoryEdit] = useState(null);
  const [thresholdEdit, setThresholdEdit] = useState(null);
  const [nameEdit, setNameEdit] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const saveName = async () => {
    if (!nameEdit || !nameEdit.name.trim()) return;
    await update.mutateAsync({ id: nameEdit.id, name: nameEdit.name });
    setNameEdit(null);
  };

  const add = async () => {
    if (!form.name.trim()) return;
    const payload = { ...form };
    if (payload.minThreshold === '' || payload.minThreshold === null) {
      delete payload.minThreshold;
    } else {
      payload.minThreshold = Number(payload.minThreshold);
    }
    await create.mutateAsync(payload);
    setForm({ name: '', color: COLORS[0], isMustAttend: false, minThreshold: '' });
  };

  const openHistory = (s) => setHistoryEdit({
    id: s.id, name: s.name, total: s.initialTotal ?? 0, attended: s.initialAttended ?? 0,
  });
  const saveHistory = async () => {
    if (!historyEdit) return;
    const total = Math.max(0, historyEdit.total);
    const attended = Math.min(total, Math.max(0, historyEdit.attended));
    await update.mutateAsync({ id: historyEdit.id, initialTotal: total, initialAttended: attended });
    setHistoryEdit(null);
  };

  const openThreshold = (s) => {
    setHistoryEdit(null);
    setThresholdEdit({ id: s.id, name: s.name, value: s.minThreshold ?? '' });
  };
  const saveThreshold = async () => {
    if (!thresholdEdit) return;
    const val = thresholdEdit.value === '' ? null : Number(thresholdEdit.value);
    await update.mutateAsync({ id: thresholdEdit.id, minThreshold: val });
    setThresholdEdit(null);
  };

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <BookOpen size={20} className="text-brand-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Your Subjects</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage courses, prior attendance, and custom thresholds</p>
        </div>
      </div>

      {/* Add New Subject Form */}
      <div className="mb-6 rounded-2xl p-5" style={{ background: 'rgba(17,17,21,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <input className="input flex-1 text-[15px] py-2.5" placeholder="New subject name (e.g. Physics)"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && add()} />

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex gap-1.5 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors border border-white/5">
              <input type="checkbox" className="rounded border-white/20 bg-black/50 text-brand-500 focus:ring-brand-500/50" checked={form.isMustAttend}
                onChange={(e) => setForm({ ...form, isMustAttend: e.target.checked })} />
              100% goal
            </label>

            <button onClick={add} disabled={create.isPending || !form.name.trim()} className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 rounded-xl ml-auto">
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {subjects?.map((s) => (
          <div key={s.id} className="rounded-2xl p-5 flex flex-col group transition-all duration-300 hover:-translate-y-1"
            style={{ background: 'rgba(17,17,21,0.8)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>

            {nameEdit?.id === s.id ? (
              <div className="flex items-center gap-2 mb-4">
                <input autoFocus className="input flex-1 text-sm py-1.5 px-3 rounded-lg bg-black/40" value={nameEdit.name} onChange={(e) => setNameEdit({ ...nameEdit, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && saveName()} />
                <button onClick={saveName} className="p-1.5 bg-brand-500/20 text-brand-400 rounded-lg hover:bg-brand-500/30 transition-colors"><Check size={14} /></button>
                <button onClick={() => setNameEdit(null)} className="p-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"><X size={14} /></button>
              </div>
            ) : (
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0 pr-2 cursor-pointer group/name" onClick={() => setNameEdit({ id: s.id, name: s.name })}>
                  <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-lg" style={{ backgroundColor: s.color, boxShadow: `0 0 12px ${s.color}80` }} />
                  <span className="text-lg font-bold text-white truncate group-hover/name:text-brand-300 transition-colors">{s.name}</span>
                  <Pencil size={12} className="opacity-0 group-hover/name:opacity-100 text-gray-400 transition-opacity" />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {s.isMustAttend && <span className="text-xs font-bold text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-1 rounded-md">Must Attend</span>}
              {s.minThreshold && <span className="text-xs font-bold text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded-md">≥{s.minThreshold}% required</span>}
              {(s.initialTotal > 0) && <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-md">Prior: {s.initialAttended}/{s.initialTotal}</span>}
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
              <button onClick={() => thresholdEdit?.id === s.id ? setThresholdEdit(null) : openThreshold(s)}
                className={`flex-1 text-xs font-medium py-2 rounded-xl transition-colors border flex items-center justify-center gap-1.5 ${thresholdEdit?.id === s.id ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                <Target size={14} /> Threshold
              </button>
              <button onClick={() => historyEdit?.id === s.id ? setHistoryEdit(null) : openHistory(s)}
                className={`flex-1 text-xs font-medium py-2 rounded-xl transition-colors border flex items-center justify-center gap-1.5 ${historyEdit?.id === s.id ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                <History size={14} /> Prior Data
              </button>
              {confirmDelete === s.id ? (
                <>
                  <button onClick={() => del.mutate(s.id, { onSettled: () => setConfirmDelete(null) })} disabled={del.isPending}
                    className="flex-1 text-xs font-bold py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1">
                    <Check size={13} /> Yes, Delete
                  </button>
                  <button onClick={() => setConfirmDelete(null)}
                    className="px-3 text-xs font-medium py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors">
                    <X size={13} />
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(s.id)}
                  className="px-3 text-xs font-medium py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center">
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Inline Editors */}
            {thresholdEdit?.id === s.id && (
              <div className="mt-3 p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl animate-[fadeIn_0.2s_ease-out]">
                <p className="text-xs text-brand-400 font-semibold mb-3">Custom Attendance Threshold</p>
                <div className="flex items-center gap-2 mb-3">
                  <input type="number" min="1" max="100" className="input text-sm w-full" value={thresholdEdit.value}
                    onChange={(e) => setThresholdEdit({ ...thresholdEdit, value: e.target.value })}
                    placeholder={`Global default: ${user?.minThreshold ?? 75}%`} />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveThreshold} disabled={update.isPending} className="btn-primary text-xs flex-1 py-2 rounded-lg">Save</button>
                  <button onClick={() => setThresholdEdit(null)} className="btn-ghost text-xs flex-1 py-2 rounded-lg bg-white/5">Cancel</button>
                </div>
              </div>
            )}

            {historyEdit?.id === s.id && (
              <div className="mt-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-[fadeIn_0.2s_ease-out]">
                <p className="text-xs text-amber-400 font-semibold mb-3">Prior Attendance Offset</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Total Held</label>
                    <input type="number" min="0" className="input text-sm w-full" value={historyEdit.total} onChange={(e) => setHistoryEdit({ ...historyEdit, total: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Attended</label>
                    <input type="number" min="0" max={historyEdit.total} className="input text-sm w-full" value={historyEdit.attended} onChange={(e) => setHistoryEdit({ ...historyEdit, attended: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveHistory} disabled={update.isPending} className="btn-primary text-xs flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black border-none">Save</button>
                  <button onClick={() => setHistoryEdit(null)} className="btn-ghost text-xs flex-1 py-2 rounded-lg bg-white/5">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!subjects?.length && (
          <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
            <BookOpen size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">You haven't added any subjects yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Review Modals ────────────────────────────────────────────────────────────

function ReviewTimetableModal({ data, onConfirm, onCancel, subjects }) {
  const [items, setItems] = useState(data.map((d, i) => ({ ...d, id: i })));

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111115] border border-white/10 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Review Extracted Timetable</h2>
          <button onClick={onCancel} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 space-y-3 pr-2 scrollbar-thin">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="col-span-1 md:col-span-3">
                <input
                  type="text"
                  className="input w-full text-sm py-2 rounded-xl bg-black/40 text-white"
                  value={item.subjectName || ''}
                  onChange={(e) => updateItem(item.id, 'subjectName', e.target.value)}
                  placeholder="Subject Name"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <select className="input w-full text-sm py-2 rounded-xl bg-black/40 text-white" value={item.dayOfWeek || 'MON'} onChange={(e) => updateItem(item.id, 'dayOfWeek', e.target.value)}>
                  {DAYS.map(d => <option key={d} value={d} className="bg-[#111115] text-white">{d}</option>)}
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <input type="number" min="1" max="15" className="input w-full text-sm py-2 rounded-xl bg-black/40" value={item.periodNumber || 1} onChange={(e) => updateItem(item.id, 'periodNumber', Number(e.target.value))} placeholder="Period" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <input type="time" className="input w-full text-sm py-2 rounded-xl bg-black/40" value={item.startTime || ''} onChange={(e) => updateItem(item.id, 'startTime', e.target.value)} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <input type="time" className="input w-full text-sm py-2 rounded-xl bg-black/40" value={item.endTime || ''} onChange={(e) => updateItem(item.id, 'endTime', e.target.value)} />
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => removeItem(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-400 text-center py-8">No items left to import.</p>}
        </div>
        <div className="mt-6 pt-6 border-t border-white/5 flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 py-3.5 rounded-xl">Cancel</button>
          <button onClick={() => onConfirm(items)} className="btn-primary flex-1 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white border-none" disabled={items.length === 0 || items.some(i => !i.subjectName?.trim())}>
            Confirm & Import
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewCalendarModal({ data, onConfirm, onCancel }) {
  const [items, setItems] = useState(data.map((d, i) => ({ ...d, id: i })));

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111115] border border-white/10 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Review Extracted Calendar</h2>
          <button onClick={onCancel} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 space-y-3 pr-2 scrollbar-thin">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="col-span-1 md:col-span-3">
                <input type="date" className="input w-full text-sm py-2 rounded-xl bg-black/40" value={item.date || ''} onChange={(e) => updateItem(item.id, 'date', e.target.value)} />
              </div>
              <div className="col-span-1 md:col-span-5">
                <input type="text" className="input w-full text-sm py-2 rounded-xl bg-black/40" value={item.label || ''} onChange={(e) => updateItem(item.id, 'label', e.target.value)} placeholder="Event Name" />
              </div>
              <div className="col-span-1 md:col-span-3">
                <select className="input w-full text-sm py-2 rounded-xl bg-black/40 text-white" value={item.type || 'HOLIDAY'} onChange={(e) => updateItem(item.id, 'type', e.target.value)}>
                  {CALENDAR_TYPES.map(t => <option key={t} value={t} className="bg-[#111115] text-white">{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => removeItem(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-400 text-center py-8">No items left to import.</p>}
        </div>
        <div className="mt-6 pt-6 border-t border-white/5 flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 py-3.5 rounded-xl">Cancel</button>
          <button onClick={() => onConfirm(items)} className="btn-primary flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border-none" disabled={items.length === 0 || items.some(i => !i.date || !i.label)}>
            Confirm & Import
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Timetable Tabs ───────────────────────────────────────────────────────────
const EMPTY_SLOT = { subjectId: '', periodNumber: 1, startTime: '09:00', endTime: '10:00' };

function TimetableSection() {
  const { data: subjects } = useSubjects();
  const { data: timetable } = useTimetable();
  const addSlot = useAddSlot();
  const delSlot = useDeleteSlot();
  const updSlot = useUpdateSlot();
  const createSubject = useCreateSubject();

  const [activeDay, setActiveDay] = useState('MON');
  const [form, setForm] = useState(EMPTY_SLOT);
  const [editingId, setEditingId] = useState(null);

  const startEdit = (slot) => {
    setEditingId(slot.id);
    setForm({ subjectId: slot.subjectId, periodNumber: slot.periodNumber, startTime: slot.startTime, endTime: slot.endTime });
  };
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_SLOT); };

  const save = async () => {
    if (!form.subjectId) return;
    const payload = { ...form, dayOfWeek: activeDay };
    if (editingId) await updSlot.mutateAsync({ id: editingId, ...payload });
    else await addSlot.mutateAsync(payload);
    cancelEdit();
  };

  const slotsForDay = timetable?.byDay?.[activeDay] || [];
  const isPending = addSlot.isPending || updSlot.isPending;

  const extractMutation = useExtractFromImage();
  const [reviewData, setReviewData] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'TIMETABLE');
    try {
      const data = await extractMutation.mutateAsync(formData);
      setReviewData(data);
    } catch (err) {
      console.error(err);
      alert('Failed to extract timetable from image.');
    }
    e.target.value = '';
  };

  const handleConfirmReview = async (items) => {
    const uniqueNames = [...new Set(items.map(i => i.subjectName?.trim()).filter(Boolean))];
    const existingMap = new Map(subjects?.map(s => [s.name.toLowerCase(), s.id]) || []);
    const nameToId = new Map();

    for (const name of uniqueNames) {
      if (existingMap.has(name.toLowerCase())) {
        nameToId.set(name, existingMap.get(name.toLowerCase()));
      } else {
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const newSubj = await createSubject.mutateAsync({ name, color: randomColor, isMustAttend: false });
        nameToId.set(name, newSubj.id);
        existingMap.set(name.toLowerCase(), newSubj.id);
      }
    }

    for (const item of items) {
      const sName = item.subjectName?.trim();
      if (sName && nameToId.has(sName)) {
        await addSlot.mutateAsync({
          subjectId: nameToId.get(sName),
          dayOfWeek: item.dayOfWeek || 'MON',
          periodNumber: item.periodNumber || 1,
          startTime: item.startTime || '09:00',
          endTime: item.endTime || '10:00'
        });
      }
    }
    setReviewData(null);
  };

  return (
    <div className="relative">
      {reviewData && (
        <ReviewTimetableModal data={reviewData} onConfirm={handleConfirmReview} onCancel={() => setReviewData(null)} subjects={subjects} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Clock size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Weekly Timetable</h2>
            <p className="text-sm text-gray-500 mt-0.5">Schedule your classes for automatic tracking</p>
          </div>
        </div>
        <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-xl cursor-pointer transition-colors border border-brand-500/20 font-semibold text-sm w-full sm:w-auto">
          {extractMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          {extractMutation.isPending ? 'Analyzing...' : 'AI Import'}
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} disabled={extractMutation.isPending} />
        </label>
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(17,17,21,0.95)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>

        {/* Day Tabs */}
        <div className="flex border-b border-white/5">
          {DAYS.map((day) => (
            <button key={day} onClick={() => { setActiveDay(day); cancelEdit(); }}
              className="flex-1 py-4 text-sm font-bold transition-all relative"
              style={{ color: activeDay === day ? '#818cf8' : '#6b7280', background: activeDay === day ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
              {day}
              {activeDay === day && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]" />}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 xl:grid-cols-5 gap-8">

          {/* Slots List */}
          <div className="xl:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-white mb-4">Classes on {activeDay}</h3>
            {slotsForDay.map((slot) => (
              <div key={slot.id} className="group flex items-center gap-4 p-4 rounded-2xl transition-all"
                style={{ background: editingId === slot.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: editingId === slot.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center bg-black/40 border border-white/5 shrink-0">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Per</span>
                  <span className="text-lg font-bold text-white leading-none">{slot.periodNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: slot.subject.color, boxShadow: `0 0 8px ${slot.subject.color}80` }} />
                    <span className="text-base font-bold text-white truncate">{slot.subject.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <Clock size={11} /> {slot.startTime} – {slot.endTime}
                  </span>
                </div>
                <div className="flex gap-1.5 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(slot)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-brand-500/20 text-gray-400 hover:text-brand-400 flex items-center justify-center transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => delSlot.mutate(slot.id)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {!slotsForDay.length && (
              <div className="py-10 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                <p className="text-gray-400 text-sm font-medium">No classes scheduled for {activeDay}.</p>
                <p className="text-gray-500 text-xs mt-1">Use the form to add your first slot.</p>
              </div>
            )}
          </div>

          {/* Editor Form */}
          <div className="xl:col-span-2">
            <div className="p-6 rounded-3xl bg-black/40 border border-white/5 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white">{editingId ? `Edit Slot on ${activeDay}` : `Add Slot to ${activeDay}`}</h3>
                {editingId && <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg"><X size={12} /> Cancel</button>}
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Subject</label>
                  <select className="input w-full text-[15px] py-3 rounded-xl bg-[#111115] text-white border border-white/10" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                    <option value="" disabled className="bg-[#111115] text-gray-400">Select a subject...</option>
                    {subjects?.map((s) => <option key={s.id} value={s.id} className="bg-[#111115] text-white">{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Period Number</label>
                  <input type="number" className="input w-full text-[15px] py-3 rounded-xl bg-white/5" min="1" max="15" value={form.periodNumber}
                    onChange={(e) => setForm({ ...form, periodNumber: Number(e.target.value) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Start</label>
                    <input type="time" className="input w-full text-sm py-3 rounded-xl bg-white/5" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">End</label>
                    <input type="time" className="input w-full text-sm py-3 rounded-xl bg-white/5" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5">
                <button onClick={save} disabled={isPending || !form.subjectId} className="btn-primary w-full py-3.5 text-[15px] rounded-xl flex items-center justify-center gap-2">
                  {editingId ? <><Check size={16} /> Save Changes</> : <><Plus size={16} /> Add to Timetable</>}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Academic Calendar List ──────────────────────────────────────────────────
const EMPTY_CAL = { date: '', type: 'HOLIDAY', label: '' };

function CalendarSection() {
  const { data: entries } = useCalendar();
  const addEntry = useAddCalendarEntry();
  const delEntry = useDeleteCalendarEntry();
  const updEntry = useUpdateCalendarEntry();

  const [form, setForm] = useState(EMPTY_CAL);
  const [editingId, setEditingId] = useState(null);

  const typeStyles = {
    HOLIDAY: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
    EXAM: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
    SEMESTER_START: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    SEMESTER_END: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' }
  };

  const startEdit = (e) => {
    setEditingId(e.id);
    setForm({ date: new Date(e.date).toISOString().split('T')[0], type: e.type, label: e.label });
  };
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_CAL); };

  const save = async () => {
    if (!form.date || !form.label) return;
    if (editingId) await updEntry.mutateAsync({ id: editingId, ...form });
    else await addEntry.mutateAsync(form);
    cancelEdit();
  };

  const isPending = addEntry.isPending || updEntry.isPending;

  const extractMutation = useExtractFromImage();
  const [reviewData, setReviewData] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'CALENDAR');
    try {
      const data = await extractMutation.mutateAsync(formData);
      setReviewData(data);
    } catch (err) {
      console.error(err);
      alert('Failed to extract calendar from image.');
    }
    e.target.value = '';
  };

  const handleConfirmReview = async (items) => {
    for (const item of items) {
      if (item.date && item.label) {
        await addEntry.mutateAsync({
          date: item.date,
          type: item.type || 'HOLIDAY',
          label: item.label
        });
      }
    }
    setReviewData(null);
  };

  return (
    <div className="mt-10 relative">
      {reviewData && (
        <ReviewCalendarModal data={reviewData} onConfirm={handleConfirmReview} onCancel={() => setReviewData(null)} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <BookOpen size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Academic Calendar</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage holidays, exams, and important dates</p>
          </div>
        </div>
        <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl cursor-pointer transition-colors border border-blue-500/20 font-semibold text-sm w-full sm:w-auto">
          {extractMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          {extractMutation.isPending ? 'Analyzing...' : 'AI Import'}
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} disabled={extractMutation.isPending} />
        </label>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Editor Form */}
        <div className="xl:col-span-1">
          <div className="p-6 rounded-3xl bg-black/40 border border-white/5 flex flex-col h-auto xl:h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white">{editingId ? 'Edit Event' : 'Add New Event'}</h3>
              {editingId && <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg"><X size={12} /> Cancel</button>}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Date</label>
                <input type="date" className="input w-full text-[15px] py-3 rounded-xl bg-white/5" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Event Type</label>
                <select className="input w-full text-[15px] py-3 rounded-xl bg-[#111115] text-white border border-white/10" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {CALENDAR_TYPES.map((t) => <option key={t} value={t} className="bg-[#111115] text-white">{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Label / Name</label>
                <input className="input w-full text-[15px] py-3 rounded-xl bg-white/5" placeholder="e.g. Diwali, Semester End..." value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </div>
            </div>

            <div className="pt-6 mt-auto border-t border-white/5">
              <button onClick={save} disabled={isPending || !form.date || !form.label.trim()} className="btn-primary w-full py-3.5 text-[15px] rounded-xl flex items-center justify-center gap-2">
                {editingId ? <><Check size={16} /> Save Changes</> : <><Plus size={16} /> Add Event</>}
              </button>
            </div>
          </div>
        </div>

        {/* List of Events */}
        <div className="xl:col-span-2">
          <div className="rounded-3xl p-6 flex flex-col h-auto xl:h-[500px]" style={{ background: 'rgba(17,17,21,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin flex-1">
              {entries?.slice().sort((a, b) => new Date(a.date) - new Date(b.date)).map((e) => {
                const style = typeStyles[e.type] || typeStyles.HOLIDAY;
                return (
                  <div key={e.id} className="group flex items-center gap-4 p-4 rounded-2xl transition-all"
                    style={{ background: editingId === e.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', border: editingId === e.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>

                    <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center bg-black/40 border border-white/5 shrink-0">
                      <span className="text-xs text-gray-500 font-bold uppercase">{new Date(e.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg font-bold text-white leading-none">{new Date(e.date).getDate()}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-white truncate mb-1.5">{e.label}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.color} ${style.bg} ${style.border}`}>
                        {e.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex gap-1.5 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(e)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-brand-500/20 text-gray-400 hover:text-brand-400 flex items-center justify-center transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => delEntry.mutate(e.id)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {!entries?.length && (
                <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                  <p className="text-gray-400 text-sm font-medium">No calendar events added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Setup() {
  return (
    <div className="p-4 md:p-6 lg:p-8 animate-[fadeIn_0.3s_ease-out] max-w-[1400px] mx-auto min-h-full">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Setup</h1>
        <p className="text-[15px] text-gray-400 mt-1.5">Configure your academic parameters.</p>
      </div>

      <SubjectsGrid />
      <TimetableSection />
      <CalendarSection />
    </div>
  );
}
