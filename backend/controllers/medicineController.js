const Medicine = require('../models/Medicine');
const { parsePurchaseBillImage } = require('../services/ocrService');

// @desc    Add new medicine entry or update stock quantity if batch exists
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
  } = req.body;

  if (!name || !genericName || !batchNumber || purchasePrice === undefined || sellingPrice === undefined || !stockQuantity || !expiryDate) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  // Check if same medicine with exact batch number exists
  let medicine = await Medicine.findOne({
    batchNumber: batchNumber.trim(),
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
  });

  if (medicine) {
    // Auto-increment stock
    medicine.stockQuantity += Number(stockQuantity);
    medicine.purchasePrice = Number(purchasePrice);
    medicine.sellingPrice = Number(sellingPrice);
    medicine.expiryDate = expiryDate;
    if (supplier) medicine.supplier = supplier;
    await medicine.save();

    return res.status(200).json({
      message: `Stock updated for existing batch ${batchNumber}`,
      medicine,
    });
  }

  // Create new medicine record
  medicine = await Medicine.create({
    name: name.trim(),
    genericName: genericName.trim(),
    batchNumber: batchNumber.trim(),
    category: category || 'General',
    purchasePrice: Number(purchasePrice),
    sellingPrice: Number(sellingPrice),
    stockQuantity: Number(stockQuantity),
    expiryDate: new Date(expiryDate),
    supplier: supplier || { name: '', contact: '' },
    createdBy: req.user._id,
  });

  res.status(201).json({
    message: 'Medicine added successfully to inventory',
    medicine,
  });
};

// @desc    Get all medicines (Search, Category filter, Expiry status filter)
// @route   GET /api/medicines
// @access  Private (Admin & Shopkeeper)
const getMedicines = async (req, res) => {
  const { search, category, stockStatus, expiryStatus } = req.query;

  let query = {};

  if (category && category !== 'All') {
    query.category = { $regex: category, $options: 'i' };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { batchNumber: { $regex: search, $options: 'i' } },
      { 'supplier.name': { $regex: search, $options: 'i' } },
    ];
  }

  if (stockStatus === 'low') {
    query.stockQuantity = { $lte: 10 };
  } else if (stockStatus === 'out') {
    query.stockQuantity = 0;
  }

  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  if (expiryStatus === 'expired') {
    query.expiryDate = { $lte: now };
  } else if (expiryStatus === 'expiring_soon') {
    query.expiryDate = { $gt: now, $lte: sixtyDaysFromNow };
  }

  const medicines = await Medicine.find(query)
    .populate('createdBy', 'name shopName')
    .sort({ name: 1 });

  res.json(medicines);
};

// @desc    Get medicine by ID
// @route   GET /api/medicines/:id
// @access  Private
const getMedicineById = async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (medicine) {
    res.json(medicine);
  } else {
    res.status(404).json({ message: 'Medicine not found' });
  }
};

// @desc    Update medicine stock or pricing
// @route   PUT /api/medicines/:id
// @access  Private (Admin & Shopkeeper)
const updateMedicine = async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    return res.status(404).json({ message: 'Medicine not found' });
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
  } = req.body;

  medicine.name = name || medicine.name;
  medicine.genericName = genericName || medicine.genericName;
  medicine.batchNumber = batchNumber || medicine.batchNumber;
  medicine.category = category || medicine.category;
  if (purchasePrice !== undefined) medicine.purchasePrice = Number(purchasePrice);
  if (sellingPrice !== undefined) medicine.sellingPrice = Number(sellingPrice);
  if (stockQuantity !== undefined) medicine.stockQuantity = Number(stockQuantity);
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
      items: parsedData.items || [],
    });
  } catch (error) {
    console.error('OCR Bill Processing Error:', error);
    res.status(500).json({
      message: error.message || 'Failed to scan purchase bill image using OCR',
    });
  }
};

