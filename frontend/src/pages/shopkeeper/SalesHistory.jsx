import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Receipt, Search, Calendar, Eye, DollarSign, Percent, TrendingUp } from 'lucide-react';
import InvoiceModal from '../../components/InvoiceModal';

const SalesHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchSalesHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders', {
        params: { search, startDate, endDate },
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesHistory();
  }, [search, startDate, endDate]);

  // Daily Totals & Discounts metrics
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.finalAmount, 0);
  const totalDiscounts = orders.reduce((acc, curr) => acc + curr.totalCumulativeDiscount, 0);
  const grossSales = orders.reduce((acc, curr) => acc + curr.grossTotalBeforeDiscount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Branch Sales History</h1>
          <p className="text-xs text-slate-400 mt-1">Review past transactions, granted discounts, and re-print receipts</p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales Volume</span>
            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">₹{grossSales.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Before discounts applied</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Discounts Granted</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">₹{totalDiscounts.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total customer savings</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Collections</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">₹{totalRevenue.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-1">From {orders.length} transactions</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice # or customer..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs text-cyan-400 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* SALES HISTORY TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4 text-right">Gross Subtotal</th>
                <th className="p-4 text-right">Discount</th>
                <th className="p-4 text-right">Tax</th>
                <th className="p-4 text-right">Net Final</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-500">Loading history...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-500">No sales transactions found.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-cyan-400">{o.orderNumber}</td>
                    <td className="p-4 font-medium text-white">{o.customerDetails?.name || 'Walk-in'}</td>
                    <td className="p-4 text-right font-mono text-slate-400">₹{o.grossTotalBeforeDiscount.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-emerald-400">-₹{o.totalCumulativeDiscount.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-slate-400">+₹{o.tax.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono font-bold text-white">₹{o.finalAmount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
                        title="View & Re-print Receipt"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <InvoiceModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default SalesHistory;
