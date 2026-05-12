import { Loader2 } from 'lucide-react';

export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-brand-400 ${className}`} />;
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-brand-500/20 animate-ping absolute inset-0" />
        <div className="w-10 h-10 rounded-full border-2 border-t-brand-400 border-brand-500/20 animate-spin" />
      </div>
      <span className="text-sm text-gray-500">{message}</span>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="card text-center py-14">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-3xl"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
        {icon}
      </div>
      <p className="font-display font-semibold text-white mb-1.5 text-lg">{title}</p>
      {message && <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return <div className={`skeleton h-24 rounded-2xl ${className}`} />;
}

export function SkeletonRow({ className = '' }) {
  return <div className={`skeleton h-12 rounded-xl ${className}`} />;
}