// @desc    Batch import verified OCR medicines into MongoDB database
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

    for (const item of items) {
      const name = (item.name || '').trim();
      const genericName = (item.genericName || name).trim();
      const batchNumber = (item.batchNumber || `BATCH-${Date.now()}`).trim();
      const category = item.category || 'General';
      const purchasePrice = Number(item.purchasePrice) || 0;
      const sellingPrice = Number(item.sellingPrice) || Number((purchasePrice * 1.5).toFixed(2));
      const stockQuantity = Number(item.stockQuantity) || 0;
      const expiryDate = item.expiryDate ? new Date(item.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const itemSupplier = supplier || item.supplier || { name: '', contact: '' };

      if (!name) continue;

      // Check if medicine with exact name and batch number exists
      let medicine = await Medicine.findOne({
        batchNumber: batchNumber,
        name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });

      if (medicine) {
        medicine.stockQuantity += stockQuantity;
        medicine.purchasePrice = purchasePrice;
        medicine.sellingPrice = sellingPrice;
        medicine.expiryDate = expiryDate;
        if (itemSupplier.name) medicine.supplier = itemSupplier;
        await medicine.save();
        updatedCount++;
        processedMedicines.push(medicine);
      } else {
        medicine = await Medicine.create({
          name: name, // Exact name as in the bill
          genericName: genericName,
          batchNumber: batchNumber,
          category: category,
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

// Seed sample inventory if database is empty
const seedSampleInventory = async (userId) => {
  try {
    const count = await Medicine.countDocuments();
    if (count === 0 && userId) {
      const today = new Date();
      const sampleData = [
        {
          name: 'Paracetamol 500mg',
          genericName: 'Acetaminophen',
          batchNumber: 'PARA-2026-A1',
          category: 'Analgesics / Antipyretic',
          purchasePrice: 15.0,
          sellingPrice: 35.0,
          stockQuantity: 250,
          expiryDate: new Date(today.getFullYear() + 2, today.getMonth(), 15),
          supplier: { name: 'Apex Pharma', contact: '+91 98765-APEX' },
          createdBy: userId,
        },
        {
          name: 'Amoxicillin 250mg',
          genericName: 'Amoxicillin Trihydrate',
          batchNumber: 'AMOX-2026-B4',
          category: 'Antibiotics',
          purchasePrice: 40.0,
          sellingPrice: 80.0,
          stockQuantity: 120,
          expiryDate: new Date(today.getFullYear() + 1, today.getMonth() + 4, 10),
          supplier: { name: 'MediLife Global', contact: '+91 98765-MEDILIFE' },
          createdBy: userId,
        },
        {
          name: 'Cetirizine 10mg',
          genericName: 'Cetirizine Hydrochloride',
          batchNumber: 'CETI-2026-C2',
          category: 'Antihistamines',
          purchasePrice: 8.0,
          sellingPrice: 20.0,
          stockQuantity: 8, // Low stock sample
          expiryDate: new Date(today.getFullYear(), today.getMonth() + 1, 20), // Near expiry sample
          supplier: { name: 'Sun Health Corp', contact: '+91 98765-SUNHLT' },
          createdBy: userId,
        },
        {
          name: 'Metformin 500mg',
          genericName: 'Metformin Hydrochloride',
          batchNumber: 'METF-2026-D9',
          category: 'Antidiabetic',
          purchasePrice: 22.0,
          sellingPrice: 50.0,
          stockQuantity: 180,
          expiryDate: new Date(today.getFullYear() + 2, today.getMonth() + 6, 30),
          supplier: { name: 'Apex Pharma', contact: '+91 98765-APEX' },
          createdBy: userId,
        },
        {
          name: 'Omeprazole 20mg',
          genericName: 'Omeprazole',
          batchNumber: 'OMEP-2026-E5',
          category: 'Gastrointestinal',
          purchasePrice: 30.0,
          sellingPrice: 75.0,
          stockQuantity: 95,
          expiryDate: new Date(today.getFullYear() + 1, today.getMonth() + 8, 12),
          supplier: { name: 'BioCure Labs', contact: '+91 98765-BIOCURE' },
          createdBy: userId,
        },
      ];

      await Medicine.insertMany(sampleData);
      console.log('Sample inventory seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding sample inventory:', error);
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
  seedSampleInventory,
};

