const User = require('../models/User');

// @desc    Create a new Shopkeeper
// @route   POST /api/users/shopkeeper
// @access  Private/Admin
const createShopkeeper = async (req, res) => {
  const { name, email, password, shopName, phone, isActive } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'shopkeeper',
    shopName: shopName || 'Branch Store',
    phone: phone || '',
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopName: user.shopName,
    phone: user.phone,
    isActive: user.isActive,
  });
};

// @desc    Get all shopkeepers (with search & filter)
// @route   GET /api/users/shopkeepers
// @access  Private/Admin
const getShopkeepers = async (req, res) => {
  const { search, status } = req.query;

  let query = { role: 'shopkeeper' };

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { shopName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const shopkeepers = await User.find(query).select('-password').sort({ createdAt: -1 });
  res.json(shopkeepers);
};

// @desc    Update shopkeeper details
// @route   PUT /api/users/shopkeepers/:id
// @access  Private/Admin
const updateShopkeeper = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'shopkeeper') {
    return res.status(404).json({ message: 'Shopkeeper not found' });
  }

  const { name, email, shopName, phone, isActive, password } = req.body;

  user.name = name || user.name;
  user.email = email || user.email;
  user.shopName = shopName || user.shopName;
  user.phone = phone !== undefined ? phone : user.phone;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = password;

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    shopName: updatedUser.shopName,
    phone: updatedUser.phone,
    isActive: updatedUser.isActive,
  });
};

// @desc    Toggle shopkeeper status (Active/Inactive)
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

module.exports = {
  createShopkeeper,
  getShopkeepers,
  updateShopkeeper,
  toggleShopkeeperStatus,
};
