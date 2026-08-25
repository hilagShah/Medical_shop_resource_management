const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const { escapeRegex } = require('../utils/sanitize');

// Helper to generate unique purchase number (e.g. PUR-20260824-9X2A)
const generatePurchaseNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PUR-${dateStr}-${randomStr}`;
};

// @desc    Get all purchases (Scoped to shopkeeper, global with filter for admin)
// @route   GET /api/purchases
// @access  Private (Admin & Shopkeeper)
const getPurchases = async (req, res) => {
  try {
    const { search, supplierName, startDate, endDate, shopkeeperId } = req.query;

    let query = {};

    // Data isolation
    if (req.user.role === 'shopkeeper') {
      query.shopkeeperId = req.user._id;
    } else if (shopkeeperId) {
      query.shopkeeperId = shopkeeperId;
    }

    if (supplierName && supplierName !== 'All') {
      const cleanSupp = escapeRegex(supplierName);
      query['supplier.name'] = { $regex: new RegExp(`^${cleanSupp}$`, 'i') };
    }

    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) {
        const eod = new Date(endDate);
        eod.setHours(23, 59, 59, 999);
        query.purchaseDate.$lte = eod;
      }
    }

    if (search && search.trim()) {
      const cleanSearch = escapeRegex(search);
      query.$or = [
        { purchaseNumber: { $regex: cleanSearch, $options: 'i' } },
        { invoiceNumber: { $regex: cleanSearch, $options: 'i' } },
        { 'supplier.name': { $regex: cleanSearch, $options: 'i' } },
        { 'supplier.contact': { $regex: cleanSearch, $options: 'i' } },
        { 'items.name': { $regex: cleanSearch, $options: 'i' } },
        { 'items.batchNumber': { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    const purchases = await Purchase.find(query)
      .populate('shopkeeperId', 'name shopName email phone')
      .sort({ purchaseDate: -1, createdAt: -1 });

    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch purchase history' });
  }
};

// @desc    Get aggregated Supplier Directory and spending summary
// @route   GET /api/purchases/suppliers-summary
// @access  Private (Admin & Shopkeeper)
const getSuppliersSummary = async (req, res) => {
  try {
    const { shopkeeperId } = req.query;

    let matchQuery = {};
    if (req.user.role === 'shopkeeper') {
      matchQuery.shopkeeperId = new mongoose.Types.ObjectId(req.user._id);
    } else if (shopkeeperId) {
      matchQuery.shopkeeperId = new mongoose.Types.ObjectId(shopkeeperId);
    }

    const summary = await Purchase.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $toLower: '$supplier.name' },
          displayName: { $first: '$supplier.name' },
          contact: { $first: '$supplier.contact' },
          totalSpent: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$totalQuantity' },
          totalInvoices: { $sum: 1 },
          lastPurchaseDate: { $max: '$purchaseDate' },
        },
      },
      { $sort: { totalSpent: -1 } },
    ]);

    res.json(summary);
  } catch (error) {
    console.error('Error generating suppliers summary:', error);
    res.status(500).json({ message: error.message || 'Failed to aggregate supplier summary' });
  }
};

// @desc    Get purchase invoice by ID
// @route   GET /api/purchases/:id
// @access  Private
const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate(
      'shopkeeperId',
      'name shopName email phone'
    );

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    // Verify ownership if user is shopkeeper
    if (req.user.role === 'shopkeeper') {
      const ownerId = (purchase.shopkeeperId?._id || purchase.shopkeeperId)?.toString();
      if (ownerId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this purchase record' });
      }
    }

    res.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase by id:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch purchase details' });
  }
};

// @desc    Create / Record Purchase Invoice manually
// @route   POST /api/purchases
// @access  Private (Admin & Shopkeeper)
const createPurchase = async (req, res) => {
  try {
    const { supplier, invoiceNumber, purchaseDate, items, source, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Purchase must contain at least one item' });
    }

    let totalAmount = 0;
    let totalQuantity = 0;

    const processedItems = items.map((it) => {
      const qty = Number(it.quantity) || 1;
      const pPrice = Number(it.purchasePrice) || 0;
      const sPrice = Number(it.sellingPrice) || pPrice * 1.5;
      const sub = Number((qty * pPrice).toFixed(2));

      totalAmount += sub;
      totalQuantity += qty;

      return {
        medicineId: it.medicineId || null,
        name: (it.name || '').trim(),
        genericName: (it.genericName || '').trim(),
        batchNumber: (it.batchNumber || `BATCH-${Date.now()}`).trim(),
        category: it.category || 'General',
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        quantity: qty,
        expiryDate: it.expiryDate ? new Date(it.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        subtotal: sub,
      };
    });

    const purchaseNumber = generatePurchaseNumber();

    const purchase = await Purchase.create({
      purchaseNumber,
      invoiceNumber: (invoiceNumber || '').trim(),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      supplier: {
        name: supplier?.name?.trim() || 'General Supplier',
        contact: supplier?.contact?.trim() || '',
      },
      shopkeeperId: req.user._id,
      items: processedItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      totalQuantity,
      source: source || 'manual_entry',
      notes: notes || '',
    });

    const populated = await Purchase.findById(purchase._id).populate(
      'shopkeeperId',
      'name shopName email'
    );

    res.status(201).json({
      message: 'Purchase record saved successfully',
      purchase: populated,
    });
  } catch (error) {
    console.error('Error creating purchase record:', error);
    res.status(500).json({ message: error.message || 'Failed to save purchase record' });
  }
};

module.exports = {
  getPurchases,
  getSuppliersSummary,
  getPurchaseById,
  createPurchase,
  generatePurchaseNumber,
};
