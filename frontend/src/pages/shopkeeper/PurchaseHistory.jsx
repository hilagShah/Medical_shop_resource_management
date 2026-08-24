import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import {
  Truck,
  Search,
  Calendar,
  Eye,
  DollarSign,
  Package,
  Building2,
  Phone,
  FileSpreadsheet,
  PackagePlus,
  Filter,
  CheckCircle,
  ExternalLink,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import PurchaseInvoiceModal from '../../components/PurchaseInvoiceModal';

const PurchaseHistory = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [suppliersSummary, setSuppliersSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'suppliers'

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const fetchPurchaseData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, suppliersRes] = await Promise.all([
        API.get('/purchases', {
          params: {
            search,
            supplierName: selectedSupplier,
            startDate,
            endDate,
          },
        }),
        API.get('/purchases/suppliers-summary'),
      ]);

      setPurchases(purchasesRes.data);
      setSuppliersSummary(suppliersRes.data);
    } catch (err) {
      console.error('Error fetching purchase data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseData();
  }, [search, selectedSupplier, startDate, endDate]);

  // Key Metrics
  const totalSpend = purchases.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalUnits = purchases.reduce((acc, curr) => acc + (curr.totalQuantity || 0), 0);
  const uniqueSuppliersCount = suppliersSummary.length;

  // Extract unique supplier names for dropdown
  const uniqueSupplierNames = [
    'All',
    ...Array.from(new Set(suppliersSummary.map((s) => s.displayName).filter(Boolean))),
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Truck className="h-6 w-6 text-cyan-400" />
            Supplier Purchase History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track and audit incoming medicine inventory purchases, vendor invoices, and supplier expenditure
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/shopkeeper/inventory')}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 shadow-md"
          >
            <PackagePlus className="h-4 w-4 text-cyan-400" />
            <span>New Stock & Bill Entry</span>
          </button>
        </div>
      </div>

      {/* TOP METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Purchase Cost
            </span>
            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">₹{totalSpend.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Spent across {purchases.length} invoices</p>
        </div>

        {/* Total Invoices */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Purchase Invoices
            </span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">{purchases.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Recorded purchase bills</p>
        </div>

        {/* Active Suppliers */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Distributors & Suppliers
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{uniqueSuppliersCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active vendor partners</p>
        </div>

        {/* Total Units Purchased */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Stock Units Acquired
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{totalUnits}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total medicine quantity</p>
        </div>
      </div>

      {/* VIEW TABS & FILTER BAR */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'invoices'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>All Purchase Bills ({purchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'suppliers'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Supplier Directory & Spend Analysis ({suppliersSummary.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice #, supplier, or medicine..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Supplier Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {uniqueSupplierNames.map((name) => (
                  <option key={name} value={name}>
                    {name === 'All' ? 'All Suppliers' : name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
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

            {(search || selectedSupplier !== 'All' || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedSupplier('All');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-400 hover:underline font-medium ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: ALL PURCHASE BILLS TABLE */}
      {activeTab === 'invoices' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Purchase Date</th>
                  <th className="p-4">Invoice / Purchase #</th>
                  <th className="p-4">Supplier / Distributor</th>
                  <th className="p-4 text-center">Items & Units</th>
                  <th className="p-4 text-right">Bill Total (₹)</th>
                  <th className="p-4 text-center">Source</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      Loading purchase history...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500 space-y-2">
                      <Truck className="h-8 w-8 mx-auto opacity-30 text-cyan-400" />
                      <p>No purchase records found matching your filters.</p>
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => {
                    const dateFormatted = p.purchaseDate
                      ? new Date(p.purchaseDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : new Date(p.createdAt).toLocaleDateString();

                    return (
                      <tr key={p._id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Date */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-semibold">{dateFormatted}</span>
                          </div>
                        </td>

                        {/* Invoice & Purchase # */}
                        <td className="p-4">
                          <p className="font-mono font-bold text-white text-xs">
                            {p.invoiceNumber || p.purchaseNumber}
                          </p>
                          {p.invoiceNumber && (
                            <p className="font-mono text-[10px] text-slate-500">{p.purchaseNumber}</p>
                          )}
                        </td>

                        {/* Supplier */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-200">
                              {p.supplier?.name || 'General Supplier'}
                            </p>
                            {p.supplier?.contact && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                {p.supplier.contact}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Items & Units */}
                        <td className="p-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-white text-xs">{p.items?.length || 0} items</span>
                            <span className="text-[10px] text-slate-400">({p.totalQuantity} units)</span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="p-4 text-right">
                          <span className="font-mono text-sm font-black text-cyan-400">
                            ₹{p.totalAmount?.toFixed(2)}
                          </span>
                        </td>

                        {/* Source Badge */}
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                              p.source === 'ocr_scan'
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {p.source === 'ocr_scan' ? 'AI OCR' : 'Manual'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedPurchase(p)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/30 border border-slate-700 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect Bill</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIER DIRECTORY & SPEND ANALYSIS */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliersSummary.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500 space-y-2">
              <Truck className="h-8 w-8 mx-auto opacity-30 text-amber-400" />
              <p>No supplier records found.</p>
            </div>
          ) : (
            suppliersSummary.map((supplier, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-cyan-500/40 transition-all shadow-lg"
              >
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white">{supplier.displayName}</h3>
                    {supplier.contact ? (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>{supplier.contact}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">No contact details</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                    <Truck className="h-4 w-4" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-950/70 p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Spend</span>
                    <p className="font-mono font-black text-cyan-400 mt-0.5">
                      ₹{supplier.totalSpent?.toFixed(0)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Invoices</span>
                    <p className="font-mono font-black text-purple-300 mt-0.5">
                      {supplier.totalInvoices}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Units</span>
                    <p className="font-mono font-black text-emerald-400 mt-0.5">
                      {supplier.totalQuantity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                  <span>Last Purchase:</span>
                  <span className="font-semibold text-slate-300">
                    {supplier.lastPurchaseDate
                      ? new Date(supplier.lastPurchaseDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedSupplier(supplier.displayName);
                    setActiveTab('invoices');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
                >
                  <span>View All Invoices from Supplier</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* INSPECT PURCHASE MODAL */}
      {selectedPurchase && (
        <PurchaseInvoiceModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
    </div>
  );
};

export default PurchaseHistory;
