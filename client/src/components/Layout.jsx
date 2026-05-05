import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Brain, Settings, LogOut, History, BarChart3, CalendarDays } from 'lucide-react';
import useAuthStore from '../store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/today',     icon: CalendarCheck,   label: 'Today' },
  { to: '/planner',   icon: Brain,           label: 'Bunk Planner' },
  { to: '/history',   icon: History,         label: 'History' },
  { to: '/analytics', icon: BarChart3,        label: 'Analytics' },
  { to: '/calendar',  icon: CalendarDays,    label: 'Calendar' },
  { to: '/setup',     icon: Settings,        label: 'Setup' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r border-surface-border bg-surface-card shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-surface-border">
          <span className="text-lg font-semibold text-white">Bunk<span className="text-brand-500">Smart</span></span>
          <p className="text-xs text-gray-500 mt-0.5">Bunk smarter, not harder</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-500 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-surface-border">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 text-xs font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">≥{user?.minThreshold}% threshold</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg w-full transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
