import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  PackageCheck,
  Receipt,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  Pill,
} from 'lucide-react';

const ShopkeeperDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    lowStockCount: 0,
    expiringCount: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, medicinesRes] = await Promise.all([
          API.get('/orders'),
          API.get('/medicines'),
        ]);

        const orders = ordersRes.data;
        const medicines = medicinesRes.data;

        // Calculate today's sales
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayOrders = orders.filter(
          (o) => new Date(o.createdAt).toISOString().slice(0, 10) === todayStr
        );

        const todayRevenue = todayOrders.reduce((acc, curr) => acc + curr.finalAmount, 0);

        // Low stock & Expiring soon
        const lowStock = medicines.filter((m) => m.stockQuantity <= 10);
        const now = new Date();
        const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
        const expiring = medicines.filter(
          (m) => new Date(m.expiryDate) <= sixtyDays
        );

        setStats({
          todaySales: todayOrders.length,
          todayRevenue,
          lowStockCount: lowStock.length,
          expiringCount: expiring.length,
          recentOrders: orders.slice(0, 5),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-900/60 via-slate-900 to-slate-900 p-8 border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/30">
            {user?.shopName || 'Branch Terminal'}
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Ready for billing? Open the Sales & Billing Counter or register new medicine stock purchases.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={() => navigate('/shopkeeper/pos')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              Open Billing Counter
            </button>
            <button
              onClick={() => navigate('/shopkeeper/inventory')}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
            >
              <PackageCheck className="h-4 w-4" />
              New Purchase Entry
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">₹{stats.todayRevenue.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{stats.todaySales} sales completed today</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Sales</span>
            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{stats.todaySales} Orders</p>
          <p className="text-[11px] text-slate-500 mt-1">Processed at this branch</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Items</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-3">{stats.lowStockCount} Items</p>
          <p className="text-[11px] text-slate-500 mt-1">Stock quantity &le; 10 units</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Near / Expired</span>
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-3">{stats.expiringCount} Batches</p>
          <p className="text-[11px] text-slate-500 mt-1">Expiring within 60 days</p>
        </div>
      </div>

      {/* RECENT SALES TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Your Recent Completed Sales</h2>
            <p className="text-xs text-slate-400">Latest checkout receipts generated</p>
          </div>
          <button
            onClick={() => navigate('/shopkeeper/sales')}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:underline"
          >
            <span>View Full Sales History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Invoice #</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3 text-right">Original Subtotal</th>
                <th className="p-3 text-right">Discount</th>
                <th className="p-3 text-right">Net Paid</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">No recent sales recorded.</td>
                </tr>
              ) : (
                stats.recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">{o.orderNumber}</td>
                    <td className="p-3 font-medium text-white">{o.customerDetails?.name || 'Walk-in Customer'}</td>
                    <td className="p-3 text-right font-mono text-slate-400">₹{o.grossTotalBeforeDiscount.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">-₹{o.totalCumulativeDiscount.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">₹{o.finalAmount.toFixed(2)}</td>
                    <td className="p-3 text-slate-400">{new Date(o.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopkeeperDashboard;
