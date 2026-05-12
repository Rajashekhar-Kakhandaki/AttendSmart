import { useState, useRef, useEffect } from 'react';
import { Brain, Sparkles, Send, Smile, TrendingUp, AlertTriangle, CheckCircle2, FlaskConical, RotateCcw, MessageCircle, X } from 'lucide-react';
import { useSafeBunks, useAISuggestion, useLogMood, useChat } from '../api/hooks';
import api from '../api/client';

const MOODS = [
  { value: 'HAPPY',    emoji: '😄', label: 'Happy',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.30)'  },
  { value: 'CHILL',    emoji: '😌', label: 'Chill',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.30)' },
  { value: 'TIRED',    emoji: '😴', label: 'Tired',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)' },
  { value: 'STRESSED', emoji: '😰', label: 'Stressed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.30)'  },
];

/* ─── Mood & AI ──────────────────────────────────────────────────────── */
function MoodAndAI() {
  const [selected, setSelected] = useState(null);
  const logMood = useLogMood();
  const { mutate, data, isPending, isError } = useAISuggestion();

  return (
    <div className="rounded-3xl overflow-hidden relative mb-8"
      style={{
        background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(17,17,21,0.95) 55%)',
        border: '1px solid rgba(99,102,241,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
      
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)' }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Smile size={20} className="text-brand-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">How are you feeling?</p>
              <p className="text-sm text-gray-500 mt-0.5">Your mood shapes the AI suggestion</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {MOODS.map((m) => {
              const isSelected = selected === m.value;
              return (
                <button key={m.value} onClick={() => { setSelected(m.value); logMood.mutate(m.value); }}
                  className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    borderColor: isSelected ? m.border : 'rgba(255,255,255,0.06)',
                    background: isSelected ? m.bg : 'rgba(255,255,255,0.02)',
                    boxShadow: isSelected ? `0 0 24px ${m.color}25` : 'none',
                  }}>
                  <span className="text-4xl leading-none">{m.emoji}</span>
                  <span className="text-sm font-medium mt-1" style={{ color: isSelected ? m.color : '#6b7280' }}>{m.label}</span>
                </button>
              );
            })}
          </div>
          
          {logMood.isSuccess && (
            <div className="mt-5 flex items-center gap-2.5 text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0 animate-pulse" />
              Mood logged — Generating suggestion...
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 flex flex-col justify-center relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Sparkles size={20} className="text-brand-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">AI Suggestion</p>
                <p className="text-sm text-gray-500 mt-0.5">Personalised daily plan</p>
              </div>
            </div>
            <button onClick={() => mutate()} disabled={isPending}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 shrink-0 rounded-xl">
              <Brain size={16} /> {isPending ? 'Thinking...' : 'Generate'}
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-[140px]">
            {isPending && (
              <div className="rounded-2xl p-6 space-y-3" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-5/6 rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
              </div>
            )}

            {data?.suggestion && !isPending && (
              <div className="rounded-2xl p-6 text-base text-gray-200 leading-relaxed"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.20)', boxShadow: 'inset 0 0 30px rgba(99,102,241,0.05)' }}>
                <div className="flex gap-3">
                  <span className="text-brand-400 mt-0.5 shrink-0">✦</span>
                  <span>{data.suggestion}</span>
                </div>
              </div>
            )}

            {!data && !isPending && !isError && (
              <div className="rounded-2xl px-6 py-10 text-sm text-gray-500 text-center flex flex-col items-center justify-center border-dashed"
                style={{ background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <Brain size={28} className="mb-3 text-gray-600" />
                Pick a mood to get a smart attendance strategy.
              </div>
            )}

            {isError && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-2xl p-5 flex items-center gap-3">
                <AlertTriangle size={20} /> Failed to get suggestion. Check your API key.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Safe Bunks Grid ─────────────────────────────────────────────────── */
function SafeBunksGrid({ stats, onOpenSimulator }) {
  if (!stats?.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
            <TrendingUp size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Safe Bunks Remaining</h2>
            <p className="text-sm text-gray-500 mt-0.5">Your current standing in all subjects</p>
          </div>
        </div>
        <button onClick={onOpenSimulator} className="btn-ghost flex items-center gap-2 text-sm px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white">
          <FlaskConical size={16} className="text-amber-400" /> Open Simulator
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {stats.map((s) => {
          const isSafe = s.isSafe;
          const barColor = isSafe ? (s.safeBunks > 3 ? '#22c55e' : '#eab308') : '#ef4444';
          const pct = Math.min(100, Math.max(0, s.percentage));

          return (
            <div key={s.subject.id} className="rounded-2xl p-5 flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
              style={{ background: 'rgba(17,17,21,0.8)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl pointer-events-none opacity-20" style={{ backgroundColor: barColor }} />

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.subject.color, boxShadow: `0 0 10px ${s.subject.color}80` }} />
                  <span className="text-lg font-bold text-white truncate">{s.subject.name}</span>
                </div>
                <span className="text-lg font-bold tabular-nums shrink-0" style={{ color: barColor }}>{s.percentage}%</span>
              </div>

              <div className="mt-auto relative z-10">
                <div className="h-2.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}aa, ${barColor})`, boxShadow: `0 0 12px ${barColor}80` }} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">Status</span>
                  {isSafe ? (
                    <span className="text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5"
                      style={{ color: barColor, background: barColor + '15', border: `1px solid ${barColor}30` }}>
                      {s.safeBunks === 0 ? <><AlertTriangle size={12} /> 0 left</> : <><CheckCircle2 size={12} /> {s.safeBunks} safe</>}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3.5 py-1.5 rounded-full text-red-400 flex items-center gap-1.5"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <AlertTriangle size={12} /> +{s.classesNeeded} needed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Simulator Modal ─────────────────────────────────────────────────── */
function SimulatorModal({ isOpen, onClose, stats }) {
  const [bunks, setBunks] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const totalBunks = Object.values(bunks).reduce((s, v) => s + (Number(v) || 0), 0);

  if (!isOpen) return null;

  const simulate = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(bunks).filter(([, v]) => v > 0));
      const { data } = await api.get('/bunk/whatif', { params });
      setResult(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  const reset = () => { setBunks({}); setResult(null); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-[fadeIn_0.2s_ease-out]"
        style={{ background: 'rgba(17,17,21,0.95)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <FlaskConical size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">What-If Simulator</p>
              <p className="text-sm text-gray-500 mt-0.5">Test attendance drops before you skip</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="space-y-3 mb-6">
            {stats?.map((s) => {
              const count = bunks[s.subject.id] || 0;
              return (
                <div key={s.subject.id} className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all"
                  style={{ background: count > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${count > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.subject.color }} />
                    <span className="text-base font-semibold text-white truncate">{s.subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 bg-black/20 rounded-xl p-1 border border-white/5">
                    <button onClick={() => setBunks((b) => ({ ...b, [s.subject.id]: Math.max(0, (b[s.subject.id] || 0) - 1) }))}
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 text-sm flex items-center justify-center transition-all">−</button>
                    <span className={`text-base w-6 text-center font-bold tabular-nums ${count > 0 ? 'text-amber-400' : 'text-gray-500'}`}>{count}</span>
                    <button onClick={() => setBunks((b) => ({ ...b, [s.subject.id]: (b[s.subject.id] || 0) + 1 }))}
                      className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 text-sm flex items-center justify-center transition-all">+</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 mb-2">
            <button onClick={simulate} disabled={loading || totalBunks === 0}
              className="btn-primary text-base font-semibold px-6 py-3 flex-1 flex items-center justify-center gap-2 disabled:opacity-40 rounded-xl">
              <FlaskConical size={18} /> {loading ? 'Simulating...' : `Simulate ${totalBunks > 0 ? `${totalBunks} skips` : ''}`}
            </button>
            {result && (
              <button onClick={reset} className="btn-ghost text-sm px-5 flex items-center gap-2 rounded-xl border border-white/10">
                <RotateCcw size={16} /> Reset
              </button>
            )}
          </div>

          {result && (
            <div className="mt-6 rounded-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {result.warning && (
                <div className="flex items-center justify-center gap-2 text-sm text-yellow-400 px-5 py-4 font-bold"
                  style={{ background: 'rgba(234,179,8,0.1)', borderBottom: '1px solid rgba(234,179,8,0.2)' }}>
                  <AlertTriangle size={18} /> Danger: Threshold breached!
                </div>
              )}
              {result.simulation?.map((s, i) => (
                <div key={s.subjectId} className="flex items-center justify-between px-5 py-4 text-sm"
                  style={{ borderBottom: i !== result.simulation.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-gray-300 font-semibold truncate flex-1 pr-4">{s.subjectName}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-gray-500 font-medium tabular-nums">{s.currentPct}%</span>
                    <span className="text-gray-600">→</span>
                    <span className={`font-bold text-base tabular-nums ${s.isSafeAfter ? 'text-green-400' : 'text-red-400'}`}>{s.simulatedPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Floating Chat ───────────────────────────────────────────────────── */
function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm your AttendSmart AI. Ask me anything — \"Can I bunk tomorrow?\", \"How many more can I skip in Math?\"" },
  ]);
  const [input, setInput] = useState('');
  const chatMutation = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending, isOpen]);

  const send = async () => {
    const msg = input.trim();
    if (!msg) return;
    const newHistory = [...messages, { role: 'user', content: msg }];
    setMessages(newHistory);
    setInput('');
    const reply = await chatMutation.mutateAsync({ message: msg, conversationHistory: messages });
    setMessages([...newHistory, { role: 'assistant', content: reply }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-4 pointer-events-none">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] h-[500px] max-h-[70vh] rounded-3xl flex flex-col overflow-hidden pointer-events-auto shadow-2xl animate-[fadeIn_0.2s_ease-out_forwards] origin-bottom-right"
          style={{ background: 'rgba(17,17,21,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
          
          <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Brain size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  AttendSmart AI <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Powered by Gemini</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] text-[14px] rounded-2xl px-4 py-3 leading-relaxed ${m.role === 'user' ? 'text-white' : 'text-gray-200'}`}
                  style={m.role === 'user'
                    ? { background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 4px 14px rgba(99,102,241,0.25)', borderBottomRightRadius: '4px' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderBottomLeftRadius: '4px' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderBottomLeftRadius: '4px' }}>
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t bg-black/20" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="relative">
              <input className="input w-full text-sm pr-12 py-3.5 rounded-xl bg-white/5 border-transparent focus:bg-white/10"
                placeholder="Ask me anything..."
                value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
              <button onClick={send} disabled={chatMutation.isPending || !input.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-lg bg-brand-500 flex items-center justify-center text-white disabled:opacity-50 hover:bg-brand-600 transition-colors">
                <Send size={15} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(99,102,241,0.4)] transition-transform hover:scale-110 active:scale-95 pointer-events-auto relative"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
      >
        {isOpen ? <X size={24} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
        {!isOpen && <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#111115] animate-pulse" />}
      </button>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function BunkPlanner() {
  const { data: stats } = useSafeBunks();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-[fadeIn_0.3s_ease-out] max-w-[1400px] mx-auto min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Planner</h1>
        <p className="text-[15px] text-gray-400 mt-1.5">AI-powered attendance strategies and deep insights.</p>
      </div>

      <MoodAndAI />
      <SafeBunksGrid stats={stats} onOpenSimulator={() => setIsSimulatorOpen(true)} />
      
      <SimulatorModal isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} stats={stats} />
      <FloatingChat />
    </div>
  );
}
