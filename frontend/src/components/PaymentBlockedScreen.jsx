import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  ShieldAlert,
  Calendar,
  Building2,
  RefreshCw,
  LogOut,
  Mail,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

const PaymentBlockedScreen = ({ user }) => {
  const { logout, setUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');

  const handleRefresh = async () => {
    setChecking(true);
    setMsg('');
    try {
      const { data } = await API.get('/auth/me');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      const isExpired = data.subscriptionExpiresAt && new Date(data.subscriptionExpiresAt) < new Date();
      if (data.paymentStatus === 'paid' && !isExpired) {
        window.location.reload();
      } else {
        setMsg('Payment status is still marked overdue. Please contact admin to confirm your payment.');
      }
    } catch (err) {
      console.error(err);
      setMsg('Unable to verify status at this moment.');
    } finally {
      setChecking(false);
    }
  };

  const expiryFormatted = user?.subscriptionExpiresAt
    ? new Date(user.subscriptionExpiresAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 text-slate-100 selection:bg-rose-500/30 selection:text-white">
      <div className="w-full max-w-lg rounded-3xl border border-rose-500/20 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl shadow-rose-950/40 space-y-6 text-center">
        {/* Glow & Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600/20 to-amber-500/20 border border-rose-500/30 text-rose-400 shadow-inner shadow-rose-500/20 animate-pulse">
          <ShieldAlert className="h-10 w-10 text-rose-500" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3.5 w-3.5" />
            Access Suspended • Payment Due
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Subscription Expired
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            The monthly/yearly fee for your shopkeeper portal has expired. Access to inventory, POS sales, and transactions is temporarily paused until payment renewal.
          </p>
        </div>

        {/* Subscription Info Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
              Branch Store
            </span>
            <span className="text-xs font-semibold text-white">{user?.shopName || 'Main Store'}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-purple-400" />
              Subscription Plan
            </span>
            <span className="text-xs font-semibold text-purple-300 capitalize">
              {user?.subscriptionPlan || 'Monthly'} Plan
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-rose-400" />
              Expired On
            </span>
            <span className="text-xs font-bold text-rose-400">{expiryFormatted}</span>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            {msg}
          </div>
        )}

        {/* Guidance */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-400 flex items-center justify-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          <span>Please contact Central Administration to settle dues.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking Status...' : 'I Have Paid / Refresh Status'}
          </button>

          <button
            onClick={logout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentBlockedScreen;
