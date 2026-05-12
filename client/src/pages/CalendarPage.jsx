import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, CalendarDays, Sparkles } from 'lucide-react';
import { useCalendar, useAddCalendarEntry, useDeleteCalendarEntry } from '../api/hooks';
import { PageLoader } from '../components/UI';

// ── Config ────────────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { value: 'HOLIDAY',        label: 'Holiday',        emoji: '🎉', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
  { value: 'EXAM',           label: 'Exam',           emoji: '📝', color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  text: '#ef4444' },
  { value: 'SEMESTER_START', label: 'Sem Start',      emoji: '🚀', color: '#22c55e', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)',  text: '#22c55e' },
  { value: 'SEMESTER_END',   label: 'Sem End',        emoji: '🏁', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)',border: 'rgba(139,92,246,0.25)', text: '#8b5cf6' },
  { value: 'ASSIGNMENT',     label: 'Assignment',     emoji: '📋', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',border: 'rgba(59,130,246,0.25)', text: '#3b82f6' },
  { value: 'EVENT',          label: 'College Event',  emoji: '🎊', color: '#ec4899', bg: 'rgba(236,72,153,0.10)',border: 'rgba(236,72,153,0.25)', text: '#ec4899' },
];

function getTypeConfig(type) {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[0];
}

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toLocalDateStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isSameDay(a, b) {
  return toLocalDateStr(a) === toLocalDateStr(b);
}

