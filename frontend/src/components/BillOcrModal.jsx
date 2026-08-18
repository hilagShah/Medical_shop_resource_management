import React, { useState } from 'react';
import API from '../services/api';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  PackageCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';

const BillOcrModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [supplier, setSupplier] = useState({ name: '', contact: '' });
  const [invoiceMeta, setInvoiceMeta] = useState({ number: '', date: '' });
  const [items, setItems] = useState([]);

  if (!isOpen) return null;

  // Helper to downscale & compress large bill images in browser memory
  const compressImage = (selectedFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedB64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedB64);
        };
        img.onerror = (err) => reject(err);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(selectedFile);
    });
  };

  // Handle file upload and convert to compressed base64 in memory
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid bill image file (PNG, JPG, WEBP)');
      return;
    }

    setError('');
    setSuccessMsg('');
    setFile(selectedFile);

    try {
      const compressedB64 = await compressImage(selectedFile);
      setBase64Image(compressedB64);
      setPreviewUrl(compressedB64);
    } catch (err) {
      console.error('Failed to process image:', err);
      setError('Error reading bill image file.');
    }
  };

  // Helper to downscale any base64 string
  const compressBase64String = (b64, maxDim = 1600, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(b64);
      img.src = b64;
    });
  };

  // Perform Gemini OCR Scan API call
  const handlePerformOcrScan = async () => {
    if (!base64Image) {
      setError('Please upload a bill image or select a sample purchase bill.');
      return;
    }

    setScanning(true);
    setError('');

    try {
      // Guarantee image payload is optimized (< 400KB)
      const optimizedImage = await compressBase64String(base64Image);

      const res = await API.post('/medicines/ocr-scan', {
        image: optimizedImage,
        mimeType: 'image/jpeg',
      });

      if (res.data.success) {
        setSupplier(res.data.supplier || { name: '', contact: '' });
        setInvoiceMeta({
          number: res.data.invoiceNumber || '',
          date: res.data.invoiceDate || '',
        });
        setItems(res.data.items || []);
        setScanned(true);
      } else {
        setError(res.data.message || 'Failed to extract bill details via Gemini OCR');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error processing OCR bill image with Gemini API');
    } finally {
      setScanning(false);
    }
  };

  // Update item field
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Remove item row
  const handleRemoveRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Add new manual row
  const handleAddRow = () => {
    setItems([
      ...items,
      {
        name: '',
        genericName: '',
        batchNumber: `BATCH-${Date.now().toString().slice(-4)}`,
        category: 'General',
        purchasePrice: '',
        sellingPrice: '',
        stockQuantity: '',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      },
    ]);
  };

  // Submit batch import to database
  const handleImportToDatabase = async () => {
    if (items.length === 0) {
      setError('No items to import to database.');
      return;
    }

    // Validate medicine names
    const emptyName = items.some((it) => !it.name || !it.name.trim());
    if (emptyName) {
      setError('Please ensure all items have a valid medicine name.');
      return;
    }

    setImporting(true);
    setError('');

    try {
      const res = await API.post('/medicines/batch-import', {
        supplier,
        items,
      });

      setSuccessMsg(res.data.message || 'Medicines imported successfully to database!');

      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleCloseModal();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to import medicines into database.');
    } finally {
      setImporting(false);
    }
  };

  const handleCloseModal = () => {
    setFile(null);
    setPreviewUrl(null);
    setBase64Image(null);
    setScanning(false);
    setScanned(false);
    setImporting(false);
    setError('');
    setSuccessMsg('');
    setSupplier({ name: '', contact: '' });
    setInvoiceMeta({ number: '', date: '' });
    setItems([]);
    onClose();
  };

  const categories = [
    'General',
    'Analgesics / Antipyretic',
    'Antibiotics',
    'Antihistamines',
    'Antidiabetic',
    'Gastrointestinal',
    'Cardiovascular',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 shadow-lg shadow-cyan-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Gemini Vision OCR Purchase Bill Scanner
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-400">
                  AI Powered
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scan incoming seller purchase bills to auto-extract exact medicine names & details directly into MongoDB
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD BILL */}
          {!scanned && !scanning && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/50 p-8 text-center hover:border-cyan-500/60 transition-all">
                {previewUrl ? (
                  <div className="space-y-4 w-full flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Bill Preview"
                      className="max-h-56 rounded-xl border border-slate-800 object-contain shadow-md"
                    />
                    <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{file?.name || 'Uploaded Bill Image'}</p>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                        setBase64Image(null);
                      }}
                      className="text-xs text-rose-400 hover:underline font-medium"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 w-full py-4">
                    <div className="rounded-full bg-slate-800 p-4 text-cyan-400 shadow-inner">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        Upload Purchase Bill / Invoice Image
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Drag & drop or click to browse (JPG, PNG, WEBP)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Perform OCR Button */}
              {base64Image && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handlePerformOcrScan}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    Scan Bill with Gemini Vision AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SCANNING LOADER */}
          {scanning && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="h-16 w-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                <Sparkles className="h-6 w-6 text-cyan-400 absolute" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white">Analyzing Purchase Bill with Gemini AI...</h3>
                <p className="text-xs text-slate-400">
                  Extracting supplier header, exact medicine names, batch numbers, prices, and quantities
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW EXTRACTED DETAILS & BATCH DB IMPORT */}
          {scanned && !scanning && (
            <div className="space-y-5">
              {/* Supplier & Bill Header Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Seller / Supplier Name
                  </label>
                  <input
                    type="text"
                    value={supplier.name}
                    onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
                    placeholder="e.g. Apex Pharma"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Supplier Contact
                  </label>
                  <input
                    type="text"
                    value={supplier.contact}
                    onChange={(e) => setSupplier({ ...supplier, contact: e.target.value })}
                    placeholder="e.g. +91 98765-43210"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Invoice / Bill ID
                  </label>
                  <input
                    type="text"
                    value={invoiceMeta.number}
                    onChange={(e) => setInvoiceMeta({ ...invoiceMeta, number: e.target.value })}
                    placeholder="e.g. INV-889"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-cyan-400 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Extracted Table Header & Action */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Extracted Medicines ({items.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Review and edit the exact bill medicine names and quantities before saving to DB
                  </p>
                </div>
                <button
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Medicine Row
                </button>
              </div>

              {/* Items Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider sticky top-0 z-10">
                        <th className="p-3.5 min-w-[220px]">Exact Name on Bill</th>
                        <th className="p-3.5 min-w-[170px]">Generic Name</th>
                        <th className="p-3.5 min-w-[130px]">Batch #</th>
                        <th className="p-3.5 min-w-[150px]">Category</th>
                        <th className="p-3.5 min-w-[135px]">Buy Price (₹)</th>
                        <th className="p-3.5 min-w-[135px]">Sell Price (₹)</th>
                        <th className="p-3.5 min-w-[110px]">Qty Purchased</th>
                        <th className="p-3.5 min-w-[145px]">Expiry Date</th>
                        <th className="p-3.5 text-center min-w-[60px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2 min-w-[220px]">
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              placeholder="Exact Medicine Name"
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 min-w-[170px]">
                            <input
                              type="text"
                              value={item.genericName}
                              onChange={(e) => handleItemChange(idx, 'genericName', e.target.value)}
                              placeholder="Generic Name"
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 min-w-[130px]">
                            <input
                              type="text"
                              value={item.batchNumber}
                              onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-xs font-mono text-cyan-400 focus:border-cyan-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 min-w-[150px]">
                            <select
                              value={item.category || 'General'}
                              onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 min-w-[135px]">
                            <input
                              type="number"
                              step="0.01"
                              value={item.purchasePrice}
                              onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-xs font-mono font-medium text-slate-200 focus:border-cyan-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 min-w-[135px]">
                            <input
                              type="number"
                              step="0.01"
                              value={item.sellingPrice}
                              onChange={(e) => handleItemChange(idx, 'sellingPrice', e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-xs font-mono text-emerald-400 font-bold focus:border-cyan-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 min-w-[110px]">
                            <input
                              type="number"
                              value={item.stockQuantity}
                              onChange={(e) => handleItemChange(idx, 'stockQuantity', e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-xs font-mono text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 min-w-[145px]">
                            <input
                              type="date"
                              value={item.expiryDate ? item.expiryDate.slice(0, 10) : ''}
                              onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center min-w-[60px]">
                            <button
                              onClick={() => handleRemoveRow(idx)}
                              className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/20 transition-all"
                              title="Delete Row"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-6 py-4">
          <button
            onClick={() => {
              if (scanned) {
                setScanned(false);
              } else {
                handleCloseModal();
              }
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            {scanned ? 'Back to Scan' : 'Cancel'}
          </button>

          {scanned && (
            <button
              onClick={handleImportToDatabase}
              disabled={importing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {importing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Importing to Database...
                </>
              ) : (
                <>
                  <PackageCheck className="h-4 w-4" />
                  Import All Medicines to Database
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillOcrModal;
