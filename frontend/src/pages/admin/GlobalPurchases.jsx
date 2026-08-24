import React, { useState, useEffect } from 'react';
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
  Filter,
  ExternalLink,
} from 'lucide-react';
import PurchaseInvoiceModal from '../../components/PurchaseInvoiceModal';

const GlobalPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [shopkeepers, setShopkeepers] = useState([]);
  const [suppliersSummary, setSuppliersSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'suppliers'

  // Filters
  const [search, setSearch] = useState('');
  const [selectedShopkeeper, setSelectedShopkeeper] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Purchase for modal
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, shopkeepersRes, suppliersRes] = await Promise.all([
        API.get('/purchases', {
          params: {
            search,
            shopkeeperId: selectedShopkeeper !== 'All' ? selectedShopkeeper : undefined,
            supplierName: selectedSupplier,
            startDate,
            endDate,
          },
        }),
        API.get('/users/shopkeepers'),
        API.get('/purchases/suppliers-summary', {
          params: {
            shopkeeperId: selectedShopkeeper !== 'All' ? selectedShopkeeper : undefined,
          },
        }),
      ]);

      setPurchases(purchasesRes.data);
      setShopkeepers(shopkeepersRes.data);
      setSuppliersSummary(suppliersRes.data);
    } catch (err) {
      console.error('Error fetching global purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [search, selectedShopkeeper, selectedSupplier, startDate, endDate]);

  // Key Metrics
  const totalSpend = purchases.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalUnits = purchases.reduce((acc, curr) => acc + (curr.totalQuantity || 0), 0);
  const uniqueSuppliersCount = suppliersSummary.length;

  const uniqueSupplierNames = [
    'All',
    ...Array.from(new Set(suppliersSummary.map((s) => s.displayName).filter(Boolean))),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Truck className="h-6 w-6 text-cyan-400" />
            Global Supplier Purchases & Invoices
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized ledger of all supplier purchase bills recorded across all pharmacy branches
          </p>
        </div>
      </div>

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Global Purchase Volume
            </span>
            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">₹{totalSpend.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Across all branches</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Purchase Invoices
            </span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">{purchases.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total recorded bills</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Suppliers
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{uniqueSuppliersCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Vendors & Distributors</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Stock Units
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{totalUnits}</p>
          <p className="text-[11px] text-slate-500 mt-1">Units stocked network-wide</p>
        </div>
      </div>

      {/* TABS & FILTER BAR */}
      <div className="space-y-4">
        {/* Tabs */}
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
            <span>All Purchase Invoices ({purchases.length})</span>
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
            <span>Supplier Summary ({suppliersSummary.length})</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice, vendor, medicine..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Branch Filter */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <select
                value={selectedShopkeeper}
                onChange={(e) => setSelectedShopkeeper(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="All">All Branches / Stores</option>
                {shopkeepers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.shopName} ({s.name})
                  </option>
                ))}
              </select>
            </div>

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
          </div>
        </div>
      </div>

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === 'invoices' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Purchase Date</th>
                  <th className="p-4">Invoice / Purchase #</th>
                  <th className="p-4">Branch / Shop</th>
                  <th className="p-4">Supplier / Vendor</th>
                  <th className="p-4 text-center">Items</th>
                  <th className="p-4 text-right">Bill Total (₹)</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      Loading global purchases...
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
                        <td className="p-4 font-semibold text-slate-300">{dateFormatted}</td>
                        <td className="p-4">
                          <p className="font-mono font-bold text-white text-xs">
                            {p.invoiceNumber || p.purchaseNumber}
                          </p>
                          {p.invoiceNumber && (
                            <p className="font-mono text-[10px] text-slate-500">{p.purchaseNumber}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white">
                              {p.shopkeeperId?.shopName || 'Main Store'}
                            </p>
                            <p className="text-[10px] text-slate-400">{p.shopkeeperId?.name}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-amber-400">
                              {p.supplier?.name || 'General Supplier'}
                            </p>
                            {p.supplier?.contact && (
                              <p className="text-[10px] text-slate-500 font-mono">
                                {p.supplier.contact}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-white text-xs">{p.items?.length || 0} items</span>
                          <span className="text-[10px] text-slate-500 block">({p.totalQuantity} units)</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-mono text-sm font-black text-cyan-400">
                            ₹{p.totalAmount?.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedPurchase(p)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/30 border border-slate-700 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect</span>
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

      {/* TAB 2: SUPPLIER SUMMARY */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliersSummary.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500 space-y-2">
              <Truck className="h-8 w-8 mx-auto opacity-30 text-amber-400" />
              <p>No supplier summaries available.</p>
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

                <button
                  onClick={() => {
                    setSelectedSupplier(supplier.displayName);
                    setActiveTab('invoices');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
                >
                  <span>Filter Invoices from this Vendor</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* INSPECT MODAL */}
      {selectedPurchase && (
        <PurchaseInvoiceModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}
    </div>
  );
};

export default GlobalPurchases;
