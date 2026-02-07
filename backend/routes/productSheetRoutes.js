import express from 'express';
import { getProductSheets, saveProductSheet, deleteProductSheet } from '../controllers/productSheetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getProductSheets);
router.post('/', saveProductSheet);
router.delete('/:id', deleteProductSheet);

export default router;
