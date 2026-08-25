const User = require('../models/User');
const Order = require('../models/Order');
const { escapeRegex } = require('../utils/sanitize');

// @desc    Create a new Shopkeeper
// @route   POST /api/users/shopkeeper
// @access  Private/Admin
const createShopkeeper = async (req, res) => {
  const {
    name,
    email,
    password,
    shopName,
    phone,
    isActive,
    tradingYearStartDate,
    paymentStatus,
    subscriptionPlan,
    subscriptionExpiresAt,
    monthlyFee,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const plan = subscriptionPlan || 'monthly';
  let defaultExpiry = subscriptionExpiresAt
    ? new Date(subscriptionExpiresAt)
    : new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);

  const user = await User.create({
    name,
    email,
    password,
    role: 'shopkeeper',
    shopName: shopName || 'Branch Store',
    phone: phone || '',
    isActive: isActive !== undefined ? isActive : true,
    tradingYearStartDate: tradingYearStartDate ? new Date(tradingYearStartDate) : new Date(),
    paymentStatus: paymentStatus || 'paid',
    subscriptionPlan: plan,
    subscriptionExpiresAt: defaultExpiry,
    lastPaymentDate: new Date(),
    monthlyFee: Number(monthlyFee) || 0,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopName: user.shopName,
    phone: user.phone,
    isActive: user.isActive,
    tradingYearStartDate: user.tradingYearStartDate,
    paymentStatus: user.paymentStatus,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    monthlyFee: user.monthlyFee,
  });
};

// @desc    Get all shopkeepers (with search, filter & auto-expiry detection)
// @route   GET /api/users/shopkeepers
// @access  Private/Admin
const getShopkeepers = async (req, res) => {
  const { search, status, paymentStatus } = req.query;

  let query = { role: 'shopkeeper' };

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  if (search && search.trim()) {
    const cleanSearch = escapeRegex(search);
    query.$or = [
      { name: { $regex: cleanSearch, $options: 'i' } },
      { email: { $regex: cleanSearch, $options: 'i' } },
      { shopName: { $regex: cleanSearch, $options: 'i' } },
      { phone: { $regex: cleanSearch, $options: 'i' } },
    ];
  }

  const shopkeepers = await User.find(query).select('-password').sort({ createdAt: -1 });

  // Dynamically evaluate overdue status if subscription expired
  const now = new Date();
  const processedShopkeepers = shopkeepers.map((u) => {
    const doc = u.toObject();
    const isExpired = doc.subscriptionExpiresAt && new Date(doc.subscriptionExpiresAt) < now;
    if (isExpired && doc.paymentStatus === 'paid') {
      doc.paymentStatus = 'overdue';
    }
    return doc;
  });

  if (paymentStatus && paymentStatus !== 'all') {
    const filtered = processedShopkeepers.filter((u) => u.paymentStatus === paymentStatus);
    return res.json(filtered);
  }

  res.json(processedShopkeepers);
};

// @desc    Update shopkeeper details
// @route   PUT /api/users/shopkeepers/:id
// @access  Private/Admin
const updateShopkeeper = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'shopkeeper') {
    return res.status(404).json({ message: 'Shopkeeper not found' });
  }

  const {
    name,
    email,
    shopName,
    phone,
    isActive,
    password,
    tradingYearStartDate,
    paymentStatus,
    subscriptionPlan,
    subscriptionExpiresAt,
    monthlyFee,
  } = req.body;

  user.name = name || user.name;
  user.email = email || user.email;
  user.shopName = shopName || user.shopName;
  user.phone = phone !== undefined ? phone : user.phone;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = password;
  if (tradingYearStartDate) user.tradingYearStartDate = new Date(tradingYearStartDate);
  if (paymentStatus) user.paymentStatus = paymentStatus;
  if (subscriptionPlan) user.subscriptionPlan = subscriptionPlan;
  if (subscriptionExpiresAt) user.subscriptionExpiresAt = new Date(subscriptionExpiresAt);
  if (monthlyFee !== undefined) user.monthlyFee = Number(monthlyFee);

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    shopName: updatedUser.shopName,
    phone: updatedUser.phone,
    isActive: updatedUser.isActive,
    tradingYearStartDate: updatedUser.tradingYearStartDate,
    paymentStatus: updatedUser.paymentStatus,
    subscriptionPlan: updatedUser.subscriptionPlan,
    subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
    monthlyFee: updatedUser.monthlyFee,
  });
};

