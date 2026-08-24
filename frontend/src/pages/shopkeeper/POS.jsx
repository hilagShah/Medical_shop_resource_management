import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  Percent,
  DollarSign,
  User,
  Phone,
  Stethoscope,
  CheckCircle,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle,
  AlertTriangle,
  Pill,
  TrendingDown,
  TrendingUp,
  X,
  ShieldAlert,
} from 'lucide-react';
import InvoiceModal from '../../components/InvoiceModal';

const POS = () => {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingMeds, setLoadingMeds] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]);

  // Customer Details State
  const [customerDetails, setCustomerDetails] = useState({
    name: 'Walk-in Customer',
    phone: '',
    doctorName: '',
  });

  // Cart Level Discount State ({ type: 'flat' | 'percent', value: number })
  const [orderDiscount, setOrderDiscount] = useState({
    type: 'percent',
    value: 0,
  });

  // Tax State (percentage e.g. 5%)
  const [taxRate, setTaxRate] = useState(0);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Checkout Status & Invoice Modal
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Loss Warning Confirmation Modal State
  const [showLossModal, setShowLossModal] = useState(false);

  // Fetch medicines with search
  const fetchMedicines = async () => {
    setLoadingMeds(true);
    try {
      const res = await API.get('/medicines', { params: { search } });
      setMedicines(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMeds(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search]);

  // Add medicine to cart
  const addToCart = (med) => {
    if (med.stockQuantity <= 0) {
      alert(`'${med.name}' is out of stock!`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.medicineId === med._id);

    if (existingIndex > -1) {
      alert(`'${med.name}' is already in the billing cart. Please enter the quantity directly.`);
      return;
    }

    const defaultGst = med.gstRate !== undefined ? Number(med.gstRate) : (med.category?.toLowerCase().includes('cosmetic') ? 18 : 5);
    const defaultHsn = med.hsnCode || (med.category?.toLowerCase().includes('cosmetic') ? '3304' : '3004');

    setCart([
      ...cart,
      {
        medicineId: med._id,
        name: med.name,
        genericName: med.genericName,
        batchNumber: med.batchNumber,
        hsnCode: defaultHsn,
        category: med.category || 'General',
        unitPrice: med.sellingPrice,
        purchasePrice: med.purchasePrice || 0,
        stockQuantity: med.stockQuantity,
        quantity: '', // Empty field by default instead of 0
        gstRate: defaultGst,
        itemDiscount: { type: 'flat', value: 0 },
      },
    ]);
  };

  // Update item quantity
  const updateQuantity = (index, newQty) => {
    if (newQty === '') {
      const updated = [...cart];
      updated[index].quantity = '';
      setCart(updated);
      return;
    }

    const qty = Math.max(0, parseInt(newQty, 10) || 0);
    const item = cart[index];

    if (qty > item.stockQuantity) {
      alert(`Cannot exceed available stock (${item.stockQuantity} units)`);
      return;
    }

    const updated = [...cart];
    updated[index].quantity = qty;
    setCart(updated);
  };

  // Update item GST Rate
  const updateItemGstRate = (index, rate) => {
    const updated = [...cart];
    updated[index].gstRate = Math.max(0, parseFloat(rate) || 0);
    setCart(updated);
  };

  // Update item discount
  const updateItemDiscount = (index, field, value) => {
    const updated = [...cart];
    if (field === 'type') {
      updated[index].itemDiscount.type = value;
    } else if (field === 'value') {
      updated[index].itemDiscount.value = Math.max(0, parseFloat(value) || 0);
    }
    setCart(updated);
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // CALCULATIONS FOR LIVE MULTI-SLAB GST & PROFIT/LOSS WARNING ENGINE
  const grossTotalBeforeDiscount = cart.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * item.unitPrice,
    0
  );

  const totalPurchaseCost = cart.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (item.purchasePrice || 0),
    0
  );

  const totalItemDiscount = cart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const itemSub = qty * item.unitPrice;
    let disc = 0;
    if (item.itemDiscount.type === 'percent') {
      disc = (itemSub * Math.min(100, item.itemDiscount.value)) / 100;
    } else {
      disc = Math.min(itemSub, item.itemDiscount.value);
    }
    return sum + disc;
  }, 0);

  const subtotalAfterItemDiscounts = grossTotalBeforeDiscount - totalItemDiscount;

  let orderDiscountAmount = 0;
  if (orderDiscount.type === 'percent') {
    orderDiscountAmount = (subtotalAfterItemDiscounts * Math.min(100, Math.max(0, orderDiscount.value))) / 100;
  } else {
    orderDiscountAmount = Math.min(subtotalAfterItemDiscounts, Math.max(0, orderDiscount.value));
  }

  const totalCumulativeDiscount = totalItemDiscount + orderDiscountAmount;
  const netAfterAllDiscounts = Math.max(0, grossTotalBeforeDiscount - totalCumulativeDiscount);

  // Multi-Slab GST Aggregation from individual line-items
  const slabMap = {};
  cart.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) return;
    const itemGross = qty * item.unitPrice;
    let disc = 0;
    if (item.itemDiscount.type === 'percent') {
      disc = (itemGross * Math.min(100, item.itemDiscount.value)) / 100;
    } else {
      disc = Math.min(itemGross, item.itemDiscount.value);
    }
    const itemNet = Math.max(0, itemGross - disc);
    const rate = Number(item.gstRate !== undefined ? item.gstRate : 5);
    const taxable = itemNet / (1 + rate / 100);
    const sgst = taxable * (rate / 200);
    const cgst = taxable * (rate / 200);

    if (!slabMap[rate]) {
      slabMap[rate] = { rate, gstBase: 0, sgst: 0, cgst: 0, totalTax: 0, itemsCount: 0 };
    }
    slabMap[rate].gstBase += taxable;
    slabMap[rate].sgst += sgst;
    slabMap[rate].cgst += cgst;
    slabMap[rate].totalTax += (sgst + cgst);
    slabMap[rate].itemsCount += 1;
  });

  const activeSlabs = Object.values(slabMap).sort((a, b) => a.rate - b.rate);
  const totalTaxableValue = activeSlabs.reduce((sum, s) => sum + s.gstBase, 0);
  const totalSgstAmount = activeSlabs.reduce((sum, s) => sum + s.sgst, 0);
  const totalCgstAmount = activeSlabs.reduce((sum, s) => sum + s.cgst, 0);
  const totalGstAmount = totalSgstAmount + totalCgstAmount;

  // Final retail payable amount (GST is informative / included in MRP)
  const rawPayableAmount = netAfterAllDiscounts;
  const finalPayableAmount = Math.round(rawPayableAmount);
  const roundOffAmount = (finalPayableAmount - rawPayableAmount).toFixed(2);

  // Real-time Profit / Loss Margin Calculation
  const estimatedProfitOrLoss = netAfterAllDiscounts - totalPurchaseCost;
  const isLoss = cart.length > 0 && estimatedProfitOrLoss < 0;
  const lossAmount = Math.abs(estimatedProfitOrLoss);

  // Complete Sale Initiator
  const handleInitiateSale = () => {
    if (cart.length === 0) {
      alert('Please add medicines to cart before completing sale.');
      return;
    }

    const activeItems = cart.filter((it) => (Number(it.quantity) || 0) > 0);
    if (activeItems.length === 0) {
      alert('Please enter a billing quantity greater than 0 before completing sale.');
      return;
    }

    if (isLoss) {
      // Trigger Loss Alert Confirmation Modal
      setShowLossModal(true);
    } else {
      executeCheckout();
    }
  };

  // Execute Sale API Request
  const executeCheckout = async () => {
    setShowLossModal(false);
    setErrorMsg('');
    setSubmitting(true);

    try {
      const activeItems = cart
        .filter((it) => (Number(it.quantity) || 0) > 0)
        .map((it) => ({ ...it, quantity: Number(it.quantity) }));

      const payload = {
        customerDetails,
        items: activeItems,
        orderDiscount,
        taxRate,
        paymentMethod,
      };

      const res = await API.post('/orders', payload);
      setCompletedOrder(res.data.order);

      // Reset cart after success
      setCart([]);
      setCustomerDetails({ name: 'Walk-in Customer', phone: '', doctorName: '' });
      setOrderDiscount({ type: 'percent', value: 0 });

      // Refresh inventory list
      fetchMedicines();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to process sale. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShoppingCart className="h-6 w-6 text-cyan-400" />
            Billing & Sales Counter
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Quick retail medicine billing with instant margin calculations</p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* POS MAIN LAYOUT: Left Grid (Inventory & Cart), Right Sidebar (Bill Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Inventory Search & Cart Table (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SEARCH & INVENTORY AUTOCOMPLETE PICKER */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Search & Select Medicine</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type medicine name, generic name, or batch number..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/90 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Quick Medicine Grid */}
            <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {loadingMeds ? (
                <div className="col-span-2 text-center py-4 text-xs text-slate-500">Searching inventory...</div>
              ) : medicines.length === 0 ? (
                <div className="col-span-2 text-center py-4 text-xs text-slate-500">No matching medicines found</div>
              ) : (
                medicines.map((med) => {
                  const isOutOfStock = med.stockQuantity <= 0;

                  return (
                    <button
                      key={med._id}
                      onClick={() => addToCart(med)}
                      disabled={isOutOfStock}
                      className={`flex flex-col justify-between rounded-xl p-3 text-left border transition-all ${
                        isOutOfStock
                          ? 'border-slate-800 bg-slate-950/40 opacity-50 cursor-not-allowed'
                          : 'border-slate-800 bg-slate-950/80 hover:border-cyan-500/50 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-200">{med.name}</p>
                          <p className="text-[10px] text-slate-400">{med.genericName}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-cyan-400 block">₹{med.sellingPrice.toFixed(2)}</span>
                          <span className="text-[9px] text-slate-500 font-mono">Cost: ₹{med.purchasePrice?.toFixed(2) || '0'}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-400">Batch: {med.batchNumber}</span>
                        <span className={`font-semibold ${isOutOfStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isOutOfStock ? 'Out of stock' : `${med.stockQuantity} in stock`}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* DYNAMIC CART TABLE */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing Cart ({cart.length} items)</h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:underline font-medium"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Pill className="h-10 w-10 mx-auto opacity-30 text-cyan-400" />
                <p className="text-xs font-medium">Your cart is empty.</p>
                <p className="text-[11px] text-slate-600">Select medicines from the panel above to build order.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Medicine / Batch</th>
                      <th className="py-2.5 px-2 text-center w-20">Qty</th>
                      <th className="py-2.5 px-2 text-right w-24">Unit Rate</th>
                      <th className="py-2.5 px-2 text-center w-28">GST Slab</th>
                      <th className="py-2.5 px-2 text-center w-28">Line Discount</th>
                      <th className="py-2.5 px-2 text-right w-24">Subtotal</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {cart.map((item, idx) => {
                      const itemSubtotal = (Number(item.quantity) || 0) * item.unitPrice;
                      const itemCost = (Number(item.quantity) || 0) * (item.purchasePrice || 0);

                      let discAmt = 0;
                      if (item.itemDiscount.type === 'percent') {
                        discAmt = (itemSubtotal * Math.min(100, item.itemDiscount.value)) / 100;
                      } else {
                        discAmt = Math.min(itemSubtotal, item.itemDiscount.value);
                      }
                      const netItemSubtotal = Math.max(0, itemSubtotal - discAmt);
                      const itemLoss = itemCost - netItemSubtotal;
                      const isItemLoss = itemLoss > 0 && (Number(item.quantity) || 0) > 0;

                      return (
                        <tr key={item.medicineId} className={`transition-colors ${isItemLoss ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-slate-800/30'}`}>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-white">{item.name}</p>
                              {item.category && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                  item.category.toLowerCase().includes('cosmetic')
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-slate-400 font-mono">Batch: {item.batchNumber}</p>
                              <span className="text-[9px] text-slate-500 font-mono">(Cost: ₹{item.purchasePrice.toFixed(2)})</span>
                            </div>
                          </td>

                          {/* Qty Input */}
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              max={item.stockQuantity}
                              value={item.quantity}
                              placeholder="Qty"
                              onChange={(e) => updateQuantity(idx, e.target.value)}
                              className="w-16 text-center rounded-lg border border-slate-700 bg-slate-950 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-bold font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>

                          <td className="py-3 px-2 text-right font-mono text-slate-300">₹{item.unitPrice.toFixed(2)}</td>

                          {/* Product-Wise GST Rate Selector */}
                          <td className="py-3 px-2 text-center">
                            <select
                              value={item.gstRate}
                              onChange={(e) => updateItemGstRate(idx, e.target.value)}
                              className={`w-full rounded-md border px-1.5 py-1 text-[11px] font-bold font-mono focus:border-cyan-500 focus:outline-none ${
                                Number(item.gstRate) === 18
                                  ? 'border-purple-500/50 bg-purple-950/40 text-purple-300'
                                  : Number(item.gstRate) === 12
                                  ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
                                  : Number(item.gstRate) === 28
                                  ? 'border-rose-500/50 bg-rose-950/40 text-rose-300'
                                  : Number(item.gstRate) === 0
                                  ? 'border-slate-800 bg-slate-950 text-slate-400'
                                  : 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300'
                              }`}
                            >
                              <option value={0}>0% (Exempt)</option>
                              <option value={5}>5% (Regular Meds)</option>
                              <option value={12}>12% (Pharma/Nutra)</option>
                              <option value={18}>18% (Cosmetics/FMCG)</option>
                              <option value={28}>28% (Luxury/Other)</option>
                            </select>
                          </td>

                          {/* Line Item Discount Controls */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1 justify-center">
                              <select
                                value={item.itemDiscount.type}
                                onChange={(e) => updateItemDiscount(idx, 'type', e.target.value)}
                                className="rounded-md border border-slate-800 bg-slate-950 px-1 py-1 text-[10px] text-slate-300"
                              >
                                <option value="flat">₹</option>
                                <option value="percent">%</option>
                              </select>
                              <input
                                type="number"
                                min="0"
                                value={item.itemDiscount.value}
                                onChange={(e) => updateItemDiscount(idx, 'value', e.target.value)}
                                className="w-14 rounded-md border border-slate-800 bg-slate-950 py-1 px-1.5 text-xs text-emerald-400 font-mono focus:border-cyan-500 focus:outline-none"
                              />
                            </div>
                          </td>

                          {/* Net Subtotal & Item-level Loss Badge */}
                          <td className="py-3 px-2 text-right">
                            <p className="font-mono font-bold text-white">₹{netItemSubtotal.toFixed(2)}</p>
                            {isItemLoss && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-400">
                                ⚠️ -₹{itemLoss.toFixed(2)}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => removeFromCart(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CUSTOMER & DOCTOR DETAILS FORM */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer & Prescription Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                    placeholder="Walk-in Customer"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Doctor's Name (Optional)</label>
                <div className="relative">
                  <Stethoscope className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={customerDetails.doctorName}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, doctorName: e.target.value })}
                    placeholder="Dr. Sharma"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FLOATING LIVE BILL BREAKDOWN SIDEBAR (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 sticky top-20 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Live Bill Summary</h2>
              <p className="text-xs text-slate-400">Cumulative pricing & margin engine</p>
            </div>

            {/* Profit / Loss Realtime Badge */}
            {cart.length > 0 && (
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black tracking-wide border ${
                isLoss
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {isLoss ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                {isLoss ? `Loss: -₹${lossAmount.toFixed(2)}` : `Profit: +₹${estimatedProfitOrLoss.toFixed(2)}`}
              </span>
            )}
          </div>

          {/* BEAUTIFUL REAL-TIME LOSS WARNING ALERT BANNER */}
          {isLoss && (
            <div className="rounded-xl bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border-2 border-rose-500/60 p-4 text-xs space-y-2 shadow-lg shadow-rose-950/50">
              <div className="flex items-center justify-between text-rose-300">
                <div className="flex items-center gap-2 font-bold text-rose-200 text-sm">
                  <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
                  <span>LOSS ALERT: Selling Below Cost!</span>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                The applied discounts reduce the order revenue (<strong className="text-white">₹{netAfterAllDiscounts.toFixed(2)}</strong>) below total stock purchase cost (<strong className="text-white">₹{totalPurchaseCost.toFixed(2)}</strong>).
              </p>
              <div className="flex items-center justify-between rounded-lg bg-rose-950/90 p-2 font-semibold text-rose-300 border border-rose-800/80">
                <span>Net Estimated Loss:</span>
                <span className="font-mono text-sm font-black text-rose-400">-₹{lossAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Cart Level Discount Control */}
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Cart / Order Discount</span>
              <span className="text-emerald-400 font-mono">-₹{orderDiscountAmount.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <select
                value={orderDiscount.type}
                onChange={(e) => setOrderDiscount({ ...orderDiscount, type: e.target.value })}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="percent">% Percent Off</option>
                <option value="flat">₹ Flat Off</option>
              </select>
              <input
                type="number"
                min="0"
                value={orderDiscount.value}
                onChange={(e) => setOrderDiscount({ ...orderDiscount, value: Math.max(0, parseFloat(e.target.value) || 0) })}
                placeholder="0"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Product-Wise Multi-Slab GST Live Breakdown Card */}
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                Product-Wise GST Slabs
              </span>
              <span className="font-mono text-cyan-400">{activeSlabs.length} Active Slab{activeSlabs.length !== 1 ? 's' : ''}</span>
            </div>

            {activeSlabs.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">Add items to view automatic product-wise GST breakdown.</p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {activeSlabs.map((s) => (
                  <div key={s.rate} className="rounded-lg bg-slate-900/80 p-2 border border-slate-800/80 text-[11px] space-y-1">
                    <div className="flex justify-between items-center font-bold">
                      <span className={`${
                        s.rate === 18 ? 'text-purple-400' :
                        s.rate === 12 ? 'text-amber-400' :
                        s.rate === 28 ? 'text-rose-400' :
                        s.rate === 0 ? 'text-slate-400' : 'text-cyan-400'
                      }`}>
                        GST {s.rate.toFixed(2)}% Slab ({s.itemsCount} item{s.itemsCount > 1 ? 's' : ''})
                      </span>
                      <span className="text-slate-300 font-mono">₹{s.gstBase.toFixed(2)} Base</span>
                    </div>
                    {s.rate > 0 && (
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono pl-1 border-l border-slate-800">
                        <span>SGST {(s.rate / 2).toFixed(1)}%: ₹{s.sgst.toFixed(2)}</span>
                        <span>CGST {(s.rate / 2).toFixed(1)}%: ₹{s.cgst.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LIVE BILL BREAKDOWN LISTING */}
          <div className="space-y-2 text-xs border-t border-b border-slate-800/80 py-4">
            <div className="flex justify-between text-slate-400">
              <span>Total Gross Amount (MRP):</span>
              <span className="font-mono text-slate-200">₹{grossTotalBeforeDiscount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Total Stock Cost Price:</span>
              <span className="font-mono text-slate-400">₹{totalPurchaseCost.toFixed(2)}</span>
            </div>

            {totalItemDiscount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Total Line-Item Discounts:</span>
                <span className="font-mono text-emerald-400">-₹{totalItemDiscount.toFixed(2)}</span>
              </div>
            )}

            {orderDiscountAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Cart-Level Discount Amount:</span>
                <span className="font-mono text-emerald-400">-₹{orderDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            {totalCumulativeDiscount > 0 && (
              <div className="flex justify-between font-semibold text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <span>Total Cumulative Discount Given:</span>
                <span className="font-mono">-₹{totalCumulativeDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400">
              <span>Total Taxable Value (Base):</span>
              <span className="font-mono text-slate-200">₹{totalTaxableValue.toFixed(2)}</span>
            </div>

            {totalGstAmount > 0 && (
              <>
                <div className="flex justify-between text-slate-400 text-[11px] pl-2 border-l border-slate-800">
                  <span>Total SGST (Mentioned):</span>
                  <span className="font-mono text-cyan-400/80">₹{totalSgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pl-2 border-l border-slate-800">
                  <span>Total CGST (Mentioned):</span>
                  <span className="font-mono text-cyan-400/80">₹{totalCgstAmount.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-slate-400">
              <span>Round Off:</span>
              <span className="font-mono text-slate-300">{roundOffAmount >= 0 ? `+₹${roundOffAmount}` : `-₹${Math.abs(roundOffAmount)}`}</span>
            </div>

            <div className="flex justify-between text-lg font-black text-white pt-2 border-t border-slate-800">
              <span>Final Net Payable:</span>
              <span className="font-mono text-cyan-400">₹{finalPayableAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Cash', icon: Banknote },
                { id: 'UPI', icon: QrCode },
                { id: 'Card', icon: CreditCard },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{pm.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COMPLETE SALE BUTTON */}
          <button
            onClick={handleInitiateSale}
            disabled={submitting || cart.length === 0}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white shadow-xl transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 ${
              isLoss
                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 shadow-rose-600/30 ring-2 ring-rose-500/50 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/25'
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Processing Transaction...
              </span>
            ) : isLoss ? (
              <>
                <ShieldAlert className="h-5 w-5" />
                <span>Review & Complete Loss Sale (₹{finalPayableAmount.toFixed(2)})</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Complete Sale (₹{finalPayableAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LOSS WARNING CONFIRMATION MODAL */}
      {showLossModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border-2 border-rose-500/80 bg-slate-900 p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-rose-400">
                <div className="rounded-xl bg-rose-500/20 p-2 border border-rose-500/30">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-white">Below Cost Sale Warning!</h3>
              </div>
              <button onClick={() => setShowLossModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-rose-950/40 p-4 border border-rose-800/60 space-y-3 text-xs">
              <p className="text-rose-200 font-medium">
                The total discount applied on this sale causes the net bill revenue to fall below the wholesale purchase cost of the medicines.
              </p>

              <div className="space-y-1.5 font-mono pt-1">
                <div className="flex justify-between text-slate-300">
                  <span>Total Purchase Cost:</span>
                  <span>₹{totalPurchaseCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Net Revenue (After Discount):</span>
                  <span>₹{netAfterAllDiscounts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-rose-400 pt-2 border-t border-rose-800">
                  <span>Net Estimated Business Loss:</span>
                  <span>-₹{lossAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Would you like to adjust the discount amount or proceed with completing this loss sale anyway?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLossModal(false)}
                className="flex-1 rounded-xl bg-slate-800 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
              >
                Go Back & Lower Discount
              </button>
              <button
                type="button"
                onClick={executeCheckout}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-3 text-xs font-black text-white shadow-lg shadow-rose-600/30 hover:brightness-110 transition-all"
              >
                Proceed With Loss Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE RECEIPT MODAL */}
      {completedOrder && (
        <InvoiceModal order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}
    </div>
  );
};

export default POS;
