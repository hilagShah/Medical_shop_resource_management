const Medicine = require('../models/Medicine');
const MedicineMaster = require('../models/MedicineMaster');
const Purchase = require('../models/Purchase');
const { parsePurchaseBillImage } = require('../services/ocrService');
const { escapeRegex } = require('../utils/sanitize');

// Helper to generate unique purchase number
const generatePurchaseNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PUR-${dateStr}-${randomStr}`;
};

// @desc    Add new medicine entry or update stock quantity if batch exists for this shopkeeper
// @route   POST /api/medicines
// @access  Private (Admin & Shopkeeper)
const addMedicine = async (req, res) => {
  const {
    name,
    genericName,
    batchNumber,
    category,
    purchasePrice,
    sellingPrice,
    stockQuantity,
    expiryDate,
    supplier,
    invoiceNumber,
    gstRate,
    hsnCode,
  } = req.body;

  if (
    !name ||
    !genericName ||
    !batchNumber ||
    purchasePrice === undefined ||
    sellingPrice === undefined ||
    stockQuantity === undefined ||
    Number(stockQuantity) <= 0 ||
    !expiryDate
  ) {
    return res.status(400).json({ message: 'Please fill in all required fields and enter a stock quantity greater than 0' });
  }

  const pPrice = Number(purchasePrice);
  const sPrice = Number(sellingPrice);
  const qty = Number(stockQuantity);
  const expDate = new Date(expiryDate);
  const supp = supplier || { name: 'General Supplier', contact: '' };
  const itemCategory = category || 'General';
  const itemGstRate = gstRate !== undefined ? Number(gstRate) : (itemCategory.toLowerCase().includes('cosmetic') ? 18 : 5);
  const itemHsnCode = hsnCode ? hsnCode.trim() : '';

  const safeNameRegex = new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

  // Check if medicine with exact batch number AND same name exists FOR THIS SHOPKEEPER
  let medicine = await Medicine.findOne({
    batchNumber: batchNumber.trim(),
    name: { $regex: safeNameRegex },
    createdBy: req.user._id,
  });

  if (medicine) {
    // If exact batch exists, update its stock and details
    medicine.stockQuantity += qty;
    medicine.purchasePrice = pPrice;
    medicine.sellingPrice = sPrice;
    medicine.expiryDate = expDate;
    medicine.gstRate = itemGstRate;
    medicine.hsnCode = itemHsnCode;
    if (supplier) medicine.supplier = supp;
    await medicine.save();

    // Delete any remaining 0-stock records of this medicine name (to clean up old depleted batch reminders)
    await Medicine.deleteMany({
      _id: { $ne: medicine._id },
      name: { $regex: safeNameRegex },
      stockQuantity: { $lte: 0 },
      createdBy: req.user._id,
    });
  } else {
    // When new stock of the SAME medicine name enters, delete the specific medicine detail record that was at 0 stock
    await Medicine.deleteMany({
      name: { $regex: safeNameRegex },
      stockQuantity: { $lte: 0 },
      createdBy: req.user._id,
    });

    // Create new medicine record with the incoming stock details
    medicine = await Medicine.create({
      name: name.trim(),
      genericName: genericName.trim(),
      batchNumber: batchNumber.trim(),
      category: itemCategory,
      hsnCode: itemHsnCode,
      gstRate: itemGstRate,
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      stockQuantity: qty,
      expiryDate: expDate,
      supplier: supp,
      createdBy: req.user._id,
    });
  }

  // Automatically log purchase history entry
  try {
    const subtotal = Number((qty * pPrice).toFixed(2));
    await Purchase.create({
      purchaseNumber: generatePurchaseNumber(),
      invoiceNumber: invoiceNumber || '',
      purchaseDate: new Date(),
      supplier: {
        name: supp.name || 'General Supplier',
        contact: supp.contact || '',
      },
      shopkeeperId: req.user._id,
      items: [
        {
          medicineId: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          batchNumber: medicine.batchNumber,
          category: medicine.category,
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          quantity: qty,
          expiryDate: expDate,
          subtotal,
        },
      ],
      totalAmount: subtotal,
      totalQuantity: qty,
      source: 'manual_entry',
    });
  } catch (purchErr) {
    console.error('Error logging purchase history:', purchErr.message);
  }

  res.status(201).json({
    message: medicine.isNew ? 'Medicine added successfully to inventory' : `Stock updated for batch ${batchNumber}`,
    medicine,
  });
};

// @desc    Get all medicines (Scoped by Shopkeeper if shopkeeper, Global with filter for Admin)
// @route   GET /api/medicines
// @access  Private (Admin & Shopkeeper)
const getMedicines = async (req, res) => {
  const { search, category, stockStatus, expiryStatus, shopkeeperId } = req.query;

  let query = {};

  // Per-shopkeeper data isolation: Shopkeepers only see their own store's inventory
  if (req.user.role === 'shopkeeper') {
    query.createdBy = req.user._id;
  } else if (shopkeeperId) {
    // Admin filtering by a specific branch / shopkeeper
    query.createdBy = shopkeeperId;
  }

  if (category && category !== 'All') {
    const cleanCat = escapeRegex(category);
    query.category = { $regex: cleanCat, $options: 'i' };
  }

  if (search && search.trim()) {
    const cleanSearch = escapeRegex(search);
    query.$or = [
      { name: { $regex: cleanSearch, $options: 'i' } },
      { genericName: { $regex: cleanSearch, $options: 'i' } },
      { batchNumber: { $regex: cleanSearch, $options: 'i' } },
      { 'supplier.name': { $regex: cleanSearch, $options: 'i' } },
    ];
  }

  // Stock status filtering: low, out, in_stock, or all (default includes out of stock)
  if (stockStatus === 'low') {
    query.stockQuantity = { $lte: 10, $gt: 0 };
  } else if (stockStatus === 'out') {
    query.stockQuantity = { $lte: 0 };
  } else if (stockStatus === 'in_stock') {
    query.stockQuantity = { $gt: 0 };
  }

  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  if (expiryStatus === 'expired') {
    query.expiryDate = { $lte: now };
  } else if (expiryStatus === 'expiring_soon') {
    query.expiryDate = { $gt: now, $lte: sixtyDaysFromNow };
  }

  const medicines = await Medicine.find(query)
    .populate('createdBy', 'name shopName email')
    .sort({ name: 1 });

  res.json(medicines);
};

// @desc    Get medicine by ID
// @route   GET /api/medicines/:id
// @access  Private
const getMedicineById = async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    return res.status(404).json({ message: 'Medicine not found' });
  }

  // Verify ownership if user is shopkeeper
  if (req.user.role === 'shopkeeper' && medicine.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to view this inventory item' });
  }

  res.json(medicine);
};

// @desc    Update medicine stock or pricing
// @route   PUT /api/medicines/:id
// @access  Private (Admin & Shopkeeper)
const updateMedicine = async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    return res.status(404).json({ message: 'Medicine not found' });
  }

  // Verify ownership if user is shopkeeper
  if (req.user.role === 'shopkeeper' && medicine.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to modify this inventory item' });
  }

  const {
    name,
    genericName,
    batchNumber,
    category,
    purchasePrice,
    sellingPrice,
    stockQuantity,
    expiryDate,
    supplier,
    gstRate,
    hsnCode,
  } = req.body;

  medicine.name = name || medicine.name;
  medicine.genericName = genericName || medicine.genericName;
  medicine.batchNumber = batchNumber || medicine.batchNumber;
  medicine.category = category || medicine.category;
  if (gstRate !== undefined) medicine.gstRate = Number(gstRate);
  if (hsnCode !== undefined) medicine.hsnCode = hsnCode.trim();
  if (purchasePrice !== undefined) medicine.purchasePrice = Number(purchasePrice);
  if (sellingPrice !== undefined) medicine.sellingPrice = Number(sellingPrice);
  if (stockQuantity !== undefined) medicine.stockQuantity = Math.max(0, Number(stockQuantity));
  if (expiryDate) medicine.expiryDate = new Date(expiryDate);
  if (supplier) medicine.supplier = supplier;

  const updatedMedicine = await medicine.save();
  res.json(updatedMedicine);
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private (Admin & Shopkeeper)
const deleteMedicine = async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    return res.status(404).json({ message: 'Medicine not found' });
  }

  // Verify ownership if user is shopkeeper
  if (req.user.role === 'shopkeeper' && medicine.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this inventory item' });
  }

  await medicine.deleteOne();
  res.json({ message: 'Medicine removed from inventory' });
};

// @desc    Scan purchase bill image using Gemini Vision OCR
// @route   POST /api/medicines/ocr-scan
// @access  Private (Admin & Shopkeeper)
const scanPurchaseBill = async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No base64 image data provided in request body' });
    }

    const parsedData = await parsePurchaseBillImage(image, mimeType || 'image/jpeg');

    res.json({
      success: true,
      supplier: parsedData.supplier || { name: '', contact: '' },
      invoiceNumber: parsedData.invoiceNumber || '',
      invoiceDate: parsedData.invoiceDate || '',
      totalAmount: parsedData.totalAmount !== undefined && parsedData.totalAmount !== null ? Number(parsedData.totalAmount) : 0,
      items: parsedData.items || [],
    });
  } catch (error) {
    console.error('OCR Bill Processing Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to scan purchase bill image using OCR',
    });
  }
};

// @desc    Batch import verified OCR medicines into MongoDB database (assigned to current shopkeeper)
// @route   POST /api/medicines/batch-import
// @access  Private (Admin & Shopkeeper)
const batchImportMedicines = async (req, res) => {
  try {
    const { items, supplier } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No medicine items provided for batch import' });
    }

    let addedCount = 0;
    let updatedCount = 0;
    const processedMedicines = [];
    const purchaseItems = [];
    let totalPurchaseAmount = 0;
    let totalUnitsCount = 0;

    for (const item of items) {
      const name = (item.name || '').trim();
      const genericName = (item.genericName || name).trim();
      const batchNumber = (item.batchNumber || `BATCH-${Date.now()}`).trim();
      const category = item.category || 'General';
      const purchasePrice = Number(item.purchasePrice) || 0;
      const sellingPrice = Number(item.sellingPrice) || Number((purchasePrice * 1.5).toFixed(2));
      const stockQuantity = Number(item.stockQuantity) || 0;
      const expiryDate = item.expiryDate ? new Date(item.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const itemSupplier = supplier || item.supplier || { name: 'General Supplier', contact: '' };

      if (!name || stockQuantity <= 0) continue;

      // Check if medicine with exact name and batch number exists FOR THIS SHOPKEEPER
      let medicine = await Medicine.findOne({
        batchNumber: batchNumber,
        name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        createdBy: req.user._id,
      });

      const itemGstRate = item.gstRate !== undefined ? Number(item.gstRate) : (category.toLowerCase().includes('cosmetic') ? 18 : 5);
      const itemHsnCode = item.hsnCode ? item.hsnCode.trim() : '';

      if (medicine) {
        medicine.stockQuantity += stockQuantity;
        medicine.purchasePrice = purchasePrice;
        medicine.sellingPrice = sellingPrice;
        medicine.expiryDate = expiryDate;
        medicine.gstRate = itemGstRate;
        medicine.hsnCode = itemHsnCode;
        if (itemSupplier.name) medicine.supplier = itemSupplier;
        await medicine.save();

        // Delete any remaining 0-stock records of this medicine name
        await Medicine.deleteMany({
          _id: { $ne: medicine._id },
          name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          stockQuantity: { $lte: 0 },
          createdBy: req.user._id,
        });

        updatedCount++;
        processedMedicines.push(medicine);
      } else {
        // Delete any existing 0-stock record(s) for this medicine name when new stock enters
        await Medicine.deleteMany({
          name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          stockQuantity: { $lte: 0 },
          createdBy: req.user._id,
        });

        medicine = await Medicine.create({
          name: name,
          genericName: genericName,
          batchNumber: batchNumber,
          category: category,
          hsnCode: itemHsnCode,
          gstRate: itemGstRate,
          purchasePrice: purchasePrice,
          sellingPrice: sellingPrice,
          stockQuantity: stockQuantity,
          expiryDate: expiryDate,
          supplier: itemSupplier,
          createdBy: req.user._id,
        });
        addedCount++;
        processedMedicines.push(medicine);
      }

      const itemSubtotal = Number((stockQuantity * purchasePrice).toFixed(2));
      totalPurchaseAmount += itemSubtotal;
      totalUnitsCount += stockQuantity;

      purchaseItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        genericName: medicine.genericName,
        batchNumber: medicine.batchNumber,
        category: medicine.category,
        purchasePrice: purchasePrice,
        sellingPrice: sellingPrice,
        quantity: stockQuantity,
        expiryDate: expiryDate,
        subtotal: itemSubtotal,
      });
    }

    // Save multi-item purchase bill to Purchase collection
    try {
      if (purchaseItems.length > 0) {
        const { invoiceNumber, invoiceDate, totalAmount } = req.body;
        const verifiedTotal = totalAmount !== undefined && totalAmount !== null && Number(totalAmount) >= 0
          ? Number(Number(totalAmount).toFixed(2))
          : Number(totalPurchaseAmount.toFixed(2));

        await Purchase.create({
          purchaseNumber: generatePurchaseNumber(),
          invoiceNumber: invoiceNumber || `BILL-${Date.now().toString().slice(-6)}`,
          purchaseDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          supplier: {
            name: supplier?.name?.trim() || 'General Supplier',
            contact: supplier?.contact?.trim() || '',
          },
          shopkeeperId: req.user._id,
          items: purchaseItems,
          totalAmount: verifiedTotal,
          totalQuantity: totalUnitsCount,
          source: 'ocr_scan',
        });
      }
    } catch (purchErr) {
      console.error('Error recording batch purchase invoice:', purchErr.message);
    }

    res.status(200).json({
      message: `Batch import completed: ${addedCount} new medicine(s) added, ${updatedCount} existing batch stock(s) updated.`,
      addedCount,
      updatedCount,
      medicines: processedMedicines,
    });
  } catch (error) {
    console.error('Batch Import Error:', error);
    res.status(500).json({ message: error.message || 'Failed to import medicines to database' });
  }
};

// @desc    Search Master Medicine Catalog (50,000 Indian medicines)
// @route   GET /api/medicines/catalog/search
// @access  Private (Admin & Shopkeeper)
const searchMasterCatalog = async (req, res) => {
  try {
    const { query, q, limit = 20 } = req.query;
    const searchTerm = (query || q || '').trim();

    if (!searchTerm || searchTerm.length < 1) {
      return res.json([]);
    }

    const safeSearch = escapeRegex(searchTerm);
    const maxResults = Math.min(Math.max(1, parseInt(limit, 10) || 20), 50);

    // Fast indexed regex search prioritizing names that start with search term, then containing it
    const results = await MedicineMaster.find({
      name: { $regex: safeSearch, $options: 'i' },
    })
      .select('name')
      .limit(maxResults)
      .lean();

    // Sort to rank exact prefix matches higher
    const searchLower = searchTerm.toLowerCase();
    results.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(searchLower);
      const bStarts = b.name.toLowerCase().startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json(results);
  } catch (error) {
    console.error('Master Catalog Search Error:', error);
    res.status(500).json({ message: 'Error searching master medicines catalog' });
  }
};

module.exports = {
  addMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  scanPurchaseBill,
  batchImportMedicines,
  searchMasterCatalog,
};

