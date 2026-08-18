import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Building2, ShieldCheck, ShoppingBag } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-500/20">
          <Pill className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">Medical Shop Management</h1>
          <p className="text-xs text-slate-400">Enterprise Pharmacy & Resource Management</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Branch / Shop Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 border border-slate-700/50">
          <Building2 className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-medium text-slate-200">{user?.shopName || 'Main Store'}</span>
        </div>

        {/* Role Badge */}
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
          user?.role === 'admin'
            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{user?.role}</span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="hidden md:block text-right">
            <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 transition-all hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
