import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import BillOcrModal from '../../components/BillOcrModal';
import {
  PackagePlus,
  Search,
  Filter,
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  Edit,
  Trash2,
  Zap,
} from 'lucide-react';

const InventoryManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    batchNumber: '',
    category: 'General',
    hsnCode: '3004',
    gstRate: 5,
    purchasePrice: '',
    sellingPrice: '',
    stockQuantity: '',
    expiryDate: '',
    supplierName: '',
    supplierContact: '',
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/medicines', {
        params: { search, category: categoryFilter },
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
  }, [search, categoryFilter]);

  const handleOpenModal = (med = null) => {
    setError('');
    setSuccess('');
    if (med) {
      setEditingId(med._id);
      setFormData({
        name: med.name,
        genericName: med.genericName,
        batchNumber: med.batchNumber,
        category: med.category,
        hsnCode: med.hsnCode || (med.category?.toLowerCase().includes('cosmetic') ? '3304' : '3004'),
        gstRate: med.gstRate !== undefined ? med.gstRate : (med.category?.toLowerCase().includes('cosmetic') ? 18 : 5),
        purchasePrice: med.purchasePrice,
        sellingPrice: med.sellingPrice,
        stockQuantity: med.stockQuantity,
        expiryDate: new Date(med.expiryDate).toISOString().slice(0, 10),
        supplierName: med.supplier?.name || '',
        supplierContact: med.supplier?.contact || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        genericName: '',
        batchNumber: '',
        category: 'General',
        hsnCode: '3004',
        gstRate: 5,
        purchasePrice: '',
        sellingPrice: '',
        stockQuantity: '',
        expiryDate: '',
        supplierName: '',
        supplierContact: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name,
        genericName: formData.genericName,
        batchNumber: formData.batchNumber,
        category: formData.category,
        hsnCode: formData.hsnCode,
        gstRate: Number(formData.gstRate),
        purchasePrice: parseFloat(formData.purchasePrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        stockQuantity: parseInt(formData.stockQuantity, 10),
        expiryDate: formData.expiryDate,
        supplier: {
          name: formData.supplierName,
          contact: formData.supplierContact,
        },
      };

      if (editingId) {
        await API.put(`/medicines/${editingId}`, payload);
        setSuccess('Medicine record updated');
      } else {
        const res = await API.post('/medicines', payload);
        setSuccess(res.data.message || 'Purchase entry recorded');
      }

      handleCloseModal();
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medicine entry');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this medicine from inventory?')) {
      try {
        await API.delete(`/medicines/${id}`);
        fetchInventory();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const categories = ['All', 'Analgesics / Antipyretic', 'Antibiotics', 'Antihistamines', 'Antidiabetic', 'Gastrointestinal', 'Cardiovascular', 'General'];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Stock & Purchase Entry</h1>
          <p className="text-xs text-slate-400 mt-1">Record incoming stock batches, update prices, and check expiry indicators</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOcrModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
          >
            <Zap className="h-4 w-4" />
            Scan Purchase Bill (OCR)
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
          >
            <PackagePlus className="h-4 w-4" />
            Add Manual Purchase Entry
          </button>
        </div>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          {success}
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, generic, or batch #..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* STOCK TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Medicine & Generic</th>
                <th className="p-4">Category</th>
                <th className="p-4">Batch #</th>
                <th className="p-4">Buy Price</th>
                <th className="p-4">Sell Price</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4">Expiry Indicator</th>
                <th className="p-4">Supplier</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-500">Loading stock inventory...</td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-500">No stock entries found.</td>
                </tr>
              ) : (
                medicines.map((m) => {
                  const now = new Date();
                  const expDate = new Date(m.expiryDate);
                  const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

                  const isExpired = expDate <= now;
                  const isExpiringSoon = expDate > now && expDate <= sixtyDays;
                  const isLowStock = m.stockQuantity <= 10;

                  return (
                    <tr key={m._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-white">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.genericName}</p>
                      </td>
                      <td className="p-4">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700">
                          {m.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-medium text-cyan-400">{m.batchNumber}</td>
                      <td className="p-4 font-mono text-slate-400">₹{m.purchasePrice.toFixed(2)}</td>
                      <td className="p-4 font-mono font-semibold text-emerald-400">₹{m.sellingPrice.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                          isLowStock
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {m.stockQuantity} units
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="h-3 w-3" />
                              Expired
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                              <Clock className="h-3 w-3" />
                              Expiring Soon ({expDate.toLocaleDateString()})
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-slate-300">
                              {expDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">
                        <p className="font-medium text-slate-300">{m.supplier?.name || 'N/A'}</p>
                        <p className="text-[10px] text-slate-500">{m.supplier?.contact}</p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(m)}
                            className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                            title="Edit Stock Entry"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m._id)}
                            className="rounded-lg bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
                            title="Delete Stock"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* PURCHASE ENTRY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingId ? 'Edit Stock Record' : 'New Purchase Entry Form'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Medicine Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Paracetamol 500mg"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Generic Name</label>
                  <input
                    type="text"
                    required
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Acetaminophen"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="e.g. BATCH-2026-X1"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const isCosmetic = cat.toLowerCase().includes('cosmetic');
                      setFormData({
                        ...formData,
                        category: cat,
                        gstRate: isCosmetic ? 18 : (formData.gstRate === 18 ? 5 : formData.gstRate),
                        hsnCode: isCosmetic ? '3304' : (formData.hsnCode === '3304' ? '3004' : formData.hsnCode),
                      });
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">GST Tax Slab</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-cyan-400 font-bold font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Regular Medicines)</option>
                    <option value={12}>12% (Pharma / Nutra)</option>
                    <option value={18}>18% (Cosmetics / FMCG)</option>
                    <option value={28}>28% (Luxury / Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="e.g. 3004"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="15.00"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="35.00"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="100"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="e.g. Apex Pharma Labs"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Contact</label>
                  <input
                    type="text"
                    value={formData.supplierContact}
                    onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110"
                >
                  {editingId ? 'Update Stock' : 'Confirm Purchase Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* OCR SCANNER MODAL */}
      <BillOcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onSuccess={fetchInventory}
      />
    </div>
  );
};

export default InventoryManagement;