// ── Add Event Modal ───────────────────────────────────────────────────────────
function AddEventModal({ selectedDate, onClose, onSave, isLoading }) {
  const [type, setType]   = useState('HOLIDAY');
  const [label, setLabel] = useState('');
  const [date, setDate]   = useState(selectedDate || toLocalDateStr(new Date()));
  const cfg = getTypeConfig(type);

  const handle = (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave({ date, type, label: label.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm animate-[scaleIn_0.2s_ease-out]"
        style={{
          background: 'rgba(17,17,21,0.97)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <span className="text-sm">{cfg.emoji}</span>
            </div>
            <p className="text-sm font-semibold text-white">Add Calendar Event</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handle} className="p-5 space-y-4">
          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date}
              onChange={(e) => setDate(e.target.value)} required />
          </div>

          {/* Type */}
          <div>
            <label className="label">Event Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all"
                  style={{
                    background: type === t.value ? t.bg : 'rgba(255,255,255,0.02)',
                    borderColor: type === t.value ? t.border : 'rgba(255,255,255,0.07)',
                    color: type === t.value ? t.text : '#6b7280',
                    boxShadow: type === t.value ? `0 0 12px ${t.color}20` : 'none',
                  }}>
                  <span>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="label">Label / Description</label>
            <input type="text" className="input"
              placeholder={
                type === 'HOLIDAY' ? 'e.g. Diwali, Republic Day' :
                type === 'EXAM'    ? 'e.g. Internal Exam 1, End Sem' :
                type === 'ASSIGNMENT' ? 'e.g. DSA Assignment 2' :
                                    'e.g. Annual Day, Sports Meet'
              }
              value={label} onChange={(e) => setLabel(e.target.value)} required />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm py-2.5">Cancel</button>
            <button type="submit" disabled={isLoading || !label.trim()} className="btn-primary flex-1 text-sm py-2.5">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Calendar Page ────────────────────────────────────────────────────────
export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showModal, setShowModal]       = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: entries = [], isLoading } = useCalendar();
  const addEntry    = useAddCalendarEntry();
  const deleteEntry = useDeleteCalendarEntry();

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const entryMap = {};
  (entries || []).forEach((e) => {
    const key = toLocalDateStr(e.date);
    if (!entryMap[key]) entryMap[key] = [];
    entryMap[key].push(e);
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (date) => {
    setSelectedDate(toLocalDateStr(date));
    setShowModal(true);
  };

  const handleSave = ({ date, type, label }) => {
    addEntry.mutate({ date, type, label }, { onSuccess: () => setShowModal(false) });
  };

  const handleDelete = (id) => {
    if (confirm('Remove this event?')) deleteEntry.mutate(id);
  };

  const todayStr = toLocalDateStr(new Date());
  const upcoming = (entries || [])
    .filter((e) => toLocalDateStr(e.date) >= todayStr)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  if (isLoading) return <PageLoader message="Loading calendar…" />;

  return (
    <div className="p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Academic Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Holidays, exams, semester dates &amp; events</p>
        </div>
        <button
          onClick={() => { setSelectedDate(toLocalDateStr(new Date())); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={14} /> Add Event
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {EVENT_TYPES.map((t) => (
          <span key={t.value}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }}>
            <span>{t.emoji}</span>
            {t.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Month Grid ── */}
        <div className="xl:col-span-2 card">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all">
              <ChevronLeft size={16} />
            </button>
            <p className="font-display font-semibold text-white text-base">
              {MONTHS[month]} <span className="text-gray-500">{year}</span>
            </p>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className={`text-center text-[11px] font-semibold py-1 uppercase tracking-widest ${
                d === 'Sun' ? 'text-red-400/60' : 'text-gray-600'
              }`}>{d}</div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;

              const key        = toLocalDateStr(date);
              const dayEntries = entryMap[key] || [];
              const isToday    = isSameDay(date, new Date());
              const isSun      = date.getDay() === 0;
              const hasEntries = dayEntries.length > 0;

              return (
                <button
                  key={key}
                  onClick={() => handleDayClick(date)}
                  className="relative flex flex-col items-stretch p-2 rounded-2xl min-h-[120px] transition-all duration-200 group overflow-hidden"
                  style={{
                    background: isToday ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.015)',
                    border: isToday ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 
                      isSun ? 'text-red-400' : 'text-gray-300'
                    }`}>
                      {date.getDate()}
                    </span>
                    {hasEntries && dayEntries.length > 3 && (
                      <span className="text-[10px] font-bold text-gray-500 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                        +{dayEntries.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 overflow-hidden">
                    {dayEntries.slice(0, 3).map((e) => {
                      const cfg = getTypeConfig(e.type);
                      return (
                        <div key={e.id} className="text-[10px] font-semibold px-2 py-1 rounded-lg truncate text-left transition-transform group-hover:scale-[1.02]"
                          style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                          <span className="mr-1">{cfg.emoji}</span>
                          {e.label}
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Month summary pill */}
          {Object.keys(entryMap).filter((k) => {
            const d = new Date(k);
            return d.getMonth() === month && d.getFullYear() === year;
          }).length > 0 && (
            <div className="mt-4 pt-4 flex items-center gap-2 flex-wrap"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[11px] text-gray-600 uppercase tracking-widest font-medium">This month:</span>
              {EVENT_TYPES.map((t) => {
                const count = Object.entries(entryMap)
                  .filter(([k]) => {
                    const d = new Date(k);
                    return d.getMonth() === month && d.getFullYear() === year;
                  })
                  .flatMap(([, evs]) => evs)
                  .filter((ev) => ev.type === t.value).length;
                if (!count) return null;
                return (
                  <span key={t.value} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }}>
                    {t.emoji} {count} {t.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div className="space-y-4">

          {/* Upcoming */}
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-3 flex items-center gap-2">
              <CalendarDays size={13} className="text-brand-400" /> Upcoming Events
            </p>
            {upcoming.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-xs text-gray-600">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((e) => {
                  const cfg = getTypeConfig(e.type);
                  const d   = new Date(e.date);
                  const daysAway = Math.ceil((d - new Date(todayStr)) / 86400000);
                  return (
                    <div key={e.id}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <span className="text-base mt-0.5 shrink-0">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: cfg.text }}>{e.label}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[10px] text-gray-500">
                            {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: cfg.border, color: cfg.text }}>
                            {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `in ${daysAway}d`}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(e.id)}
                        className="text-gray-700 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All events */}
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-3">
              All Events <span className="text-brand-400 font-bold ml-1">({entries.length})</span>
            </p>
            {entries.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-2xl mb-1.5">✨</p>
                <p className="text-xs text-gray-600">Click a date or "+ Add Event" to begin</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {[...entries].reverse().map((e) => {
                  const cfg = getTypeConfig(e.type);
                  const d   = new Date(e.date);
                  return (
                    <div key={e.id}
                      className="flex items-center gap-2.5 py-2 px-2 rounded-xl transition-all hover:bg-white/3 group">
                      <span className="text-sm shrink-0">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate font-medium">{e.label}</p>
                        <p className="text-[10px] text-gray-600">
                          {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <button onClick={() => handleDelete(e.id)}
                        className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick add hint */}
          <div className="card p-3 text-center"
            style={{ borderColor: 'rgba(99,102,241,0.15)', background: 'rgba(99,102,241,0.04)' }}>
            <Sparkles size={14} className="text-brand-400 mx-auto mb-1.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              Tap any date on the calendar to quickly add an event for that day
            </p>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <AddEventModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          isLoading={addEntry.isPending}
        />
      )}
    </div>
  );
}
