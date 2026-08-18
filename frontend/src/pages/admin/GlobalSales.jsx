import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { BarChart3, Search, Calendar, Eye, Filter } from 'lucide-react';
import InvoiceModal from '../../components/InvoiceModal';

const GlobalSales = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
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
    fetchOrders();
  }, [search, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Global Sales Logs & History</h1>
          <p className="text-xs text-slate-400 mt-1">Audit past order transactions, check discount breakdowns, and re-print receipts</p>
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
            placeholder="Search order #, customer name..."
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
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* SALES TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Branch & Billed By</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4 text-right">Original Subtotal</th>
                <th className="p-4 text-right">Cumulative Discount</th>
                <th className="p-4 text-right">Tax</th>
                <th className="p-4 text-right">Final Amount</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-500">Loading sales records...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-500">No orders found.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-cyan-400">{o.orderNumber}</td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{o.shopkeeperId?.shopName || 'Main Store'}</p>
                      <p className="text-[10px] text-slate-400">{o.shopkeeperId?.name}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-200">{o.customerDetails?.name || 'Walk-in'}</p>
                      {o.customerDetails?.doctorName && (
                        <p className="text-[10px] text-slate-400">Dr. {o.customerDetails.doctorName}</p>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-400">₹{o.grossTotalBeforeDiscount.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-emerald-400">-₹{o.totalCumulativeDiscount.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-slate-400">+₹{o.tax.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono font-bold text-white">₹{o.finalAmount.toFixed(2)}</td>
                    <td className="p-4 text-slate-400">{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
                        title="View / Print Receipt"
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

export default GlobalSales;
