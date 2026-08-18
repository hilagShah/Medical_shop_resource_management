import React from 'react';
import { Printer, X, CheckCircle, Receipt, Building2, Phone, Calendar } from 'lucide-react';

const InvoiceModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const shopkeeperName = order.shopkeeperId?.name || 'Authorized Staff';
  const shopName = order.shopkeeperId?.shopName || 'HealthCare Pharmacy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Modal Controls (Hidden during print) */}
        <div className="no-print mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <CheckCircle className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">Transaction Completed</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-cyan-500 shadow-md shadow-cyan-600/20"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 p-2 text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div id="printable-invoice" className="bg-white text-slate-900 p-6 rounded-xl shadow-inner text-sm">
          {/* Receipt Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-cyan-700" />
                <h1 className="text-xl font-bold text-slate-900 tracking-wide">{shopName}</h1>
              </div>
              <p className="text-xs text-slate-600 mt-1">Medical Shop & General Pharmacy</p>
              <p className="text-xs text-slate-500">Billed by: {shopkeeperName}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded font-mono font-bold border border-slate-300">
                {order.orderNumber}
              </span>
              <p className="text-xs text-slate-500 mt-2">
                Date: {new Date(order.createdAt || Date.now()).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-medium">Payment: {order.paymentMethod}</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Customer Name:</p>
              <p className="font-semibold text-slate-800">{order.customerDetails?.name || 'Walk-in Customer'}</p>
              {order.customerDetails?.phone && (
                <p className="text-slate-600 font-mono">Ph: {order.customerDetails.phone}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500 font-medium">Prescribed Doctor:</p>
              <p className="font-semibold text-slate-800">
                {order.customerDetails?.doctorName ? `Dr. ${order.customerDetails.doctorName}` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left text-xs mb-4">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-2 px-2">Item / Batch</th>
                <th className="py-2 px-1 text-center">Qty</th>
                <th className="py-2 px-2 text-right">Price</th>
                <th className="py-2 px-2 text-right">Disc</th>
                <th className="py-2 px-2 text-right">Net Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-2">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Batch: {item.batchNumber}</p>
                  </td>
                  <td className="py-2 px-1 text-center font-medium">{item.quantity}</td>
                  <td className="py-2 px-2 text-right font-mono">₹{item.unitPrice?.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right text-emerald-700 font-medium">
                    {item.itemDiscount?.amount > 0 ? `-₹${item.itemDiscount.amount.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-semibold font-mono">
                    ₹{item.subtotalAfterDiscount?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bill Breakdown Summary */}
          <div className="border-t-2 border-slate-300 pt-3 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Gross Total (Before Discount):</span>
              <span className="font-mono">₹{order.grossTotalBeforeDiscount?.toFixed(2)}</span>
            </div>

            {order.totalItemDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Line-Item Discounts:</span>
                <span className="font-mono">-₹{order.totalItemDiscount?.toFixed(2)}</span>
              </div>
            )}

            {order.orderDiscount?.amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Cart Level Discount ({order.orderDiscount.type === 'percent' ? `${order.orderDiscount.value}%` : `₹${order.orderDiscount.value}`}):</span>
                <span className="font-mono">-₹{order.orderDiscount.amount?.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
              <span>Total Savings Granted:</span>
              <span className="font-mono">₹{order.totalCumulativeDiscount?.toFixed(2)}</span>
            </div>

            {order.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax / GST:</span>
                <span className="font-mono">+₹{order.tax?.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-slate-900 border-t-2 border-slate-400 pt-2 mt-2">
              <span>Final Net Amount Payable:</span>
              <span className="font-mono text-cyan-800">₹{order.finalAmount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">Thank you for choosing {shopName}!</p>
            <p>Please consult your physician before consuming prescription medications.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
