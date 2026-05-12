import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarCheck, Brain, Settings,
  LogOut, History, BarChart3, CalendarDays, MoreHorizontal, X, Sparkles,
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/today',     icon: CalendarCheck,   label: 'Today' },
  { to: '/planner',   icon: Brain,           label: 'Planner' },
  { to: '/history',   icon: History,         label: 'History' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
  { to: '/calendar',  icon: CalendarDays,    label: 'Calendar' },
  { to: '/setup',     icon: Settings,        label: 'Setup' },
];

const bottomMain = navItems.slice(0, 4);
const bottomMore = navItems.slice(4);

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">

      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col shrink-0 relative"
        style={{
          background: 'rgba(17,17,21,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-surface-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <span className="text-base font-display font-bold text-white">
                Attend<span className="text-gradient-brand">Smart</span>
              </span>
              <p className="text-[10px] text-gray-600 leading-none mt-0.5">Attendance tracking made smart</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? 'text-brand-400 font-medium'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.04))',
                boxShadow: 'inset 3px 0 0 #6366f1',
              } : {}}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-brand-400' : 'text-gray-600 group-hover:text-gray-300 transition-colors'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-surface-border/60">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 px-2.5 py-2 mb-1 w-full rounded-xl hover:bg-white/5 transition-all group"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-surface-card" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate group-hover:text-brand-400 transition-colors">{user?.name}</p>
              <p className="text-xs text-gray-600">≥{user?.minThreshold}% threshold</p>
            </div>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-red-400 hover:bg-red-400/5 rounded-xl w-full transition-all"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Tab Bar ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center safe-area-pb"
        style={{
          background: 'rgba(17,17,21,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}>
        {bottomMain.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs transition-all ${
                isActive ? 'text-brand-400' : 'text-gray-600 hover:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand-500/15 shadow-glow-sm' : ''}`}>
                  <Icon size={19} />
                </span>
                <span className="text-[10px] leading-none font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs text-gray-600 hover:text-gray-400 transition-all"
        >
          <span className="p-1.5 rounded-xl">
            <MoreHorizontal size={19} />
          </span>
          <span className="text-[10px] leading-none font-medium">More</span>
        </button>
      </nav>

      {/* ── Mobile "More" Bottom Sheet ───────────────────────────── */}
      {moreOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={() => setMoreOpen(false)}
          />
          <div
            ref={moreRef}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 animate-slide-up"
            style={{
              background: 'rgba(17,17,21,0.98)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              backdropFilter: 'blur(40px)',
            }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.12)' }} />

            <button
              onClick={() => { setMoreOpen(false); navigate('/profile'); }}
              className="flex items-center gap-3 px-3 py-3 mb-4 border-b border-surface-border/60 w-full text-left hover:bg-white/5 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">{user?.name}</p>
                <p className="text-xs text-gray-500">Tap to view profile</p>
              </div>
              <X
                size={18}
                className="text-gray-600 hover:text-gray-400 transition-colors"
                onClick={(e) => { e.stopPropagation(); setMoreOpen(false); }}
              />
            </button>

            <div className="space-y-1 mb-4">
              {bottomMore.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'text-brand-400 font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                  style={({ isActive }) => isActive ? {
                    background: 'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03))',
                  } : {}}
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>

            <button
              onClick={() => { setMoreOpen(false); logout(); }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-red-400 hover:bg-red-400/8 w-full transition-all"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
