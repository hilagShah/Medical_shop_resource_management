import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import BillOcrModal from '../../components/BillOcrModal';
import { Pill, Search, Filter, AlertTriangle, Building2, Package, Zap } from 'lucide-react';

const GlobalInventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [showOcrModal, setShowOcrModal] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/medicines', {
        params: { search, category: categoryFilter, stockStatus: stockStatusFilter },
      });
      setMedicines(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, categoryFilter, stockStatusFilter]);

  const categories = ['All', 'Analgesics / Antipyretic', 'Antibiotics', 'Antihistamines', 'Antidiabetic', 'Gastrointestinal', 'Cardiovascular', 'General'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Global Medicine Inventories</h1>
          <p className="text-xs text-slate-400 mt-1">Cross-branch stock monitoring, pricing, and batch tracking</p>
        </div>
        <button
          onClick={() => setShowOcrModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
        >
          <Zap className="h-4 w-4" />
          Scan Purchase Bill (OCR)
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, generic, batch..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Stock Statuses</option>
            <option value="low">Low Stock (&le; 10)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Medicine Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Batch Number</th>
                <th className="p-4">Purchase Price</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Registered Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500">Loading medicines...</td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500">No medicines found matching filters.</td>
                </tr>
              ) : (
                medicines.map((m) => {
                  const isLow = m.stockQuantity <= 10;
                  const isExpired = new Date(m.expiryDate) <= new Date();

                  return (
                    <tr key={m._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="text-[10px] text-slate-400">Generic: {m.genericName}</p>
                      </td>
                      <td className="p-4">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700">
                          {m.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-cyan-400 font-medium">{m.batchNumber}</td>
                      <td className="p-4 font-mono text-slate-400">₹{m.purchasePrice.toFixed(2)}</td>
                      <td className="p-4 font-mono font-semibold text-emerald-400">₹{m.sellingPrice.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                          isLow
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {m.stockQuantity} units
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-mono text-xs ${isExpired ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                          {new Date(m.expiryDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Building2 className="h-3 w-3 text-cyan-400" />
                          <span>{m.createdBy?.shopName || 'Main Store'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* OCR SCANNER MODAL */}
      <BillOcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onSuccess={fetchInventory}
      />
    </div>
  );
};

export default GlobalInventory;
