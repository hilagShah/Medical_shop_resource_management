const express = require('express');
const router = express.Router();
const {
  createShopkeeper,
  getShopkeepers,
  updateShopkeeper,
  updatePaymentStatus,
  toggleShopkeeperStatus,
  getBillRetentionStats,
  purgeShopkeeperOldBills,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.post('/shopkeeper', createShopkeeper);
router.get('/shopkeepers', getShopkeepers);
router.put('/shopkeepers/:id', updateShopkeeper);
router.patch('/shopkeepers/:id/status', toggleShopkeeperStatus);
router.patch('/shopkeepers/:id/payment', updatePaymentStatus);
router.get('/shopkeepers/:id/bill-retention-stats', getBillRetentionStats);
router.post('/shopkeepers/:id/purge-bills', purgeShopkeeperOldBills);

module.exports = router;
