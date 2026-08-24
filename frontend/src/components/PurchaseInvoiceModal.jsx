import React from 'react';
import {
  X,
  Printer,
  Building2,
  Phone,
  Calendar,
  Package,
  FileText,
  Truck,
  Sparkles,
  User,
} from 'lucide-react';

const PurchaseInvoiceModal = ({ purchase, onClose }) => {
  if (!purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = purchase.purchaseDate
    ? new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date(purchase.createdAt).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 shadow-lg shadow-cyan-500/20 text-white">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Purchase Invoice Voucher</h2>
                <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  {purchase.invoiceNumber ? `Inv: ${purchase.invoiceNumber}` : purchase.purchaseNumber}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    purchase.source === 'ocr_scan'
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {purchase.source === 'ocr_scan' ? 'AI OCR Scan' : 'Manual Entry'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Recorded on {formattedDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* VENDOR & RECIPIENT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor / Supplier */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Truck className="h-4 w-4" />
                <span>Supplier / Distributor Info</span>
              </div>
              <p className="text-sm font-black text-white">{purchase.supplier?.name || 'General Supplier'}</p>
              {purchase.supplier?.contact ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{purchase.supplier.contact}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No contact provided</p>
              )}
            </div>

            {/* Shopkeeper Branch */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Building2 className="h-4 w-4" />
                <span>Receiving Pharmacy Branch</span>
              </div>
              <p className="text-sm font-black text-white">
                {purchase.shopkeeperId?.shopName || 'Main Store'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span>Logged by: {purchase.shopkeeperId?.name || 'Shopkeeper'}</span>
              </div>
            </div>
          </div>

          {/* ITEM LIST TABLE */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-md">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Purchased Medicines ({purchase.items?.length || 0} items)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Total Units: <strong className="text-white">{purchase.totalQuantity}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">Medicine Name</th>
                    <th className="p-3.5">Batch #</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Buy Price</th>
                    <th className="p-3.5 text-right">Sell Price</th>
                    <th className="p-3.5 text-center">Qty</th>
                    <th className="p-3.5">Expiry</th>
                    <th className="p-3.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {purchase.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-white">{item.name}</p>
                        {item.genericName && (
                          <p className="text-[10px] text-slate-400">{item.genericName}</p>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-cyan-400 font-medium">
                        {item.batchNumber}
                      </td>
                      <td className="p-3.5">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-300">
                        ₹{item.purchasePrice?.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-400 font-semibold">
                        ₹{item.sellingPrice?.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-white">
                        {item.quantity}
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-cyan-400">
                        ₹{item.subtotal?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS BAR */}
            <div className="bg-slate-900/90 p-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                <span>System Purchase ID: </span>
                <span className="font-mono text-slate-300 font-medium">{purchase.purchaseNumber}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Bill Cost:</span>
                <span className="font-mono text-xl font-black text-white bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                  ₹{purchase.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            Close
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
          >
            <Printer className="h-4 w-4" />
            Print Voucher
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoiceModal;
