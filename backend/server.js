const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { seedAdmin } = require('./controllers/authController');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure MongoDB is connected and admin is seeded before handling API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectDB();
      // Ensure admin exists
      await seedAdmin().catch(() => {});
    } catch (error) {
      console.error('Database connection error in request handler:', error.message);
      return res.status(500).json({
        message: `Database Connection Failed: ${error.message}. Please check Vercel MONGO_URI environment variable and MongoDB Atlas cluster.`,
        error: error.message,
      });
    }
  }
  next();
});

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