// @desc    Update / Extend Shopkeeper Payment & Subscription Status
// @route   PATCH /api/users/shopkeepers/:id/payment
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'shopkeeper') {
    return res.status(404).json({ message: 'Shopkeeper not found' });
  }

  const { action, customExpiresAt, plan, status } = req.body;
  const now = new Date();
  const currentExpiry = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now
    ? new Date(user.subscriptionExpiresAt)
    : now;

  if (action === 'extend_month') {
    // Add 30 days to whichever is later (current future expiry or today)
    const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    user.subscriptionExpiresAt = newExpiry;
    user.paymentStatus = 'paid';
    user.subscriptionPlan = 'monthly';
    user.lastPaymentDate = now;
  } else if (action === 'extend_year') {
    // Add 365 days to whichever is later (current future expiry or today)
    const newExpiry = new Date(currentExpiry.getTime() + 365 * 24 * 60 * 60 * 1000);
    user.subscriptionExpiresAt = newExpiry;
    user.paymentStatus = 'paid';
    user.subscriptionPlan = 'yearly';
    user.lastPaymentDate = now;
  } else if (action === 'mark_overdue') {
    user.paymentStatus = 'overdue';
    // Expire immediately
    user.subscriptionExpiresAt = new Date(now.getTime() - 1000);
  } else if (action === 'custom') {
    if (status) user.paymentStatus = status;
    if (plan) user.subscriptionPlan = plan;
    if (customExpiresAt) user.subscriptionExpiresAt = new Date(customExpiresAt);
    user.lastPaymentDate = now;
  } else {
    return res.status(400).json({ message: 'Invalid payment action specified' });
  }

  await user.save();

  res.json({
    message: 'Subscription payment status updated successfully',
    user: {
      _id: user._id,
      name: user.name,
      paymentStatus: user.paymentStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      lastPaymentDate: user.lastPaymentDate,
    },
  });
};

// @desc    Toggle shopkeeper active/inactive status
// @route   PATCH /api/users/shopkeepers/:id/status
// @access  Private/Admin
const toggleShopkeeperStatus = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'shopkeeper') {
    return res.status(404).json({ message: 'Shopkeeper not found' });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    message: `Shopkeeper status updated to ${user.isActive ? 'Active' : 'Inactive'}`,
    user: {
      _id: user._id,
      name: user.name,
      isActive: user.isActive,
    },
  });
};

// @desc    Get Bill Retention & Trading Year Statistics for a Shopkeeper
// @route   GET /api/users/shopkeepers/:id/bill-retention-stats
// @access  Private/Admin
const getBillRetentionStats = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'shopkeeper') {
    return res.status(404).json({ message: 'Shopkeeper not found' });
  }

  const tradingStart = user.tradingYearStartDate ? new Date(user.tradingYearStartDate) : new Date(user.createdAt);
  
  // Total orders for this shopkeeper
  const totalBills = await Order.countDocuments({ shopkeeperId: user._id });

  // Active trading year orders (created on or after tradingYearStartDate)
  const activeCycleBills = await Order.countDocuments({
    shopkeeperId: user._id,
    createdAt: { $gte: tradingStart },
  });

  // Expired / Past trading year orders (created before tradingYearStartDate)
  const expiredBills = await Order.countDocuments({
    shopkeeperId: user._id,
    createdAt: { $lt: tradingStart },
  });

  // Calculate next trading year rollover date (1 year after trading start date)
  const nextTradingYearDate = new Date(tradingStart);
  nextTradingYearDate.setFullYear(nextTradingYearDate.getFullYear() + 1);

  res.json({
    shopkeeperId: user._id,
    shopkeeperName: user.name,
    shopName: user.shopName,
    tradingYearStartDate: tradingStart,
    nextTradingYearDate,
    totalBills,
    activeCycleBills,
    expiredBills,
  });
};

// @desc    Purge past trading year bills older than tradingYearStartDate
// @route   POST /api/users/shopkeepers/:id/purge-bills
// @access  Private/Admin
const purgeShopkeeperOldBills = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'shopkeeper') {
    return res.status(404).json({ message: 'Shopkeeper not found' });
  }

  const tradingStart = user.tradingYearStartDate ? new Date(user.tradingYearStartDate) : new Date(user.createdAt);

  const result = await Order.deleteMany({
    shopkeeperId: user._id,
    createdAt: { $lt: tradingStart },
  });

  res.json({
    message: `Successfully purged ${result.deletedCount} bills older than trading year start date (${tradingStart.toLocaleDateString()}).`,
    deletedCount: result.deletedCount,
    tradingYearStartDate: tradingStart,
  });
};

module.exports = {
  createShopkeeper,
  getShopkeepers,
  updateShopkeeper,
  updatePaymentStatus,
  toggleShopkeeperStatus,
  getBillRetentionStats,
  purgeShopkeeperOldBills,
};
