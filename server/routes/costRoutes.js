import express from 'express';
import { getGlobalCosts, createGlobalCost, deleteGlobalCost, getCostsByOrder } from '../controllers/costController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getGlobalCosts);
router.get('/order/:orderId', getCostsByOrder);
router.post('/', createGlobalCost);
router.delete('/:id', deleteGlobalCost);

export default router;
