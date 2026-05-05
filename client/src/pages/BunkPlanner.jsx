import { useState } from 'react';
import { Brain, Sparkles, Send, Smile } from 'lucide-react';
import { useSafeBunks, useAISuggestion, useLogMood, useChat } from '../api/hooks';
import WhatIfSimulator from '../components/WhatIfSimulator';

const MOODS = [
  { value: 'HAPPY',   emoji: '😄', label: 'Happy' },
  { value: 'CHILL',   emoji: '😌', label: 'Chill' },
  { value: 'TIRED',   emoji: '😴', label: 'Tired' },
  { value: 'STRESSED',emoji: '😰', label: 'Stressed' },
];

function MoodPicker() {
  const [selected, setSelected] = useState(null);
  const logMood = useLogMood();

  const handle = (mood) => {
    setSelected(mood);
    logMood.mutate(mood);
  };

  return (
    <div className="card mb-4">
      <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Smile size={15} className="text-brand-500" />
        How are you feeling today?
      </p>
      <div className="flex gap-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => handle(m.value)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border transition-all text-sm ${
              selected === m.value
                ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                : 'border-surface-border text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            <span className="text-xl">{m.emoji}</span>
            <span className="text-xs">{m.label}</span>
          </button>
        ))}
      </div>
      {logMood.isSuccess && (
        <p className="text-xs text-green-400 mt-2">✓ Mood logged — AI suggestion updated</p>
      )}
    </div>
  );
}

function AISuggestionBox() {
  const { mutate, data, isPending, isError } = useAISuggestion();

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white flex items-center gap-2">
          <Sparkles size={15} className="text-brand-500" />
          AI Bunk Suggestion
        </p>
        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          <Brain size={13} />
          {isPending ? 'Thinking...' : 'Get suggestion'}
        </button>
      </div>

      {data?.suggestion && (
        <div className="bg-brand-500/5 border border-brand-500/20 rounded-lg p-3 text-sm text-gray-300 leading-relaxed">
          {data.suggestion}
        </div>
      )}

      {isError && (
        <p className="text-xs text-red-400">Failed to get suggestion. Check your Gemini API key.</p>
      )}

      {!data && !isPending && (
        <p className="text-xs text-gray-500">
          Log your mood above, then tap "Get suggestion" for a personalized bunk plan.
        </p>
      )}
    </div>
  );
}

function SafeBunksTable({ stats }) {
  if (!stats?.length) return null;
  return (
    <div className="card mb-4">
      <p className="text-sm font-medium text-white mb-3">Safe bunks remaining</p>
      <div className="space-y-2">
        {stats.map((s) => (
          <div key={s.subject.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.subject.color }} />
              <span className="text-sm text-white">{s.subject.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">{s.percentage}%</span>
              {s.isSafe ? (
                <span className={`font-medium ${s.safeBunks === 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {s.safeBunks === 0 ? '⚠ 0 left' : `${s.safeBunks} safe`}
                </span>
              ) : (
                <span className="text-red-400 font-medium">⚠ Attend {s.classesNeeded} more</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatBot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm your BunkSmart AI. Ask me anything — \"Can I bunk tomorrow?\", \"How many more can I skip in Math?\", etc." },
  ]);
  const [input, setInput] = useState('');
  const chatMutation = useChat();

  const send = async () => {
    const msg = input.trim();
    if (!msg) return;

    const userMsg = { role: 'user', content: msg };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');

    const reply = await chatMutation.mutateAsync({
      message: msg,
      conversationHistory: messages,
    });

    setMessages([...newHistory, { role: 'assistant', content: reply }]);
  };

  return (
    <div className="card">
      <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Brain size={15} className="text-brand-500" />
        Ask BunkSmart AI
      </p>

      <div className="h-52 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] text-sm rounded-xl px-3 py-2 ${
              m.role === 'user'
                ? 'bg-brand-500 text-white'
                : 'bg-surface border border-surface-border text-gray-300'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm text-gray-500">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder="Can I bunk Physics tomorrow?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button
          onClick={send}
          disabled={chatMutation.isPending || !input.trim()}
          className="btn-primary px-3 disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

export default function BunkPlanner() {
  const { data: stats } = useSafeBunks();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Bunk Planner</h1>
        <p className="text-sm text-gray-400 mt-0.5">AI-powered suggestions based on your attendance + mood</p>
      </div>

      <MoodPicker />
      <AISuggestionBox />
      <SafeBunksTable stats={stats} />
      <WhatIfSimulator stats={stats} />
      <ChatBot />
    </div>
  );
}
