import { useState } from 'react';
import { FlaskConical, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../api/client';

export default function WhatIfSimulator({ stats }) {
  const [bunks, setBunks] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!stats?.length) return null;

  const simulate = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(bunks).filter(([, v]) => v > 0)
      );
      const { data } = await api.get('/bunk/whatif', { params });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setBunks({});
    setResult(null);
  };

  const totalBunks = Object.values(bunks).reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <div className="card mb-4">
      <h3 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
        <FlaskConical size={15} className="text-brand-500" />
        What-If Simulator
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        How many extra classes would you like to skip? See if it's still safe.
      </p>

      <div className="space-y-2 mb-4">
        {stats.map((s) => (
          <div key={s.subject.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.subject.color }} />
              <span className="text-sm text-white truncate">{s.subject.name}</span>
              <span className="text-xs text-gray-500 shrink-0">{s.percentage}%</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setBunks((b) => ({ ...b, [s.subject.id]: Math.max(0, (b[s.subject.id] || 0) - 1) }))}
                className="w-6 h-6 rounded-md bg-surface border border-surface-border text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors flex items-center justify-center"
              >−</button>
              <span className="text-sm text-white w-4 text-center">{bunks[s.subject.id] || 0}</span>
              <button
                onClick={() => setBunks((b) => ({ ...b, [s.subject.id]: (b[s.subject.id] || 0) + 1 }))}
                className="w-6 h-6 rounded-md bg-surface border border-surface-border text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors flex items-center justify-center"
              >+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={simulate}
          disabled={loading || totalBunks === 0}
          className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
        >
          <FlaskConical size={13} />
          {loading ? 'Simulating...' : `Simulate ${totalBunks} bunk${totalBunks !== 1 ? 's' : ''}`}
        </button>
        {result && (
          <button onClick={reset} className="btn-ghost text-sm px-3 py-1.5">Reset</button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="border-t border-surface-border pt-4 space-y-2">
          {result.warning && (
            <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2 mb-3">
              <AlertTriangle size={13} />
              Warning: Some subjects would drop below your threshold!
            </div>
          )}

          {result.simulation?.map((s) => (
            <div key={s.subjectId} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
              <span className="text-sm text-white">{s.subjectName}</span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">{s.currentPct}%</span>
                <span className="text-gray-500">→</span>
                <span className={s.isSafeAfter ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  {s.simulatedPct}%
                </span>
                {s.isSafeAfter
                  ? <CheckCircle2 size={13} className="text-green-400" />
                  : <AlertTriangle size={13} className="text-red-400" />
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
