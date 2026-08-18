import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import {
  Pill,
  DollarSign,
  TrendingUp,
  Percent,
  AlertTriangle,
  Users,
  UserPlus,
  Download,
  Receipt,
  FileSpreadsheet,
  Clock,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/orders/analytics');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportToCSV = () => {
    if (!data?.recentTransactions || data.recentTransactions.length === 0) return;

    const headers = [
      'Order Number',
      'Date',
      'Shopkeeper / Branch',
      'Customer',
      'Gross Amount (₹)',
      'Item Discount (₹)',
      'Order Discount (₹)',
      'Total Discount (₹)',
      'Final Amount (₹)',
      'Payment Method',
    ];

    const rows = data.recentTransactions.map((t) => [
      t.orderNumber,
      new Date(t.createdAt).toLocaleString(),
      `"${t.shopkeeperId?.shopName || 'Main'}"`,
      `"${t.customerDetails?.name || 'Walk-in'}"`,
      t.grossTotalBeforeDiscount,
      t.totalItemDiscount,
      t.orderDiscount?.amount || 0,
      t.totalCumulativeDiscount,
      t.finalAmount,
      t.paymentMethod,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medishop_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          <span>Loading central analytics dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400">
        {error}
      </div>
    );
  }

  const { summary, alerts, recentTransactions } = data;

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Central Analytics & Control</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time global insights, inventory health, and profitability overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/admin/shopkeepers')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            + Add New Shopkeeper
          </button>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all border border-slate-700/60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all border border-slate-700/60"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">₹{summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-500 mt-1">From {summary.totalSalesCount} total completed sales</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</span>
            <div className={`rounded-xl p-2 ${summary.netProfit >= 0 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-3 ${summary.netProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
            ₹{summary.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Revenue minus total purchase cost</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cumulative Discounts</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">₹{summary.totalDiscountsGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-500 mt-1">Line-item + Cart level discounts</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Medicines & Stock</span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
              <Pill className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{summary.totalMedicinesCount} Types</p>
          <p className="text-[11px] text-slate-500 mt-1">{summary.totalStockUnits.toLocaleString()} total units in inventory</p>
        </div>
      </div>

      {/* ALERTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Warning */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Low-Stock Alerts (&le; 10 Units)</h2>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400">
              {alerts.lowStock.length}
            </span>
          </div>

          {alerts.lowStock.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">All stock levels are optimal.</p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {alerts.lowStock.map((m) => (
                <div key={m._id} className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3 border border-slate-800/80 text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{m.name}</p>
                    <p className="text-[10px] text-slate-400">Batch: {m.batchNumber} | Shop: {m.createdBy?.shopName || 'Main'}</p>
                  </div>
                  <span className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                    {m.stockQuantity} Left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiry Warnings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-rose-400">
              <Clock className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Expiry Alerts (&lt; 60 Days)</h2>
            </div>
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-400">
              {alerts.expired.length + alerts.expiringSoon.length}
            </span>
          </div>

          {alerts.expired.length === 0 && alerts.expiringSoon.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No medicines near or past expiry.</p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {alerts.expired.map((m) => (
                <div key={m._id} className="flex items-center justify-between rounded-xl bg-rose-500/10 p-3 border border-rose-500/20 text-xs">
                  <div>
                    <p className="font-semibold text-rose-300">{m.name} (EXPIRED)</p>
                    <p className="text-[10px] text-rose-400/80">Batch: {m.batchNumber}</p>
                  </div>
                  <span className="font-mono text-rose-400 font-bold">
                    {new Date(m.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {alerts.expiringSoon.map((m) => (
                <div key={m._id} className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3 border border-slate-800/80 text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{m.name}</p>
                    <p className="text-[10px] text-slate-400">Batch: {m.batchNumber}</p>
                  </div>
                  <span className="font-mono text-amber-400 font-semibold">
                    Exp: {new Date(m.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT TRANSACTION LOGS TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">System-Wide Recent Transactions</h2>
            <p className="text-xs text-slate-400">Real-time log of POS checkout entries</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Order #</th>
                <th className="p-3">Branch / Staff</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Gross</th>
                <th className="p-3 text-right">Total Discount</th>
                <th className="p-3 text-right">Final Amount</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500">No transactions recorded yet.</td>
                </tr>
              ) : (
                recentTransactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">{t.orderNumber}</td>
                    <td className="p-3">
                      <p className="font-medium text-white">{t.shopkeeperId?.shopName || 'Main Store'}</p>
                      <p className="text-[10px] text-slate-400">{t.shopkeeperId?.name}</p>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{t.customerDetails?.name || 'Walk-in'}</td>
                    <td className="p-3 text-right font-mono text-slate-400">₹{t.grossTotalBeforeDiscount.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">-₹{t.totalCumulativeDiscount.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">₹{t.finalAmount.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700">
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(t.createdAt).toLocaleString()}</td>
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

export default AdminDashboard;
