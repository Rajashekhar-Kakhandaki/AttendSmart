import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Shield, KeyRound, Check, X, Pencil,
  LogOut, ChevronLeft, Eye, EyeOff, Flame, BookOpen,
  BarChart3, CalendarCheck,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useUpdateProfile, useChangePassword, useAttendanceStats, useStreak } from '../api/hooks';

function Avatar({ name, size = 'lg' }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  const sz = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';
  return (
    <div className="relative inline-flex">
      <div
        className={`${sz} rounded-full flex items-center justify-center font-bold text-white z-10 relative`}
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
        }}
      >
        {initials}
      </div>
      {/* Animated gradient ring */}
      <div className="absolute inset-0 rounded-full animate-spin"
        style={{
          background: 'conic-gradient(#6366f1, #8b5cf6, #a78bfa, #6366f1)',
          padding: '2px',
          animationDuration: '3s',
          zIndex: 0,
        }}
      >
        <div className="w-full h-full rounded-full bg-surface-card" />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color = 'text-brand-400', glowColor }) {
  return (
    <div className="card flex items-center gap-3 py-3 hover:scale-[1.02] transition-transform cursor-default"
      style={glowColor ? { borderColor: glowColor + '25', boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${glowColor}0d` } : {}}>
      <div className={`p-2.5 rounded-xl ${color} shrink-0`}
        style={{ background: glowColor ? glowColor + '18' : 'rgba(255,255,255,0.05)' }}>
        <Icon size={15} />
      </div>
      <div>
        <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function EditField({ label, value, onSave, type = 'text', min, max, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setVal(value); }, [value]);

  const handleSave = async () => {
    if (val === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-surface-border/60 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-600 uppercase tracking-widest mb-1 font-medium">{label}</p>
        {editing ? (
          <input
            autoFocus type={type} min={min} max={max} placeholder={placeholder}
            className="input text-sm py-1.5"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
          />
        ) : (
          <p className="text-sm text-white font-medium">{value}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving}
              className="p-1.5 rounded-xl bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all">
              <Check size={13} />
            </button>
            <button onClick={() => { setEditing(false); setVal(value); }}
              className="p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all">
              <X size={13} />
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-xl text-gray-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all">
            <Pencil size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const changePw = useChangePassword();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState({ current: false, new: false });
  const [msg, setMsg]   = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.newPassword !== form.confirm) { setMsg({ type: 'error', text: "New passwords don't match" }); return; }
    if (form.newPassword.length < 8) { setMsg({ type: 'error', text: 'Password must be at least 8 characters' }); return; }
    try {
      await changePw.mutateAsync({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg({ type: 'success', text: 'Password changed successfully!' });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    }
  };

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <KeyRound size={14} className="text-brand-400" />
        Change Password
      </h3>

      <form onSubmit={handle} className="space-y-3">
        {[
          { key: 'currentPassword', label: 'Current Password', showKey: 'current', placeholder: 'Your current password' },
          { key: 'newPassword',     label: 'New Password',     showKey: 'new',     placeholder: 'Min 8 characters' },
        ].map(({ key, label, showKey, placeholder }) => (
          <div key={key}>
            <label className="label">{label}</label>
            <div className="relative">
              <input
                type={show[showKey] ? 'text' : 'password'}
                className="input pr-10"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {show[showKey] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}

        <div>
          <label className="label">Confirm New Password</label>
          <input type="password" className="input" placeholder="Repeat new password"
            value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </div>

        {msg && (
          <div className={`text-sm px-3.5 py-2.5 rounded-xl border font-medium ${
            msg.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={changePw.isPending} className="btn-primary w-full py-2.5 text-sm">
          {changePw.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating…
            </span>
          ) : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const { data: stats } = useAttendanceStats();
  const { data: streakData } = useStreak();

  useEffect(() => {
    const handler = (e) => updateUser(e.detail);
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, [updateUser]);

  const handleSave = async (field, value) => {
    try {
      const updated = await updateProfile.mutateAsync({ [field]: field === 'minThreshold' ? Number(value) : value });
      updateUser(updated);
    } catch (err) {
      console.error('Profile update failed', err);
    }
  };

  const totalClasses = stats?.reduce((s, x) => s + x.total, 0) ?? 0;
  const avgPct = stats?.length
    ? parseFloat((stats.reduce((s, x) => s + x.percentage, 0) / stats.length).toFixed(1))
    : 0;
  const totalAbsent = stats?.reduce((s, x) => s + x.absent, 0) ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto animate-[fadeIn_0.3s_ease-out]">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-5">
        <ChevronLeft size={16} /> Back
      </button>

      {/* Profile header card */}
      <div className="card mb-5 overflow-hidden relative"
        style={{ borderColor: 'rgba(99,102,241,0.20)', boxShadow: '0 0 40px rgba(99,102,241,0.10)' }}>
        {/* Background gradient blob */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)', filter: 'blur(20px)' }} />

        <div className="flex items-center gap-4 relative z-10">
          <Avatar name={user?.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-white truncate">{user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Shield size={11} className="text-brand-400" />
              <span className="text-xs text-gray-600">≥{user?.minThreshold}% threshold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      {stats?.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <MiniStat icon={CalendarCheck} label="Total classes"    value={totalClasses}   color="text-brand-400"  glowColor="#6366f1" />
          <MiniStat icon={BarChart3}     label="Avg attendance"   value={`${avgPct}%`}   color={avgPct >= (user?.minThreshold ?? 75) ? 'text-green-400' : 'text-red-400'} glowColor={avgPct >= (user?.minThreshold ?? 75) ? '#22c55e' : '#ef4444'} />
          <MiniStat icon={Flame}         label="Current streak"   value={`${streakData?.streak ?? 0}d`} color="text-orange-400" glowColor="#f97316" />
          <MiniStat icon={BookOpen}      label="Subjects tracked" value={stats.length}   color="text-purple-400" glowColor="#a855f7" />
        </div>
      )}

      {/* Edit profile */}
      <div className="card mb-5">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <User size={13} className="text-brand-400" />
          Edit Profile
        </h3>
        <EditField label="Full Name"   value={user?.name ?? ''}            onSave={(v) => handleSave('name', v)} placeholder="Your name" />
        <EditField label="Email"       value={user?.email ?? ''}           onSave={() => {}} type="email" />
        <EditField label="Attendance Threshold (%)" value={user?.minThreshold ?? 75} onSave={(v) => handleSave('minThreshold', v)} type="number" min={1} max={100} placeholder="75" />
      </div>

      {/* Change password */}
      <div className="mb-5">
        <ChangePasswordSection />
      </div>

      {/* Sign out */}
      <button onClick={logout} className="btn-danger flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold">
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  );
}
