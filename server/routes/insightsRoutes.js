import express from 'express';
import { generateInsights } from '../controllers/insightsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', generateInsights);

export default router;
