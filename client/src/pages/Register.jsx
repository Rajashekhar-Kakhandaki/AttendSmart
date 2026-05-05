import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', minThreshold: 75 });
  const [err, setErr] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setErr('');
    const result = await register(form.name, form.email, form.password, Number(form.minThreshold));
    if (result.success) navigate('/setup');
    else setErr(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white">
            Bunk<span className="text-brand-500">Smart</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Create your account</p>
        </div>

        <form onSubmit={handle} className="card space-y-4">
          {err && <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{err}</div>}

          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="Your name" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">College email</label>
            <input className="input" type="email" placeholder="you@college.edu" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Minimum 8 characters" required minLength={8}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Minimum attendance threshold (%)</label>
            <input className="input" type="number" min="1" max="100"
              value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })} />
            <p className="text-xs text-gray-500 mt-1">Most colleges require 75%. Change if yours differs.</p>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 disabled:opacity-60">
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 hover:text-brand-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
