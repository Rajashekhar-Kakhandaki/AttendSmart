import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, CalendarDays } from 'lucide-react';
import { useCalendar, useAddCalendarEntry, useDeleteCalendarEntry } from '../api/hooks';
import { PageLoader } from '../components/UI';

// ── Config ────────────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { value: 'HOLIDAY',        label: 'Holiday',        color: '#f59e0b', bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   text: 'text-amber-400',  dot: '#f59e0b' },
  { value: 'EXAM',           label: 'Exam',           color: '#ef4444', bg: 'bg-red-500/15',     border: 'border-red-500/30',     text: 'text-red-400',    dot: '#ef4444' },
  { value: 'SEMESTER_START', label: 'Semester Start', color: '#22c55e', bg: 'bg-green-500/15',   border: 'border-green-500/30',   text: 'text-green-400',  dot: '#22c55e' },
  { value: 'SEMESTER_END',   label: 'Semester End',   color: '#8b5cf6', bg: 'bg-purple-500/15',  border: 'border-purple-500/30',  text: 'text-purple-400', dot: '#8b5cf6' },
  { value: 'ASSIGNMENT',     label: 'Assignment Due',  color: '#3b82f6', bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400',   dot: '#3b82f6' },
  { value: 'EVENT',          label: 'College Event',  color: '#ec4899', bg: 'bg-pink-500/15',    border: 'border-pink-500/30',    text: 'text-pink-400',   dot: '#ec4899' },
];

function getTypeConfig(type) {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[0];
}

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toLocalDateStr(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a, b) {
  return toLocalDateStr(a) === toLocalDateStr(b);
}

// ── Add Event Modal ───────────────────────────────────────────────────────────
function AddEventModal({ selectedDate, onClose, onSave, isLoading }) {
  const [type, setType]   = useState('HOLIDAY');
  const [label, setLabel] = useState('');
  const [date, setDate]   = useState(selectedDate || toLocalDateStr(new Date()));

  const handle = (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave({ date, type, label: label.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <p className="text-sm font-semibold text-white">Add Calendar Event</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handle} className="p-5 space-y-4">
          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="label">Event Type</label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    type === t.value
                      ? `${t.bg} ${t.border} ${t.text}`
                      : 'border-surface-border text-gray-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.dot }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="label">Label / Description</label>
            <input
              type="text"
              className="input"
              placeholder={
                type === 'HOLIDAY'        ? 'e.g. Diwali, Republic Day' :
                type === 'EXAM'           ? 'e.g. Internal Exam 1, End Sem' :
                type === 'SEMESTER_START' ? 'e.g. Semester 4 Start' :
                type === 'SEMESTER_END'   ? 'e.g. Semester 4 End' :
                type === 'ASSIGNMENT'     ? 'e.g. DSA Assignment 2' :
                                            'e.g. Annual Day, Sports Meet'
              }
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm py-2">
              Cancel
            </button>
            <button type="submit" disabled={isLoading || !label.trim()} className="btn-primary flex-1 text-sm py-2">
              {isLoading ? 'Saving…' : 'Add Event'}
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
  const [showModal, setShowModal]     = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: entries = [], isLoading } = useCalendar();
  const addEntry    = useAddCalendarEntry();
  const deleteEntry = useDeleteCalendarEntry();

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build calendar grid
  const firstDay    = new Date(year, month, 1).getDay();   // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  // Map entries for quick lookup: "YYYY-MM-DD" → [entry, ...]
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
    addEntry.mutate({ date, type, label }, {
      onSuccess: () => setShowModal(false),
    });
  };

  const handleDelete = (id) => {
    if (confirm('Remove this event?')) deleteEntry.mutate(id);
  };

  // Upcoming events (next 60 days)
  const upcoming = (entries || [])
    .filter((e) => new Date(e.date) >= new Date(today.setHours(0,0,0,0)))
    .slice(0, 8);

  if (isLoading) return <PageLoader message="Loading calendar…" />;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Academic Calendar</h1>
          <p className="text-sm text-gray-400 mt-0.5">Holidays, exams, semester dates & events</p>
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
          <span key={t.value} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${t.bg} ${t.border} ${t.text}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.dot }} />
            {t.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Month Grid ── */}
        <div className="lg:col-span-2 card p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-semibold text-white">
              {MONTHS[month]} {year}
            </p>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-gray-600 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;

              const key        = toLocalDateStr(date);
              const dayEntries = entryMap[key] || [];
              const isToday    = isSameDay(date, new Date());

              return (
                <button
                  key={key}
                  onClick={() => handleDayClick(date)}
                  title={dayEntries.map((e) => e.label).join(', ')}
                  className={`relative flex flex-col items-center p-1 rounded-lg min-h-[52px] transition-colors group
                    ${isToday ? 'bg-brand-500/20 ring-1 ring-brand-500/50' : 'hover:bg-white/5'}
                    ${dayEntries.length > 0 ? 'ring-1 ring-inset ring-white/10' : ''}
                  `}
                >
                  <span className={`text-xs mb-1 ${isToday ? 'text-brand-400 font-bold' : 'text-gray-400'}`}>
                    {date.getDate()}
                  </span>
                  {/* Event dots */}
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {dayEntries.slice(0, 3).map((e) => {
                      const cfg = getTypeConfig(e.type);
                      return (
                        <span
                          key={e.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: cfg.dot }}
                        />
                      );
                    })}
                  </div>
                  {/* Label on hover */}
                  {dayEntries.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 w-max max-w-[140px]">
                      <div className="bg-gray-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white shadow-xl">
                        {dayEntries.map((e) => {
                          const cfg = getTypeConfig(e.type);
                          return (
                            <div key={e.id} className={`${cfg.text}`}>{e.label}</div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right Panel: Upcoming & All Events ── */}
        <div className="space-y-4">
          {/* Upcoming */}
          <div className="card p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CalendarDays size={13} /> Upcoming Events
            </p>
            {upcoming.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((e) => {
                  const cfg = getTypeConfig(e.type);
                  const d   = new Date(e.date);
                  return (
                    <div key={e.id} className={`flex items-start gap-2 px-3 py-2 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${cfg.text}`}>{e.label}</p>
                        <p className="text-xs text-gray-500">
                          {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All events list */}
          <div className="card p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">All Events ({entries.length})</p>
            {entries.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">No events added yet.<br/>Click a date or "+ Add Event" to begin.</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {[...entries].reverse().map((e) => {
                  const cfg = getTypeConfig(e.type);
                  const d   = new Date(e.date);
                  return (
                    <div key={e.id} className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{e.label}</p>
                        <p className="text-xs text-gray-500">
                          {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' · '}
                          <span className={cfg.text}>{cfg.label}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
