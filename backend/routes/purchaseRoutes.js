const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getSuppliersSummary,
  getPurchaseById,
  createPurchase,
} = require('../controllers/purchaseController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getPurchases);
router.get('/suppliers-summary', getSuppliersSummary);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);

module.exports = router;
