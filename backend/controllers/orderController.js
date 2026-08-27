const mongoose = require('mongoose');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const { escapeRegex } = require('../utils/sanitize');

// Helper to generate sequential bill number starting from 1 for each shopkeeper
const getNextBillNumber = async (shopkeeperId, session = null) => {
  const query = Order.find({ shopkeeperId }).select('orderNumber').sort({ createdAt: -1 });
  if (session) query.session(session);
  const userOrders = await query.lean();

  if (!userOrders || userOrders.length === 0) {
    return '1';
  }

  let maxNum = 0;
  for (const ord of userOrders) {
    // Only consider purely numerical serial bill numbers (e.g. "1", "2", "3")
    if (ord.orderNumber && /^\d+$/.test(ord.orderNumber.trim())) {
      const num = parseInt(ord.orderNumber.trim(), 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  // If no serial bill numbers exist yet for this shopkeeper, start at 1
  const nextNum = maxNum > 0 ? maxNum + 1 : 1;
  return String(nextNum);
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

      // Decrement stock (retains record with 0 stock until restocked)
      medicine.stockQuantity = Math.max(0, medicine.stockQuantity - qty);
      await medicine.save({ session });

      const itemGstRate = item.gstRate !== undefined ? Number(item.gstRate) : (medicine.gstRate !== undefined ? Number(medicine.gstRate) : 5);
      const hsnCode = item.hsnCode || medicine.hsnCode || '';
      const itemTaxable = Number((itemSubtotalAfter / (1 + itemGstRate / 100)).toFixed(2));
      const itemSgst = Number((itemTaxable * (itemGstRate / 200)).toFixed(2));
      const itemCgst = Number((itemTaxable * (itemGstRate / 200)).toFixed(2));

      processedItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        batchNumber: medicine.batchNumber,
        quantity: qty,
        unitPrice,
        hsnCode,
        gstRate: itemGstRate,
        taxableValue: itemTaxable,
        sgst: itemSgst,
        cgst: itemCgst,
        itemDiscount: {
          type: discountType,
          value: discountValue,
          amount: Number(itemDiscountAmount.toFixed(2)),
        },
        subtotalBeforeDiscount: Number(itemSubtotalBefore.toFixed(2)),
        subtotalAfterDiscount: Number(itemSubtotalAfter.toFixed(2)),
        expiryDate: medicine.expiryDate || (item.expiryDate ? new Date(item.expiryDate) : undefined),
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

    // Multi-Slab GST Tax Summary aggregation
    const slabMap = {};
    for (const it of processedItems) {
      const slab = it.gstRate;
      if (!slabMap[slab]) {
        slabMap[slab] = { slab, gstBase: 0, sgst: 0, cgst: 0, igst: 0, totalTax: 0 };
      }
      slabMap[slab].gstBase += it.taxableValue;
      slabMap[slab].sgst += it.sgst;
      slabMap[slab].cgst += it.cgst;
      slabMap[slab].totalTax += (it.sgst + it.cgst);
    }

    const taxSummary = Object.values(slabMap).map((s) => ({
      slab: s.slab,
      gstBase: Number(s.gstBase.toFixed(2)),
      sgst: Number(s.sgst.toFixed(2)),
      cgst: Number(s.cgst.toFixed(2)),
      igst: 0,
      totalTax: Number(s.totalTax.toFixed(2)),
    }));

    const totalTaxableValue = Number(processedItems.reduce((acc, it) => acc + it.taxableValue, 0).toFixed(2));
    const totalSgst = Number(processedItems.reduce((acc, it) => acc + it.sgst, 0).toFixed(2));
    const totalCgst = Number(processedItems.reduce((acc, it) => acc + it.cgst, 0).toFixed(2));
    const totalTax = Number((totalSgst + totalCgst).toFixed(2));

    const rawTotal = amountAfterAllDiscounts; // GST is informative and included in retail selling price
    const roundedTotal = Math.round(rawTotal);
    const roundOff = roundedTotal - rawTotal;

    // Create Order Record with sequential bill number starting from 1
    const orderNumber = await getNextBillNumber(req.user._id, session);

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
      totalTaxableValue,
      totalSgst,
      totalCgst,
      tax: totalTax,
      taxSummary,
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

  if (search && search.trim()) {
    const cleanSearch = escapeRegex(search);
    query.$or = [
      { orderNumber: { $regex: cleanSearch, $options: 'i' } },
      { 'customerDetails.name': { $regex: cleanSearch, $options: 'i' } },
      { 'customerDetails.phone': { $regex: cleanSearch, $options: 'i' } },
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
  try {
    const order = await Order.findById(req.params.id).populate('shopkeeperId', 'name shopName email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Broken Object Level Authorization (BOLA/IDOR) Check
    if (req.user.role === 'shopkeeper') {
      const orderShopkeeperId = (order.shopkeeperId?._id || order.shopkeeperId)?.toString();
      if (orderShopkeeperId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this order record' });
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order by id:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve order' });
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
