const mongoose = require('mongoose');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

// Helper to generate unique order number (e.g. INV-20260815-9X2A)
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `INV-${dateStr}-${randomStr}`;
};

// @desc    Create new sale / order (Complete Sale POS)
// @route   POST /api/orders
// @access  Private (Shopkeeper & Admin)
const createOrder = async (req, res) => {
  const { customerDetails, items, orderDiscount, taxRate = 0, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Cart items cannot be empty' });
  }

  // Handle Mongoose Session for Transactions if replica set is available
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (err) {
    // Standalone MongoDB without replica set
    session = null;
    useTransaction = false;
  }

  try {
    let grossTotalBeforeDiscount = 0;
    let totalItemDiscount = 0;
    const processedItems = [];

    // Verify and decrement stock for each item
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId).session(session);

      if (!medicine) {
        throw new Error(`Medicine not found: ${item.name || item.medicineId}`);
      }

      if (medicine.stockQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for '${medicine.name}' (Batch: ${medicine.batchNumber}). Available: ${medicine.stockQuantity}, Requested: ${item.quantity}`
        );
      }

      const qty = Number(item.quantity);
      const unitPrice = Number(item.unitPrice || medicine.sellingPrice);
      const itemSubtotalBefore = qty * unitPrice;

      // Item level discount calculation
      let itemDiscountAmount = 0;
      const discountType = item.itemDiscount?.type || 'flat';
      const discountValue = Number(item.itemDiscount?.value || 0);

      if (discountType === 'percent') {
        itemDiscountAmount = (itemSubtotalBefore * Math.min(100, Math.max(0, discountValue))) / 100;
      } else {
        itemDiscountAmount = Math.min(itemSubtotalBefore, Math.max(0, discountValue));
      }

      const itemSubtotalAfter = Math.max(0, itemSubtotalBefore - itemDiscountAmount);

      grossTotalBeforeDiscount += itemSubtotalBefore;
      totalItemDiscount += itemDiscountAmount;

      // Decrement stock or remove completely if stock reaches 0
      medicine.stockQuantity -= qty;
      if (medicine.stockQuantity <= 0) {
        await medicine.deleteOne({ session });
      } else {
        await medicine.save({ session });
      }

      processedItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        batchNumber: medicine.batchNumber,
        quantity: qty,
        unitPrice,
        itemDiscount: {
          type: discountType,
          value: discountValue,
          amount: Number(itemDiscountAmount.toFixed(2)),
        },
        subtotalBeforeDiscount: Number(itemSubtotalBefore.toFixed(2)),
        subtotalAfterDiscount: Number(itemSubtotalAfter.toFixed(2)),
      });
    }

    // Order/Cart-level discount calculation
    const netAfterItemDiscounts = grossTotalBeforeDiscount - totalItemDiscount;
    let orderDiscountAmount = 0;
    const orderDiscType = orderDiscount?.type || 'flat';
    const orderDiscValue = Number(orderDiscount?.value || 0);

    if (orderDiscType === 'percent') {
      orderDiscountAmount = (netAfterItemDiscounts * Math.min(100, Math.max(0, orderDiscValue))) / 100;
    } else {
      orderDiscountAmount = Math.min(netAfterItemDiscounts, Math.max(0, orderDiscValue));
    }

    const totalCumulativeDiscount = totalItemDiscount + orderDiscountAmount;
    const amountAfterAllDiscounts = Math.max(0, grossTotalBeforeDiscount - totalCumulativeDiscount);

    // Tax calculation (Informative GST mentioned on the bill, not added to increase final amount)
    const taxRateNum = Math.max(0, Number(taxRate) || 0);
    const taxAmount = (amountAfterAllDiscounts * taxRateNum) / 100;
    const rawTotal = amountAfterAllDiscounts; // GST is mentioned in the bill, not added on top of selling price
    const roundedTotal = Math.round(rawTotal);
    const roundOff = roundedTotal - rawTotal;

    // Create Order Record
    const orderNumber = generateOrderNumber();

    const orderData = {
      orderNumber,
      shopkeeperId: req.user._id,
      customerDetails: {
        name: customerDetails?.name || 'Walk-in Customer',
        phone: customerDetails?.phone || '',
        doctorName: customerDetails?.doctorName || '',
      },
      items: processedItems,
      grossTotalBeforeDiscount: Number(grossTotalBeforeDiscount.toFixed(2)),
      totalItemDiscount: Number(totalItemDiscount.toFixed(2)),
      orderDiscount: {
        type: orderDiscType,
        value: orderDiscValue,
        amount: Number(orderDiscountAmount.toFixed(2)),
      },
      totalCumulativeDiscount: Number(totalCumulativeDiscount.toFixed(2)),
      taxRate: taxRateNum,
      tax: Number(taxAmount.toFixed(2)),
      roundOff: Number(roundOff.toFixed(2)),
      finalAmount: Number(roundedTotal.toFixed(2)),
      paymentMethod: paymentMethod || 'Cash',
    };

    const order = new Order(orderData);
    await order.save({ session });

    if (useTransaction && session) {
      await session.commitTransaction();
      session.endSession();
    }

    const populatedOrder = await Order.findById(order._id).populate('shopkeeperId', 'name shopName email');

    res.status(201).json({
      message: 'Sale completed successfully',
      order: populatedOrder,
    });
  } catch (error) {
    if (useTransaction && session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error('Order creation error:', error.message);
    res.status(400).json({ message: error.message || 'Failed to complete sale' });
  }
};

// @desc    Get order history (Filtered by date, shopkeeper, etc.)
// @route   GET /api/orders
// @access  Private (Admin & Shopkeeper)
const getOrders = async (req, res) => {
  const { startDate, endDate, shopkeeperId, search } = req.query;

  let query = {};

  // If user is shopkeeper, restrict to their own shop orders unless specified otherwise
  if (req.user.role === 'shopkeeper') {
    query.shopkeeperId = req.user._id;
  } else if (shopkeeperId) {
    query.shopkeeperId = shopkeeperId;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const eod = new Date(endDate);
      eod.setHours(23, 59, 59, 999);
      query.createdAt.$lte = eod;
    }
  }

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'customerDetails.name': { $regex: search, $options: 'i' } },
      { 'customerDetails.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const orders = await Order.find(query)
    .populate('shopkeeperId', 'name shopName email')
    .sort({ createdAt: -1 });

  res.json(orders);
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('shopkeeperId', 'name shopName email phone');
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Get Analytics & Business Insights (Admin Overview)
// @route   GET /api/orders/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  const medicines = await Medicine.find().populate('createdBy', 'name shopName');
  const orders = await Order.find().populate('shopkeeperId', 'name shopName');

  // Total medicines registered
  const totalMedicinesCount = medicines.length;
  const totalStockUnits = medicines.reduce((acc, curr) => acc + curr.stockQuantity, 0);

  // Sales Volume & Revenue
  const totalSalesCount = orders.length;
  const grossSalesVolume = orders.reduce((acc, curr) => acc + curr.grossTotalBeforeDiscount, 0);
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.finalAmount, 0);
  const totalDiscountsGiven = orders.reduce((acc, curr) => acc + curr.totalCumulativeDiscount, 0);

  // Calculate Net Profit / Loss Summary
  // Purchase Cost of Sold Items vs Revenue generated
  let totalCostOfGoodsSold = 0;
  for (const order of orders) {
    for (const item of order.items) {
      const med = medicines.find((m) => m._id.toString() === item.medicineId.toString());
      const pPrice = med ? med.purchasePrice : item.unitPrice * 0.6; // fallback 60% estimation if med deleted
      totalCostOfGoodsSold += item.quantity * pPrice;
    }
  }

  const netProfit = totalRevenue - totalCostOfGoodsSold;

  // Alerts: Low stock (< 10) & Near Expiry (< 60 days) or Expired
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const lowStockAlerts = medicines.filter((m) => m.stockQuantity <= 10);
  const expiredAlerts = medicines.filter((m) => new Date(m.expiryDate) <= now);
  const expiringSoonAlerts = medicines.filter(
    (m) => new Date(m.expiryDate) > now && new Date(m.expiryDate) <= sixtyDaysFromNow
  );

  // Shopkeeper count
  const totalShopkeepers = await User.countDocuments({ role: 'shopkeeper' });

  res.json({
    summary: {
      totalMedicinesCount,
      totalStockUnits,
      totalSalesCount,
      grossSalesVolume: Number(grossSalesVolume.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalDiscountsGiven: Number(totalDiscountsGiven.toFixed(2)),
      totalCostOfGoodsSold: Number(totalCostOfGoodsSold.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      totalShopkeepers,
    },
    alerts: {
      lowStock: lowStockAlerts,
      expired: expiredAlerts,
      expiringSoon: expiringSoonAlerts,
    },
    recentTransactions: orders.slice(0, 10),
  });
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getAnalytics,
};
