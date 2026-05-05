import { Loader2 } from 'lucide-react';

export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-brand-500 ${className}`} />;
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center h-48 gap-3 text-gray-400">
      <Spinner />
      <span className="text-sm">{message}</span>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="card text-center py-12">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="font-medium text-white mb-1">{title}</p>
      {message && <p className="text-sm text-gray-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
