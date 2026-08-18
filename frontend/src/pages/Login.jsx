import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Pill,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Activity,
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      // Automatically redirect to the respective dashboard based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/shopkeeper/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 selection:bg-cyan-500 selection:text-white overflow-hidden">
      {/* RICH PHARMACEUTICAL AMBIENT BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none"></div>
      
      {/* Glowing Gradient Orbs */}
      <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-3/4 left-1/3 h-80 w-80 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none"></div>

      {/* Decorative Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none"></div>

      {/* Floating Medical Decorative Badges */}
      <div className="hidden lg:flex absolute top-20 left-24 items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-xl shadow-xl shadow-cyan-950/20 animate-bounce duration-[6000ms]">
        <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Live Inventory Sync</p>
          <p className="text-[10px] text-slate-400">Real-time batch stock tracking</p>
        </div>
      </div>

      <div className="hidden lg:flex absolute bottom-20 right-24 items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-xl shadow-xl shadow-blue-950/20 animate-bounce duration-[8000ms]">
        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Role-Based Security</p>
          <p className="text-[10px] text-slate-400">Admin & Storekeeper consoles</p>
        </div>
      </div>

      {/* MAIN LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md space-y-7 rounded-3xl border border-slate-800/90 bg-slate-900/80 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40">
        {/* LOGO & TITLE */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-xl shadow-cyan-500/30 ring-4 ring-cyan-500/10">
            <Pill className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Medical Shop Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign in to access your pharmacy dashboard
            </p>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 text-center font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@medshop.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:brightness-110 hover:shadow-cyan-500/35 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* CREDENTIALS INFO BADGE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span className="uppercase tracking-wider text-[11px] text-slate-300">System Credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            {/* Admin Credentials */}
            <div className="rounded-xl bg-purple-500/5 p-2.5 border border-purple-500/20 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-400 uppercase">Admin Role</span>
              </div>
              <p className="font-mono text-[11px] text-slate-300">admin@medshop.com</p>
              <p className="font-mono text-[10px] text-slate-500">Pass: <span className="text-slate-300">admin123</span></p>
            </div>

            {/* Shopkeeper Credentials */}
            <div className="rounded-xl bg-emerald-500/5 p-2.5 border border-emerald-500/20 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Shopkeeper Role</span>
              </div>
              <p className="font-mono text-[11px] text-slate-300">shopkeeper@medshop.com</p>
              <p className="font-mono text-[10px] text-slate-500">Pass: <span className="text-slate-300">shopkeeper123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
