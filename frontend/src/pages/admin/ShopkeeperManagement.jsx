import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  Lock,
  Building2,
  Phone,
  Mail,
  X,
  UserCheck,
  UserX,
  CreditCard,
  Calendar,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Check,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

const ShopkeeperManagement = () => {
  const [shopkeepers, setShopkeepers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bill Retention & Trading Year Modal
  const [selectedRetentionShopkeeper, setSelectedRetentionShopkeeper] = useState(null);
  const [retentionStats, setRetentionStats] = useState(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);

  const [formData, setFormData] = useState(() => ({
    name: '',
    email: '',
    password: '',
    shopName: '',
    phone: '',
    isActive: true,
    tradingYearStartDate: new Date().toISOString().slice(0, 10),
    paymentStatus: 'paid',
    subscriptionPlan: 'monthly',
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    monthlyFee: 0,
  }));

  const fetchShopkeepers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/shopkeepers', {
        params: { search, status: statusFilter, paymentStatus: paymentFilter },
      });
      setShopkeepers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopkeepers();
  }, [search, statusFilter, paymentFilter]);

  const handleOpenModal = (user = null) => {
    setError('');
    setSuccess('');
    if (user) {
      setEditingId(user._id);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        shopName: user.shopName,
        phone: user.phone || '',
        isActive: user.isActive,
        tradingYearStartDate: user.tradingYearStartDate
          ? new Date(user.tradingYearStartDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        paymentStatus: user.paymentStatus || 'paid',
        subscriptionPlan: user.subscriptionPlan || 'monthly',
        subscriptionExpiresAt: user.subscriptionExpiresAt
          ? new Date(user.subscriptionExpiresAt).toISOString().slice(0, 10)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        monthlyFee: user.monthlyFee || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        shopName: 'Branch Store',
        phone: '',
        isActive: true,
        tradingYearStartDate: new Date().toISOString().slice(0, 10),
        paymentStatus: 'paid',
        subscriptionPlan: 'monthly',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        monthlyFee: 0,
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
      if (editingId) {
        await API.put(`/users/shopkeepers/${editingId}`, formData);
        setSuccess('Shopkeeper profile updated successfully');
      } else {
        await API.post('/users/shopkeeper', formData);
        setSuccess('New shopkeeper account created');
      }
      handleCloseModal();
      fetchShopkeepers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await API.patch(`/users/shopkeepers/${id}/status`);
      fetchShopkeepers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change status');
    }
  };

  // Quick Payment Actions
  const handlePaymentAction = async (id, action) => {
    try {
      await API.patch(`/users/shopkeepers/${id}/payment`, { action });
      setSuccess(
        action === 'extend_month'
          ? 'Subscription extended by 1 Month (Paid)'
          : action === 'extend_year'
          ? 'Subscription extended by 1 Year (Paid)'
          : 'Payment marked as Overdue / Suspended'
      );
      fetchShopkeepers();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment update failed');
    }
  };

  // Open Bill Retention & Purge Modal
  const handleOpenRetentionModal = async (user) => {
    setSelectedRetentionShopkeeper(user);
    setRetentionStats(null);
    setRetentionLoading(true);
    try {
      const res = await API.get(`/users/shopkeepers/${user._id}/bill-retention-stats`);
      setRetentionStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRetentionLoading(false);
    }
  };

  // Purge Past Bills
  const handlePurgeBills = async () => {
    if (!selectedRetentionShopkeeper) return;
    const confirmMsg = `Are you sure you want to permanently delete all past trading year bills created BEFORE ${new Date(
      selectedRetentionShopkeeper.tradingYearStartDate || selectedRetentionShopkeeper.createdAt
    ).toLocaleDateString()} for ${selectedRetentionShopkeeper.shopName}? This cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    setPurgeLoading(true);
    try {
      const res = await API.post(`/users/shopkeepers/${selectedRetentionShopkeeper._id}/purge-bills`);
      alert(res.data.message);
      // Refresh stats
      const statsRes = await API.get(`/users/shopkeepers/${selectedRetentionShopkeeper._id}/bill-retention-stats`);
      setRetentionStats(statsRes.data);
      fetchShopkeepers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to purge bills');
    } finally {
      setPurgeLoading(false);
    }
  };

  // Helper for expiry countdown
  const getExpiryDetails = (expiresAt, paymentStatus) => {
    if (!expiresAt) return { text: 'No Expiry', isExpired: false, badgeClass: 'bg-slate-800 text-slate-400' };
    const diffTime = new Date(expiresAt) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || paymentStatus === 'overdue') {
      return {
        text: `Expired ${Math.abs(diffDays)}d ago`,
        isExpired: true,
        badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      };
    } else if (diffDays <= 5) {
      return {
        text: `Due in ${diffDays}d`,
        isExpired: false,
        badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      };
    } else {
      return {
        text: `${diffDays}d left`,
        isExpired: false,
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Shopkeeper & Branch Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage personnel access, monthly/yearly subscription payments, and trading year bill retention.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Create New Shopkeeper
        </button>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or branch..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="inactive">Inactive Accounts</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid & Active</option>
              <option value="overdue">Overdue / Expired</option>
              <option value="pending">Pending Payment</option>
            </select>
          </div>
        </div>
      </div>

      {/* SHOPKEEPERS TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Shopkeeper & Branch</th>
                <th className="p-4">Payment & Subscription</th>
                <th className="p-4">Quick Extend Payment</th>
                <th className="p-4">Trading Year (1-Yr Cutoff)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">Loading shopkeepers...</td>
                </tr>
              ) : shopkeepers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">No shopkeeper accounts found.</td>
                </tr>
              ) : (
                shopkeepers.map((u) => {
                  const expiry = getExpiryDetails(u.subscriptionExpiresAt, u.paymentStatus);
                  const tradingStartFormatted = u.tradingYearStartDate
                    ? new Date(u.tradingYearStartDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not Set';

                  return (
                    <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Shopkeeper & Branch */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="font-bold text-white text-sm">{u.name}</p>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Building2 className="h-3 w-3 text-cyan-400" />
                            <span>{u.shopName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>{u.email}</span>
                            {u.phone && <span>• {u.phone}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Payment & Subscription */}
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                u.paymentStatus === 'overdue' || expiry.isExpired
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {u.paymentStatus === 'overdue' || expiry.isExpired ? (
                                <ShieldAlert className="h-3 w-3" />
                              ) : (
                                <ShieldCheck className="h-3 w-3" />
                              )}
                              {u.paymentStatus === 'overdue' || expiry.isExpired ? 'Overdue' : 'Paid'}
                            </span>
                            <span className="text-[10px] text-purple-300 font-medium capitalize bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                              {u.subscriptionPlan || 'Monthly'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${expiry.badgeClass}`}>
                              {expiry.text}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              (Exp: {u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString() : 'N/A'})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Quick Extend Buttons */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePaymentAction(u._id, 'extend_month')}
                            className="rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-2 py-1 text-[11px] font-bold transition-all"
                            title="Renew +1 Month (Set Paid)"
                          >
                            +1 Mo
                          </button>
                          <button
                            onClick={() => handlePaymentAction(u._id, 'extend_year')}
                            className="rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2 py-1 text-[11px] font-bold transition-all"
                            title="Renew +1 Year (Set Paid)"
                          >
                            +1 Yr
                          </button>
                          {u.paymentStatus !== 'overdue' && !expiry.isExpired && (
                            <button
                              onClick={() => handlePaymentAction(u._id, 'mark_overdue')}
                              className="rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 px-2 py-1 text-[11px] font-bold transition-all"
                              title="Stop/Suspend Access (Mark Overdue)"
                            >
                              Overdue
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Trading Year & Bill Retention */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px] text-slate-300">
                            <Calendar className="h-3.5 w-3.5 text-amber-400" />
                            <span className="font-semibold">{tradingStartFormatted}</span>
                          </div>
                          <button
                            onClick={() => handleOpenRetentionModal(u)}
                            className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                          >
                            <span>Manage Bills / Purge</span>
                          </button>
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {u.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(u)}
                            className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                            title="Edit Account Details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u._id)}
                            className={`rounded-lg p-2 transition-all ${
                              u.isActive
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                            }`}
                            title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
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

      {/* BILL RETENTION & TRADING YEAR MODAL */}
      {selectedRetentionShopkeeper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Trading Year & 1-Year Bill Deletion</h3>
              </div>
              <button
                onClick={() => setSelectedRetentionShopkeeper(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Shop / Branch:</span>
                <span className="font-bold text-white">{selectedRetentionShopkeeper.shopName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Trading Year Start Date:</span>
                <span className="font-bold text-amber-400">
                  {selectedRetentionShopkeeper.tradingYearStartDate
                    ? new Date(selectedRetentionShopkeeper.tradingYearStartDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not configured'}
                </span>
              </div>
            </div>

            {/* Retention Statistics */}
            {retentionLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                Calculating bills breakdown...
              </div>
            ) : retentionStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Bills</p>
                    <p className="text-lg font-black text-white mt-0.5">{retentionStats.totalBills}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-[10px] text-emerald-400 uppercase font-semibold">Active (Current Yr)</p>
                    <p className="text-lg font-black text-emerald-400 mt-0.5">{retentionStats.activeCycleBills}</p>
                  </div>
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                    <p className="text-[10px] text-rose-400 uppercase font-semibold">Past Year (Expired)</p>
                    <p className="text-lg font-black text-rose-400 mt-0.5">{retentionStats.expiredBills}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    How Trading Year Retention Works:
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Bills created before the <strong>Trading Year Start Date ({new Date(retentionStats.tradingYearStartDate).toLocaleDateString()})</strong> belong to prior trading cycles and can be vanished/purged to free up MongoDB Atlas space.
                  </p>
                </div>

                {retentionStats.expiredBills > 0 ? (
                  <button
                    onClick={handlePurgeBills}
                    disabled={purgeLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-rose-600/20 hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {purgeLoading
                      ? 'Purging Expired Bills...'
                      : `Purge ${retentionStats.expiredBills} Past Trading Year Bills`}
                  </button>
                ) : (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    No expired bills from prior trading years. Database is clean!
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRetentionShopkeeper(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT SHOPKEEPER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingId ? 'Edit Shopkeeper Profile & Subscription' : 'Create Shopkeeper Account'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@medshop.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password {editingId && '(Leave blank to keep)'}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Shop / Branch Name</label>
                <input
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  placeholder="e.g. HealthCare Pharmacy - East Branch"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* TRADING YEAR START DATE */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Trading Year Start Date (1-Year Retention Cycle)
                </label>
                <input
                  type="date"
                  required
                  value={formData.tradingYearStartDate}
                  onChange={(e) => setFormData({ ...formData, tradingYearStartDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Bills created before this start date are treated as past trading year bills and can be automatically/manually vanished.
                </p>
              </div>

              {/* SUBSCRIPTION & PAYMENT SETTINGS */}
              <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <CreditCard className="h-4 w-4" />
                  Subscription & Monthly/Yearly Payment Fee
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Payment Status</label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="paid">Paid (Active)</option>
                      <option value="overdue">Overdue (Blocked)</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Plan Frequency</label>
                    <select
                      value={formData.subscriptionPlan}
                      onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="trial">Free Trial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Access Valid Until</label>
                    <input
                      type="date"
                      required
                      value={formData.subscriptionExpiresAt}
                      onChange={(e) => setFormData({ ...formData, subscriptionExpiresAt: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 px-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-slate-300">
                  Account Active (Master Switch)
                </label>
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
                  {editingId ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperManagement;
