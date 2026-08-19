import React, { useState } from 'react';
import { Printer, X, CheckCircle, Edit3 } from 'lucide-react';
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

  // Tax and GST Calculations
  const taxRate = order.taxRate !== undefined ? Number(order.taxRate) : (order.tax > 0 && order.grossTotalBeforeDiscount > 0 ? Number(((order.tax / (order.grossTotalBeforeDiscount - order.totalCumulativeDiscount)) * 100).toFixed(2)) : 5);
  const sgstRate = (taxRate / 2).toFixed(2);
  const cgstRate = (taxRate / 2).toFixed(2);

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

  // Robust isolated iframe printing to guarantee a single-page A4 Landscape output
  const handlePrint = () => {
    const invoiceEl = document.getElementById('printable-invoice');
    if (!invoiceEl) return;

    // Remove any existing print iframe
    const existingIframe = document.getElementById('print-iframe');
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${order.orderNumber || 'Bill'}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 5mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff;
              color: #000000;
              padding: 0;
              margin: 0;
              font-size: 9.5px;
              line-height: 1.15;
            }
            .invoice-wrapper {
              width: 100%;
              max-width: 100%;
              border: 1.5px solid #000;
              padding: 6px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .header-center {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 3px;
              margin-bottom: 4px;
            }
            .shop-title {
              font-size: 16px;
              font-weight: 900;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .shop-sub {
              font-size: 8.5px;
              color: #222;
              margin-top: 1px;
            }
            .licenses-row {
              display: flex;
              justify-content: center;
              gap: 12px;
              font-size: 8px;
              font-weight: bold;
              margin-top: 2px;
            }
            .meta-box {
              border: 1px solid #000;
              margin-bottom: 4px;
            }
            .meta-title-bar {
              display: flex;
              justify-content: space-between;
              background: #f3f4f6;
              padding: 2px 6px;
              border-bottom: 1px solid #000;
              font-weight: bold;
              font-size: 9px;
            }
            .meta-grid {
              display: flex;
              justify-content: space-between;
              padding: 3px 6px;
              font-size: 9px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000;
              font-size: 8.5px;
              margin-bottom: 4px;
            }
            th, td {
              border: 1px solid #000;
              padding: 2.5px 3px;
              text-align: center;
            }
            th {
              background: #f3f4f6 !important;
              font-weight: bold;
            }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            .gst-summary-grid {
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              border: 1px solid #000;
              text-align: center;
              font-size: 8.5px;
              margin-bottom: 4px;
            }
            .gst-summary-grid > div {
              border-right: 1px solid #000;
              padding: 2px 3px;
            }
            .gst-summary-grid > div:last-child {
              border-right: none;
            }
            .gst-header {
              background: #f9fafb;
              font-weight: bold;
              border-bottom: 1px solid #000;
            }
            .net-amount-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border: 1.5px solid #000;
              background: #f9fafb;
              padding: 4px 8px;
              margin-bottom: 4px;
            }
            .signatures-row {
              display: flex;
              justify-content: space-between;
              padding-top: 2px;
              font-size: 8.5px;
            }
            .footer-tag {
              border-top: 1px solid #ccc;
              margin-top: 4px;
              padding-top: 2px;
              text-align: center;
              font-size: 7.5px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            ${invoiceEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-6 shadow-2xl my-auto max-h-[95vh] overflow-y-auto text-slate-100">
        
        {/* MODAL ACTION BAR */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-base font-bold text-white">Tax Invoice (A4 Landscape Print Format)</span>
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
              <span>Print Invoice (Landscape PDF)</span>
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
        {/* AUTHENTIC TAX INVOICE CASH MEMO (LANDSCAPE A4 PREVIEW)                    */}
        {/* ========================================================================= */}
        <div
          id="printable-invoice"
          className="bg-white text-black p-4 sm:p-5 rounded-md shadow-lg font-sans border border-black max-w-5xl mx-auto text-[10.5px] leading-tight"
          style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
        >
          {/* TOP PHARMACY HEADER */}
          <div className="header-center text-center border-b border-black pb-1.5 mb-2">
            <h1 className="shop-title text-xl sm:text-2xl font-black tracking-wider uppercase">{pharmacyDetails.name}</h1>
            <p className="shop-sub text-[10px] font-medium text-gray-800 mt-0.5">{pharmacyDetails.address}</p>
            <div className="licenses-row flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 text-[9px] font-semibold text-gray-800 mt-1">
              <span>FSSAI LIC: {pharmacyDetails.fssaiLic}</span>
              <span>GST Tin: {pharmacyDetails.gstin}</span>
              <span>DL NO: {pharmacyDetails.dlNo1}</span>
              <span>DL NO: {pharmacyDetails.dlNo2}</span>
            </div>
          </div>

          {/* INVOICE TITLE & META DETAILS */}
          <div className="meta-box border border-black mb-2">
            <div className="meta-title-bar flex justify-between items-center bg-gray-100 px-3 py-0.5 border-b border-black text-[10px] font-bold">
              <span className="uppercase">TAX INVOICE</span>
              <span className="uppercase">CASH MEMO</span>
              <span className="uppercase">ORIGINAL</span>
            </div>

            <div className="meta-grid grid grid-cols-2 p-1.5 gap-y-1 text-[9.5px]">
              <div>
                <p><strong>Customer :</strong> <span className="uppercase">{order.customerDetails?.name || 'WALK-IN CUSTOMER'}</span></p>
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
          <table className="w-full border-collapse border border-black text-[9px] mb-2 text-center">
            <thead>
              <tr className="bg-gray-100 font-bold border-b border-black text-gray-900">
                <th className="border-r border-black p-1 w-6">Sr.</th>
                <th className="border-r border-black p-1 text-left">Description</th>
                <th className="border-r border-black p-1 w-12">HSN</th>
                <th className="border-r border-black p-1 w-16">BatchNo</th>
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
                
                const itemSgst = (lineNet * (taxRate / 200)).toFixed(2);
                const itemCgst = (lineNet * (taxRate / 200)).toFixed(2);
                const itemTotalAmount = (lineNet + Number(itemSgst) + Number(itemCgst)).toFixed(2);

                const expStr = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) : '06/27';

                return (
                  <tr key={idx} className="border-b border-black/60">
                    <td className="border-r border-black p-1 font-medium">{idx + 1}</td>
                    <td className="border-r border-black p-1 text-left font-bold uppercase truncate max-w-[160px]">
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
          <div className="gst-summary-grid border border-black mb-2">
            <div className="gst-header grid grid-cols-7 border-b border-black text-[9px] font-bold bg-gray-50 text-center">
              <div className="border-r border-black p-1">GST %</div>
              <div className="border-r border-black p-1">GST Base</div>
              <div className="border-r border-black p-1">SGST</div>
              <div className="border-r border-black p-1">CGST</div>
              <div className="border-r border-black p-1">IGST</div>
              <div className="border-r border-black p-1">OTHER +/-</div>
              <div className="p-1">ROUND OFF</div>
            </div>
            <div className="grid grid-cols-7 text-[9px] font-mono text-center py-0.5">
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
          <div className="net-amount-bar flex justify-between items-center border-2 border-black p-1.5 mb-2 bg-gray-50 text-[10px]">
            <div>
              <p className="font-bold">
                {numberToWords(roundedFinalAmount)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black tracking-wider uppercase mr-2">NET :</span>
              <span className="text-lg font-black font-mono tracking-tight">₹{roundedFinalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* SIGNATURES & LEGAL DISCLAIMER */}
          <div className="signatures-row flex justify-between pt-1 border-t border-black text-[9px]">
            <div>
              <p className="font-bold">FOR: {pharmacyDetails.name}</p>
              <p className="mt-0.5">{pharmacyDetails.pharmacist1}</p>
              <p>{pharmacyDetails.pharmacist2}</p>
            </div>
            <div className="text-right flex flex-col justify-between">
              <div>
                <p className="font-semibold">USER: {order.shopkeeperId?.name || 'ADMIN'}</p>
                <p className="text-[8px] font-mono">E. & O. E.</p>
              </div>
              <div className="pt-4">
                <span className="border-t border-black px-4 font-semibold text-[8.5px]">Authorised Signatory</span>
              </div>
            </div>
          </div>

          {/* FOOTER SYSTEM TAG */}
          <div className="footer-tag mt-2 pt-1 border-t border-gray-300 text-center text-[8px] text-gray-600">
            Software by MEDICAL SHOP MANAGEMENT : Customer Care No: {pharmacyDetails.customerCare}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
