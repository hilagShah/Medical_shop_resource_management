const express = require('express');
const router = express.Router();
const {
  addMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  scanPurchaseBill,
  batchImportMedicines,
} = require('../controllers/medicineController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/ocr-scan', scanPurchaseBill);
router.post('/batch-import', batchImportMedicines);
router.post('/', addMedicine);
router.get('/', getMedicines);
router.get('/:id', getMedicineById);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

module.exports = router;
