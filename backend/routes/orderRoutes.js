const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  getAnalytics,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/analytics', authorize('admin'), getAnalytics);
router.get('/:id', getOrderById);

module.exports = router;
