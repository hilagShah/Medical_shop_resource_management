import React, { useState } from 'react';
import { Printer, X, CheckCircle, Edit3 } from 'lucide-react';
import { numberToWords } from '../utils/numberToWords';

const InvoiceModal = ({ order, onClose }) => {
  if (!order) return null;

  const [pharmacyDetails, setPharmacyDetails] = useState({
    name: order.shopkeeperId?.shopName || 'KEYUR MEDICAL & PROVISION STORE',
    address: '16, Tapovan Society, Anil mill road, Saraspur, Ahmedabad',
    regNo: 'Registration No.PI/SRS/00/0007549',
    gstin: '24ACTPP7760K1ZT',
    dlNo1: '20GAA-1482,20 B GAA-5112',
    dlNo2: '21 GAA-1485,21 B GAA-5000',
    pharmacist: 'PRAVIN B. PATEL (PHARMACIST)',
    paymentDisclaimer: 'CASH & DEBIT CARDS & PAYTM ARE ACCEPTED',
  });

  const [showEditHeader, setShowEditHeader] = useState(false);

  // Tax and GST Calculations (5% default standard GST in Indian Pharmacy)
  const taxRate = order.taxRate !== undefined && order.taxRate !== null && Number(order.taxRate) > 0 ? Number(order.taxRate) : 5.0;
  const sgstRateNum = taxRate / 2;
  const cgstRateNum = taxRate / 2;
  const sgstRateStr = sgstRateNum.toFixed(2);
  const cgstRateStr = cgstRateNum.toFixed(2);

  // Date formatted as DD/MM/YYYY
  const orderDate = new Date(order.createdAt || Date.now());
  const day = String(orderDate.getDate()).padStart(2, '0');
  const month = String(orderDate.getMonth() + 1).padStart(2, '0');
  const year = orderDate.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  // Item Calculations
  let totalUnits = 0;
  let totalTaxableVal = 0;
  let totalSgstVal = 0;
  let totalCgstVal = 0;
  let grossTotalVal = 0;

  const calculatedItems = (order.items || []).map((item, idx) => {
    const itemQty = item.quantity || 1;
    const unitPrice = item.unitPrice || 0; // MRP
    const lineGross = itemQty * unitPrice;
    const itemDiscAmt = item.itemDiscount?.amount || 0;
    const lineNet = Math.max(0, lineGross - itemDiscAmt);
    const discPercent = lineGross > 0 ? ((itemDiscAmt / lineGross) * 100).toFixed(2) : '0.00';
    const saleRatePerUnit = (lineNet / itemQty).toFixed(2);

    // Product-Wise GST (e.g. 5% for regular meds, 18% for cosmetics)
    const itemGstRate = item.gstRate !== undefined ? Number(item.gstRate) : (order.taxRate !== undefined ? Number(order.taxRate) : 5.0);
    const itemSgstRate = (itemGstRate / 2).toFixed(2);
    const itemCgstRate = (itemGstRate / 2).toFixed(2);

    // Standard Reverse GST Calculation for MRP inclusive pricing
    const itemTaxable = lineNet / (1 + itemGstRate / 100);
    const itemSgst = itemTaxable * (itemGstRate / 200);
    const itemCgst = itemTaxable * (itemGstRate / 200);

    totalUnits += itemQty;
    totalTaxableVal += itemTaxable;
    totalSgstVal += itemSgst;
    totalCgstVal += itemCgst;
    grossTotalVal += lineNet;

    const expStr = item.expiryDate
      ? new Date(item.expiryDate).toLocaleDateString('en-GB', {
          month: '2-digit',
          year: '2-digit',
        })
      : '03/27';

    return {
      sr: idx + 1,
      name: item.name,
      hsnCode: item.hsnCode || '3004',
      batchNumber: item.batchNumber || '',
      expDate: expStr,
      unit: item.unit || 1,
      mrp: unitPrice.toFixed(2),
      qty: itemQty,
      saleRate: saleRatePerUnit,
      discPercent,
      gstRate: itemGstRate,
      taxableValue: itemTaxable.toFixed(2),
      sgstRate: itemSgstRate,
      sgstValue: itemSgst.toFixed(2),
      cgstRate: itemCgstRate,
      cgstValue: itemCgst.toFixed(2),
      amount: lineNet.toFixed(2),
    };
  });

  // Multi-Slab GST Aggregation
  const slabMap = {};
  calculatedItems.forEach((it) => {
    const rate = it.gstRate;
    if (!slabMap[rate]) {
      slabMap[rate] = { slab: rate, gstBase: 0, sgst: 0, cgst: 0 };
    }
    slabMap[rate].gstBase += parseFloat(it.taxableValue);
    slabMap[rate].sgst += parseFloat(it.sgstValue);
    slabMap[rate].cgst += parseFloat(it.cgstValue);
  });
  const displaySlabs = Object.values(slabMap).sort((a, b) => a.slab - b.slab);

  const rawFinalAmount = grossTotalVal;
  const roundedFinalAmount = order.finalAmount !== undefined && order.finalAmount !== null ? order.finalAmount : Math.round(rawFinalAmount);
  const roundOff = (roundedFinalAmount - rawFinalAmount).toFixed(2);

  // Clean doctor name
  const rawDoctor = order.customerDetails?.doctorName || 'GRISHMA PATEL';
  const cleanDoctor = rawDoctor.toUpperCase().startsWith('DR') ? rawDoctor.toUpperCase().replace(/,\s*$/, '') : `DR ${rawDoctor.toUpperCase().replace(/,\s*$/, '')}`;

  // Robust isolated iframe printing for A4 Landscape
  const handlePrint = () => {
    const invoiceEl = document.getElementById('printable-invoice');
    if (!invoiceEl) return;

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
          <title>Cash Memo - ${order.orderNumber || 'Invoice'}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 4mm;
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
              font-size: 8.5px;
              line-height: 1.15;
            }
            .invoice-wrapper {
              width: 100%;
              border: 1.5px solid #000;
              padding: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #000;
              padding: 2px 3px;
            }
            th {
              background: #f4f4f4 !important;
              font-weight: bold;
              text-align: center;
            }
            .text-left { text-align: left !important; }
            .text-right { text-align: right !important; }
            .text-center { text-align: center !important; }
            .font-bold { font-weight: bold !important; }
            .font-mono { font-family: monospace !important; }
            .no-border-table td, .no-border-table th {
              border: none !important;
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
      <div className="relative w-full max-w-6xl rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-6 shadow-2xl my-auto max-h-[95vh] overflow-y-auto text-slate-100">
        
        {/* MODAL ACTION BAR */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-base font-bold text-white">Invoice Cash Memo (Authentic A4 Landscape)</span>
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
                <label className="text-[11px] text-slate-400 block mb-1">Registration No.</label>
                <input
                  type="text"
                  value={pharmacyDetails.regNo}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, regNo: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">GST Tin</label>
                <input
                  type="text"
                  value={pharmacyDetails.gstin}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, gstin: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">D.L. No. 1</label>
                <input
                  type="text"
                  value={pharmacyDetails.dlNo1}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, dlNo1: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">D.L. No. 2</label>
                <input
                  type="text"
                  value={pharmacyDetails.dlNo2}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, dlNo2: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Pharmacist</label>
                <input
                  type="text"
                  value={pharmacyDetails.pharmacist}
                  onChange={(e) => setPharmacyDetails({ ...pharmacyDetails, pharmacist: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AUTHENTIC TAX INVOICE CASH MEMO (PERFECT 100% TABLE-BASED RENDER)         */}
        {/* ========================================================================= */}
        <div
          id="printable-invoice"
          className="bg-white text-black p-2 sm:p-3 rounded-sm shadow-xl font-sans border-2 border-black max-w-5xl mx-auto text-[9px] leading-tight"
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          {/* 1. HEADER TABLE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', marginBottom: '2px' }}>
            <tbody>
              {/* Row 1: Shop Name, Badges, Licenses */}
              <tr style={{ borderBottom: '1px solid #000' }}>
                {/* Left: Shop Details */}
                <td style={{ width: '50%', padding: '4px 6px', verticalAlign: 'top', borderRight: '1.5px solid #000' }}>
                  <div style={{ fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#000' }}>
                    {pharmacyDetails.name}
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#111', marginTop: '2px' }}>
                    {pharmacyDetails.address}
                  </div>
                </td>

                {/* Center: Invoice & Cash Memo */}
                <td style={{ width: '22%', padding: '4px 6px', textAlign: 'center', verticalAlign: 'middle', borderRight: '1.5px solid #000' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-around' }}>
                    <span>INVOICE</span>
                    <span>CASH MEMO</span>
                  </div>
                  <div style={{ fontSize: '8.5px', fontWeight: 'bold', marginTop: '6px', color: '#333' }}>
                    ORIGINAL
                  </div>
                </td>

                {/* Right: GST & Drug Licenses */}
                <td style={{ width: '28%', padding: '4px 6px', verticalAlign: 'top', fontSize: '8px', lineHeight: '1.3' }}>
                  <div><strong>GST Tin:</strong> {pharmacyDetails.gstin}</div>
                  <div><strong>D.L.NO:</strong> {pharmacyDetails.dlNo1}</div>
                  <div>{pharmacyDetails.dlNo2}</div>
                  <div style={{ marginTop: '1px', color: '#111' }}>{pharmacyDetails.regNo}</div>
                </td>
              </tr>

              {/* Row 2: Customer, Doctor, Bill No & Date */}
              <tr>
                <td style={{ padding: '3px 6px', verticalAlign: 'top', borderRight: '1.5px solid #000' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span><strong>Customer :</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{order.customerDetails?.name || 'RIDDHI PARMAR'}</span></span>
                    <span style={{ color: '#444', marginRight: '15px' }}>Area : -</span>
                  </div>
                  <div><strong>Doctor :</strong> <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{cleanDoctor}</span></div>
                </td>

                <td colSpan="2" style={{ padding: '3px 6px', verticalAlign: 'top', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '2px' }}>
                    <span><strong>Bill No :</strong> <strong style={{ fontFamily: 'monospace', fontSize: '9.5px' }}>{order.orderNumber || 'C-501'}</strong></span>
                    <span><strong>{formattedDate}</strong></span>
                  </div>
                  <div style={{ color: '#444' }}>Detail : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 2. LINE ITEMS TABLE (WITH COMPACT DESCRIPTION & EXPANDED NUMERICAL COLUMNS) */}
          <table className="items-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '8.5px', textAlign: 'center', marginBottom: '2px' }}>
            <thead>
              <tr style={{ background: '#f4f4f4', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
                <th style={{ border: '1px solid #000', padding: '2px 1px', width: '3.5%' }} rowSpan="2">Sr.</th>
                <th style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'left', width: '21%' }} rowSpan="2">Description</th>
                <th style={{ border: '1px solid #000', padding: '2px 1px', width: '6%' }} rowSpan="2">HSNCd</th>
                <th style={{ border: '1px solid #000', padding: '2px 1px', width: '7.5%' }} rowSpan="2">BatchNo</th>
                <th style={{ border: '1px solid #000', padding: '2px 1px', width: '5.5%' }} rowSpan="2">ExpDt</th>
                <th style={{ border: '1px solid #000', padding: '2px 1px', width: '4%' }} rowSpan="2">Unit</th>
                <th style={{ border: '1px solid #000', padding: '2px 3px', width: '6.5%', textAlign: 'right' }} rowSpan="2">M.R.P.</th>
                <th style={{ border: '1px solid #000', padding: '2px 1px', width: '4%' }} rowSpan="2">Qty</th>
                <th style={{ border: '1px solid #000', padding: '2px 3px', width: '7.5%', textAlign: 'right' }} rowSpan="2">Sale Rate<br/>/ Unit</th>
                <th style={{ border: '1px solid #000', padding: '2px 2px', width: '5%', textAlign: 'right' }} rowSpan="2">Disc%</th>
                <th style={{ border: '1px solid #000', padding: '2px 3px', width: '7.5%', textAlign: 'right' }} rowSpan="2">Taxable<br/>Value</th>
                <th style={{ border: '1px solid #000', padding: '1px 2px', textAlign: 'center', width: '10%' }} colSpan="2">SGST</th>
                <th style={{ border: '1px solid #000', padding: '1px 2px', textAlign: 'center', width: '10%' }} colSpan="2">CGST</th>
                <th style={{ border: '1px solid #000', padding: '2px 3px', width: '7%', textAlign: 'right' }} rowSpan="2">Amount</th>
              </tr>
              <tr style={{ background: '#f4f4f4', fontWeight: 'bold', borderBottom: '1.5px solid #000', fontSize: '7.5px' }}>
                <th style={{ border: '1px solid #000', padding: '1px 2px', width: '4.5%', textAlign: 'right' }}>Rate</th>
                <th style={{ border: '1px solid #000', padding: '1px 2px', width: '5.5%', textAlign: 'right' }}>Value</th>
                <th style={{ border: '1px solid #000', padding: '1px 2px', width: '4.5%', textAlign: 'right' }}>Rate</th>
                <th style={{ border: '1px solid #000', padding: '1px 2px', width: '5.5%', textAlign: 'right' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {calculatedItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ border: '1px solid #000', padding: '2px 1px' }}>{item.sr}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'left', fontWeight: 'bold', textTransform: 'uppercase', wordBreak: 'break-word', overflow: 'hidden' }}>
                    {item.name}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '2px 1px', fontFamily: 'monospace' }}>{item.hsnCode}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 1px', fontFamily: 'monospace', fontWeight: '500' }}>{item.batchNumber}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 1px', fontFamily: 'monospace' }}>{item.expDate}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 1px' }}>{item.unit}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'right', fontFamily: 'monospace' }}>{item.mrp}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 1px', fontWeight: 'bold' }}>{item.qty}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'right', fontFamily: 'monospace' }}>{item.saleRate}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace' }}>{item.discPercent}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '500' }}>{item.taxableValue}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace' }}>{item.sgstRate}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace' }}>{item.sgstValue}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace' }}>{item.cgstRate}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace' }}>{item.cgstValue}</td>
                  <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.amount}</td>
                </tr>
              ))}

              {/* SUMMARY TOTALS ROW */}
              <tr style={{ borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000', fontWeight: 'bold', background: '#fafafa', fontSize: '8.5px' }}>
                <td style={{ border: '1px solid #000', padding: '2px' }} colSpan="7"></td>
                <td style={{ border: '1px solid #000', padding: '2px 1px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{totalUnits}</td>
                <td style={{ border: '1px solid #000', padding: '2px' }}></td>
                <td style={{ border: '1px solid #000', padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{totalTaxableVal.toFixed(2)}</td>
                <td style={{ border: '1px solid #000', padding: '2px' }}></td>
                <td style={{ border: '1px solid #000', padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{totalSgstVal.toFixed(2)}</td>
                <td style={{ border: '1px solid #000', padding: '2px' }}></td>
                <td style={{ border: '1px solid #000', padding: '2px 2px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{totalCgstVal.toFixed(2)}</td>
                <td style={{ border: '1px solid #000', padding: '2px 3px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{grossTotalVal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* 3. FOOTER TABLE: LEFT DETAILS + RIGHT GST SUMMARY & NET BOX */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginTop: '2px' }}>
            <tbody>
              <tr>
                {/* Left Side: Store & Pharmacist details */}
                <td style={{ width: '55%', verticalAlign: 'top', padding: '3px 6px', border: 'none', lineHeight: '1.3' }}>
                  <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>FOR, {pharmacyDetails.name}</div>
                  <div style={{ fontWeight: 'bold', marginTop: '1px' }}>{pharmacyDetails.pharmacist}</div>
                  
                  {/* Space for Stamp & Signature */}
                  <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', margin: '3px 0' }}>
                    <span style={{ fontSize: '7.5px', color: '#666', fontStyle: 'italic', borderTop: '1px dotted #888', paddingTop: '1px', width: '140px' }}>
                      Authorised Signature & Stamp
                    </span>
                  </div>

                  <div style={{ fontSize: '8px', fontWeight: '600', color: '#222' }}>{pharmacyDetails.paymentDisclaimer}</div>
                  <div style={{ fontSize: '8px', color: '#555' }}>Bag</div>
                  <div style={{ fontWeight: 'bold', fontSize: '9px', marginTop: '3px', borderTop: '1px solid #ddd', paddingTop: '2px' }}>
                    {numberToWords(roundedFinalAmount)}
                  </div>
                </td>

                {/* Right Side: GST Summary Table + NET Box */}
                <td style={{ width: '45%', verticalAlign: 'top', padding: '2px 4px', border: 'none' }}>
                  {/* GST Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', textAlign: 'center', fontSize: '8px' }}>
                    <thead>
                      <tr style={{ background: '#f4f4f4', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
                        <th style={{ border: '1px solid #000', padding: '1.5px' }}>GST%</th>
                        <th style={{ border: '1px solid #000', padding: '1.5px' }}>GST Base</th>
                        <th style={{ border: '1px solid #000', padding: '1.5px' }}>SGST</th>
                        <th style={{ border: '1px solid #000', padding: '1.5px' }}>CGST</th>
                        <th style={{ border: '1px solid #000', padding: '1.5px' }}>IGST</th>
                        <th style={{ border: '1px solid #000', padding: '1.5px' }}>OTHER +/-</th>
                        <th style={{ border: '1px solid #000', padding: '1.5px' }}>ROUND OFF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displaySlabs.length === 0 ? (
                        <tr style={{ fontFamily: 'monospace', fontSize: '8.5px' }}>
                          <td style={{ border: '1px solid #000', padding: '2px' }}>5.00</td>
                          <td style={{ border: '1px solid #000', padding: '2px' }}>{totalTaxableVal.toFixed(2)}</td>
                          <td style={{ border: '1px solid #000', padding: '2px' }}>{totalSgstVal.toFixed(2)}</td>
                          <td style={{ border: '1px solid #000', padding: '2px' }}>{totalCgstVal.toFixed(2)}</td>
                          <td style={{ border: '1px solid #000', padding: '2px' }}>0.00</td>
                          <td style={{ border: '1px solid #000', padding: '2px' }}>0.00</td>
                          <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>{roundOff}</td>
                        </tr>
                      ) : (
                        displaySlabs.map((s, sIdx) => (
                          <tr key={sIdx} style={{ fontFamily: 'monospace', fontSize: '8.5px' }}>
                            <td style={{ border: '1px solid #000', padding: '2px' }}>{s.slab.toFixed(2)}</td>
                            <td style={{ border: '1px solid #000', padding: '2px' }}>{s.gstBase.toFixed(2)}</td>
                            <td style={{ border: '1px solid #000', padding: '2px' }}>{s.sgst.toFixed(2)}</td>
                            <td style={{ border: '1px solid #000', padding: '2px' }}>{s.cgst.toFixed(2)}</td>
                            <td style={{ border: '1px solid #000', padding: '2px' }}>0.00</td>
                            <td style={{ border: '1px solid #000', padding: '2px' }}>0.00</td>
                            <td style={{ border: '1px solid #000', padding: '2px', fontWeight: 'bold' }}>
                              {sIdx === 0 ? roundOff : '0.00'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* NET Amount Box */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', marginTop: '3px', background: '#f9f9f9' }}>
                    <tbody>
                      <tr>
                        <td style={{ border: 'none', padding: '4px 8px', fontSize: '13px', fontWeight: '900', textAlign: 'left', textTransform: 'uppercase' }}>
                          NET
                        </td>
                        <td style={{ border: 'none', padding: '4px 8px', fontSize: '18px', fontWeight: '900', textAlign: 'right', fontFamily: 'monospace' }}>
                          {roundedFinalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 4. VERY BOTTOM TAG (E & O.E.) */}
          <div style={{ marginTop: '2px', paddingTop: '1px', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'flex-end', fontSize: '7.5px', color: '#555', fontWeight: 'bold' }}>
            <span>E & O.E.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
