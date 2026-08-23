const User = require('../models/User');
const { generateToken } = require('../middlewares/authMiddleware');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is inactive. Contact Admin.' });
    }

    const isExpired = user.role === 'shopkeeper' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date();
    const effectivePaymentStatus = isExpired ? 'overdue' : (user.paymentStatus || 'paid');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopName: user.shopName,
      phone: user.phone,
      isActive: user.isActive,
      paymentStatus: effectivePaymentStatus,
      subscriptionPlan: user.subscriptionPlan || 'monthly',
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      tradingYearStartDate: user.tradingYearStartDate,
      monthlyFee: user.monthlyFee || 0,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// Seed default Admin if no admin exists
const seedAdmin = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@medshop.com',
        password: 'admin123',
        role: 'admin',
        shopName: 'Central Admin',
        phone: '+1 800-MED-SHOP',
        isActive: true,
      });
      console.log(`Default admin created: ${admin.email} / admin123`);
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

module.exports = { loginUser, getMe, seedAdmin };
