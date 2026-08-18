const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { seedAdmin } = require('./controllers/authController');
const { seedSampleInventory } = require('./controllers/medicineController');
const User = require('./models/User');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB().then(async (conn) => {
  if (conn) {
    await seedAdmin();
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      await seedSampleInventory(adminUser._id);
    }
  }
}).catch((err) => {
  console.warn('Initial seeding skipped until DB connects:', err.message);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running cleanly', timestamp: new Date() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
