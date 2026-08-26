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
  searchMasterCatalog,
} = require('../controllers/medicineController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/catalog/search', searchMasterCatalog);
router.post('/ocr-scan', scanPurchaseBill);
router.post('/batch-import', batchImportMedicines);
router.post('/', addMedicine);
router.get('/', getMedicines);
router.get('/:id', getMedicineById);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

module.exports = router;
