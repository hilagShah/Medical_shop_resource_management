const express = require('express');
const router = express.Router();
const {
  createShopkeeper,
  getShopkeepers,
  updateShopkeeper,
  toggleShopkeeperStatus,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.post('/shopkeeper', createShopkeeper);
router.get('/shopkeepers', getShopkeepers);
router.put('/shopkeepers/:id', updateShopkeeper);
router.patch('/shopkeepers/:id/status', toggleShopkeeperStatus);

module.exports = router;
