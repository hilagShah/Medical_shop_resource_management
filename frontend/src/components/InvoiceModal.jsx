import React, { useState } from 'react';
import { Printer, X, CheckCircle, FileText, Building2, Phone, Calendar, Download, Edit3 } from 'lucide-react';
import { numberToWords } from '../utils/numberToWords';

const InvoiceModal = ({ order, onClose }) => {
  if (!order) return null;

  const [pharmacyDetails, setPharmacyDetails] = useState({
    name: order.shopkeeperId?.shopName || 'UMA PHARMACY',
    address: '17, SWASTIK SOPAN-1, OPP. SARTHAK SHREENAND FLAT, NR BANK OF INDIA, SMS ROAD, RAYSAN, GANDHINAGAR-382007',
    fssaiLic: '20725009001925',
    gstin: '24AAIFU7369Q1Z7',
    dlNo1: '20 247971, 20B 247973',
    dlNo2: '21 247972, 21B 247974',
    pharmacist1: 'PRAVIN B PATEL (PHARMACIST)',
    pharmacist2: 'DR VRUDDHI PATEL (PHARMACIST)',
    customerCare: '079 3520 7999',
  });

  const [showEditHeader, setShowEditHeader] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  // Tax and GST Calculations
  const taxRate = order.taxRate !== undefined ? Number(order.taxRate) : (order.tax > 0 && order.grossTotalBeforeDiscount > 0 ? Number(((order.tax / (order.grossTotalBeforeDiscount - order.totalCumulativeDiscount)) * 100).toFixed(2)) : 5);
  const sgstRate = (taxRate / 2).toFixed(2);
  const cgstRate = (taxRate / 2).toFixed(2);

  // Total taxable base and tax values
  const grossTotal = order.grossTotalBeforeDiscount || 0;
  const totalDiscount = order.totalCumulativeDiscount || 0;
  const taxableValue = Math.max(0, grossTotal - totalDiscount);
  const taxAmount = order.tax || ((taxableValue * taxRate) / 100);
  const sgstAmount = taxAmount / 2;
  const cgstAmount = taxAmount / 2;
  const rawFinalAmount = taxableValue + taxAmount;
  const roundedFinalAmount = Math.round(rawFinalAmount);
  const roundOff = (roundedFinalAmount - rawFinalAmount).toFixed(2);

  const orderDate = new Date(order.createdAt || Date.now());
  const formattedDate = `${orderDate.toLocaleDateString('en-GB')} ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 backdrop-blur-md overflow-y-auto print:static print:bg-transparent print:p-0 print:m-0 print:overflow-visible print:inset-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-6 shadow-2xl my-auto max-h-[95vh] overflow-y-auto text-slate-100 print:static print:border-none print:shadow-none print:bg-transparent print:p-0 print:m-0 print:max-h-none print:overflow-visible">
        
        {/* MODAL ACTION BAR (Hidden during print) */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-base font-bold text-white">Tax Invoice Ready for Print / PDF Export</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditHeader(!showEditHeader)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{showEditHeader ? 'Hide Header Settings' : 'Edit Header Info'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 hover:brightness-110 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* HEADER SETTINGS ACCORDION */}
        {showEditHeader && (
          <div className="no-print mb-6 rounded-xl bg-slate-950/90 p-4 border border-slate-800 space-y-3 text-xs">
            <p className="font-bold text-cyan-400 uppercase tracking-wider">Pharmacy Header & License Settings</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Pharmacy Name</label>
                <input
                  type="text"
                  value={pharmacyDetails.name}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">Address</label>
                <input
                  type="text"
                  value={pharmacyDetails.address}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">GSTIN</label>
                <input
                  type="text"
                  value={pharmacyDetails.gstin}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, gstin: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">FSSAI Lic No.</label>
                <input
                  type="text"
                  value={pharmacyDetails.fssaiLic}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, fssaiLic: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">DL No. (20, 20B)</label>
                <input
                  type="text"
                  value={pharmacyDetails.dlNo1}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, dlNo1: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">DL No. (21, 21B)</label>
                <input
                  type="text"
                  value={pharmacyDetails.dlNo2}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, dlNo2: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Pharmacist 1</label>
                <input
                  type="text"
                  value={pharmacyDetails.pharmacist1}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, pharmacist1: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Pharmacist 2</label>
                <input
                  type="text"
                  value={pharmacyDetails.pharmacist2}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, pharmacist2: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AUTHENTIC PRINTABLE TAX INVOICE CASH MEMO CONTAINER                       */}
        {/* ========================================================================= */}
        <div
          id="printable-invoice"
          className="bg-white text-black p-4 sm:p-6 rounded-md shadow-lg font-sans border border-black max-w-4xl mx-auto text-[11px] leading-tight"
          style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
        >
          {/* TOP PHARMACY HEADER */}
          <div className="text-center border-b border-black pb-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase">{pharmacyDetails.name}</h1>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-800 mt-0.5">{pharmacyDetails.address}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 text-[9.5px] font-semibold text-gray-800 mt-1">
              <span>FSSAI LIC: {pharmacyDetails.fssaiLic}</span>
              <span>GST Tin: {pharmacyDetails.gstin}</span>
              <span>DL NO: {pharmacyDetails.dlNo1}</span>
              <span>DL NO: {pharmacyDetails.dlNo2}</span>
            </div>
          </div>

          {/* INVOICE TITLE & META DETAILS */}
          <div className="border border-black mb-2">
            {/* Header Title Row */}
            <div className="flex justify-between items-center bg-gray-100 px-3 py-1 border-b border-black text-[11px] font-bold">
              <span className="uppercase">TAX INVOICE</span>
              <span className="uppercase">CASH MEMO</span>
              <span className="uppercase">ORIGINAL</span>
            </div>

            {/* Bill Meta Data Grid */}
            <div className="grid grid-cols-2 p-2 gap-y-1 text-[10.5px]">
              <div>
                <p><strong>Customer :</strong> <span className="uppercase">{order.customerDetails?.name || 'KSAILASH SHARMA'}</span></p>
                <p><strong>Doctor :</strong> <span className="uppercase">{order.customerDetails?.doctorName ? `DR ${order.customerDetails.doctorName}` : 'DR NILAY MEHTA'}</span></p>
                {order.customerDetails?.phone && <p><strong>Mobile :</strong> {order.customerDetails.phone}</p>}
              </div>
              <div className="text-right">
                <p><strong>Bill No :</strong> <span className="font-mono font-bold">{order.orderNumber || 'D71'}</span></p>
                <p><strong>Date :</strong> {formattedDate}</p>
                <p><strong>Payment :</strong> {order.paymentMethod || 'Cash'}</p>
              </div>
            </div>
          </div>

          {/* LINE ITEMS TABLE */}
          <table className="w-full border-collapse border border-black text-[9.5px] mb-2 text-center">
            <thead>
              <tr className="bg-gray-100 font-bold border-b border-black text-gray-900">
                <th className="border-r border-black p-1 w-6">Sr.</th>
                <th className="border-r border-black p-1 text-left">Description</th>
                <th className="border-r border-black p-1 w-12">HSN</th>
                <th className="border-r border-black p-1 w-14">BatchNo</th>
                <th className="border-r border-black p-1 w-12">ExpDt</th>
                <th className="border-r border-black p-1 w-8">Unit</th>
                <th className="border-r border-black p-1 w-14 text-right">M.R.P.</th>
                <th className="border-r border-black p-1 w-8">Qty</th>
                <th className="border-r border-black p-1 w-14 text-right">Sale Rate</th>
                <th className="border-r border-black p-1 w-10 text-right">Disc%</th>
                <th className="border-r border-black p-1 w-16 text-right">Taxable</th>
                <th className="border-r border-black p-1 w-10 text-right">SGST%</th>
                <th className="border-r border-black p-1 w-12 text-right">SGST ₹</th>
                <th className="border-r border-black p-1 w-10 text-right">CGST%</th>
                <th className="border-r border-black p-1 w-12 text-right">CGST ₹</th>
                <th className="p-1 w-16 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => {
                const itemQty = item.quantity || 1;
                const unitPrice = item.unitPrice || 0;
                const lineGross = itemQty * unitPrice;
                const itemDiscAmt = item.itemDiscount?.amount || 0;
                const lineNet = Math.max(0, lineGross - itemDiscAmt);
                const discPercent = lineGross > 0 ? ((itemDiscAmt / lineGross) * 100).toFixed(2) : '0.00';
                
                // Individual item tax split
                const itemSgst = (lineNet * (taxRate / 200)).toFixed(2);
                const itemCgst = (lineNet * (taxRate / 200)).toFixed(2);
                const itemTotalAmount = (lineNet + Number(itemSgst) + Number(itemCgst)).toFixed(2);

                const expStr = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) : '06/27';

                return (
                  <tr key={idx} className="border-b border-black/60">
                    <td className="border-r border-black p-1 font-medium">{idx + 1}</td>
                    <td className="border-r border-black p-1 text-left font-bold uppercase truncate max-w-[140px]">
                      {item.name}
                    </td>
                    <td className="border-r border-black p-1 font-mono">{item.hsnCode || '300410'}</td>
                    <td className="border-r border-black p-1 font-mono font-semibold">{item.batchNumber || '063A'}</td>
                    <td className="border-r border-black p-1 font-mono">{expStr}</td>
                    <td className="border-r border-black p-1">{item.unit || itemQty}</td>
                    <td className="border-r border-black p-1 text-right font-mono">{unitPrice.toFixed(2)}</td>
                    <td className="border-r border-black p-1 font-bold">{itemQty}</td>
                    <td className="border-r border-black p-1 text-right font-mono">{(lineNet / itemQty).toFixed(2)}</td>
                    <td className="border-r border-black p-1 text-right font-mono">{discPercent}</td>
                    <td className="border-r border-black p-1 text-right font-mono font-medium">{lineNet.toFixed(2)}</td>
                    <td className="border-r border-black p-1 text-right font-mono">{sgstRate}</td>
                    <td className="border-r border-black p-1 text-right font-mono">{itemSgst}</td>
                    <td className="border-r border-black p-1 text-right font-mono">{cgstRate}</td>
                    <td className="border-r border-black p-1 text-right font-mono">{itemCgst}</td>
                    <td className="p-1 text-right font-mono font-bold">{itemTotalAmount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* GST BREAKDOWN & SUMMARY FOOTER TABLE */}
          <div className="border border-black mb-2">
            <div className="grid grid-cols-7 border-b border-black text-[9.5px] font-bold bg-gray-50 text-center">
              <div className="border-r border-black p-1">GST %</div>
              <div className="border-r border-black p-1">GST Base</div>
              <div className="border-r border-black p-1">SGST</div>
              <div className="border-r border-black p-1">CGST</div>
              <div className="border-r border-black p-1">IGST</div>
              <div className="border-r border-black p-1">OTHER +/-</div>
              <div className="p-1">ROUND OFF</div>
            </div>
            <div className="grid grid-cols-7 text-[10px] font-mono text-center py-1">
              <div className="border-r border-black">{taxRate.toFixed(2)}%</div>
              <div className="border-r border-black">{taxableValue.toFixed(2)}</div>
              <div className="border-r border-black">{sgstAmount.toFixed(2)}</div>
              <div className="border-r border-black">{cgstAmount.toFixed(2)}</div>
              <div className="border-r border-black">0.00</div>
              <div className="border-r border-black">0.00</div>
              <div className="font-bold">{roundOff}</div>
            </div>
          </div>

          {/* NET AMOUNT & WORDS BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-2 border-black p-2 mb-3 gap-2 bg-gray-50">
            <div>
              <p className="text-[11px] font-bold">
                {numberToWords(roundedFinalAmount)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black tracking-wider uppercase mr-2">NET :</span>
              <span className="text-xl font-black font-mono tracking-tight">₹{roundedFinalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* SIGNATURES & LEGAL DISCLAIMER */}
          <div className="grid grid-cols-2 pt-2 border-t border-black text-[10px]">
            <div>
              <p className="font-bold">FOR: {pharmacyDetails.name}</p>
              <p className="mt-1">{pharmacyDetails.pharmacist1}</p>
              <p>{pharmacyDetails.pharmacist2}</p>
            </div>
            <div className="text-right flex flex-col justify-between">
              <div>
                <p className="font-semibold">USER: {order.shopkeeperId?.name || 'ADMIN'}</p>
                <p className="text-[9px] font-mono mt-1">E. & O. E.</p>
              </div>
              <div className="pt-6">
                <span className="border-t border-black px-4 font-semibold text-[9.5px]">Authorised Signatory</span>
              </div>
            </div>
          </div>

          {/* FOOTER SYSTEM TAG */}
          <div className="mt-3 pt-1 border-t border-gray-300 text-center text-[8.5px] text-gray-600">
            Software by MEDICAL SHOP MANAGEMENT : Customer Care No: {pharmacyDetails.customerCare}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
