import { useState } from 'react';
import { FlaskConical, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
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

  const reset = () => { setBunks({}); setResult(null); };
  const totalBunks = Object.values(bunks).reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(17,17,21,0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <FlaskConical size={14} className="text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">What-If Simulator</p>
          <p className="text-[11px] text-gray-600 mt-0.5">See the impact before you skip</p>
        </div>
      </div>

      <div className="p-5">
        {/* Subject stepper rows */}
        <div className="space-y-2.5 mb-5">
          {stats.map((s) => {
            const count = bunks[s.subject.id] || 0;
            return (
              <div key={s.subject.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors"
                style={{ background: count > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${count > 0 ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)'}` }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.subject.color }} />
                  <span className="text-sm text-white truncate">{s.subject.name}</span>
                  <span className="text-xs text-gray-600 shrink-0 tabular-nums">{s.percentage}%</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setBunks((b) => ({ ...b, [s.subject.id]: Math.max(0, (b[s.subject.id] || 0) - 1) }))}
                    className="w-7 h-7 rounded-lg border text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-all flex items-center justify-center font-bold"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }}
                  >−</button>
                  <span className={`text-sm w-5 text-center font-bold tabular-nums ${count > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                    {count}
                  </span>
                  <button
                    onClick={() => setBunks((b) => ({ ...b, [s.subject.id]: (b[s.subject.id] || 0) + 1 }))}
                    className="w-7 h-7 rounded-lg border text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-all flex items-center justify-center font-bold"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }}
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-1">
          <button
            onClick={simulate}
            disabled={loading || totalBunks === 0}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40 flex-1 justify-center"
          >
            <FlaskConical size={13} />
            {loading ? 'Simulating...' : `Simulate ${totalBunks > 0 ? `${totalBunks} bunk${totalBunks !== 1 ? 's' : ''}` : '…'}`}
          </button>
          {result && (
            <button
              onClick={reset}
              className="btn-ghost text-sm px-3 py-2 flex items-center gap-1.5"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {result.warning && (
              <div className="flex items-center gap-2 text-xs text-yellow-400 px-4 py-2.5"
                style={{ background: 'rgba(234,179,8,0.08)', borderBottom: '1px solid rgba(234,179,8,0.15)' }}>
                <AlertTriangle size={12} />
                Some subjects would drop below your threshold!
              </div>
            )}

            {result.simulation?.map((s, i) => (
              <div
                key={s.subjectId}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderBottom: i !== result.simulation.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  background: 'rgba(255,255,255,0.015)',
                }}
              >
                <span className="text-sm text-gray-300 truncate flex-1 mr-3">{s.subjectName}</span>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <span className="text-gray-500 tabular-nums">{s.currentPct}%</span>
                  <span className="text-gray-600">→</span>
                  <span className={`font-semibold tabular-nums ${s.isSafeAfter ? 'text-green-400' : 'text-red-400'}`}>
                    {s.simulatedPct}%
                  </span>
                  {s.isSafeAfter
                    ? <CheckCircle2 size={12} className="text-green-400" />
                    : <AlertTriangle size={12} className="text-red-400" />
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
