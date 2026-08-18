import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Pill,
  ShoppingCart,
  Receipt,
  BarChart3,
  PackageCheck,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminLinks = [
    { name: 'Analytics & Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Shopkeeper Management', path: '/admin/shopkeepers', icon: Users },
    { name: 'Global Inventory', path: '/admin/inventory', icon: Pill },
    { name: 'Global Sales Logs', path: '/admin/sales', icon: BarChart3 },
  ];

  const shopkeeperLinks = [
    { name: 'Dashboard', path: '/shopkeeper/dashboard', icon: LayoutDashboard },
    { name: 'POS Terminal', path: '/shopkeeper/pos', icon: ShoppingCart },
    { name: 'Stock & Purchase Entry', path: '/shopkeeper/inventory', icon: PackageCheck },
    { name: 'Sales History', path: '/shopkeeper/sales', icon: Receipt },
  ];

  const links = isAdmin ? adminLinks : shopkeeperLinks;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-900/60 p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isAdmin ? 'Admin Navigation' : 'Shopkeeper Console'}
          </p>
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Quick Support</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Need help with stock sync or billing? Contact central admin.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
