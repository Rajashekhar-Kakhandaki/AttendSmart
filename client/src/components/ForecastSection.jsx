import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, CalendarClock, Info } from 'lucide-react';
import { useForecast } from '../api/hooks';

function ForecastBar({ label, pct, color, threshold }) {
  const isAbove = pct >= threshold;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span style={{ color }} className="font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
        {/* threshold marker */}
        <div
          className="absolute top-0 h-full w-px bg-gray-500 opacity-60"
          style={{ left: `${threshold}%` }}
        />
      </div>
    </div>
  );
}

export default function ForecastSection() {
  const { data, isLoading } = useForecast();

  if (isLoading) return null;

  const forecast = data?.forecast;
  if (!forecast?.length) return null;

  // Check if any subject has no timetable slots (remaining = 0 for all — no semester set up)
  const hasRemainingData = forecast.some((f) => f.remaining > 0);

  const atRiskCount = forecast.filter((f) => !f.onTrack).length;

  return (
    <div className="card mb-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <CalendarClock size={15} className="text-brand-500" />
          <h2 className="text-sm font-medium text-white">End-of-Semester Forecast</h2>
        </div>
        {data?.semesterEndDate ? (
          <span className="text-xs text-gray-500">
            Ends {new Date(data.semesterEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        ) : (
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <Info size={11} />
            Set semester end in Setup for accurate forecasts
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Predicted final % if you continue at your current attendance rate
      </p>

      {/* At-risk warning */}
      {atRiskCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4">
          <AlertTriangle size={13} className="shrink-0" />
          <span>
            <strong>{atRiskCount} subject{atRiskCount > 1 ? 's' : ''}</strong> will fall below threshold if you keep your current attendance rate!
          </span>
        </div>
      )}

      {/* No remaining data */}
      {!hasRemainingData && (
        <div className="text-xs text-gray-500 text-center py-4">
          No upcoming classes found. Add your timetable in Setup to see forecasts.
        </div>
      )}

      {/* Per-subject forecast cards */}
      {hasRemainingData && (
        <div className="space-y-4">
          {forecast
            .sort((a, b) => a.worstPct - b.worstPct) // worst first
            .map((f) => {
              const status = f.onTrack ? 'safe' : 'risk';
              return (
                <div
                  key={f.subjectId}
                  className={`rounded-xl border p-3 ${
                    status === 'safe'
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  {/* Subject header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.subjectColor }} />
                      <span className="text-sm font-medium text-white">{f.subjectName}</span>
                      <span className="text-xs text-gray-500">now {f.currentPct}%</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      f.onTrack ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {f.onTrack
                        ? <><CheckCircle2 size={12} /> On track</>
                        : <><AlertTriangle size={12} /> At risk</>
                      }
                    </div>
                  </div>

                  {/* Forecast bars */}
                  <div className="space-y-2 mb-3">
                    <ForecastBar
                      label={`📈 Best case (attend all ${f.remaining} remaining)`}
                      pct={f.bestPct}
                      color="#22c55e"
                      threshold={f.threshold}
                    />
                    <ForecastBar
                      label="📉 Current rate (if nothing changes)"
                      pct={f.worstPct}
                      color={f.onTrack ? '#6366f1' : '#ef4444'}
                      threshold={f.threshold}
                    />
                  </div>

                  {/* Action line */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                    <span className="text-gray-500">
                      {f.remaining} classes left · threshold {f.threshold}%
                    </span>
                    {f.onTrack ? (
                      <span className="text-green-400">
                        Can bunk up to <strong>{f.canBunkFromRemaining}</strong> more ✓
                      </span>
                    ) : (
                      <span className="text-red-400">
                        Must attend <strong>{f.mustAttendFromRemaining}</strong> of {f.remaining} ⚠
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
