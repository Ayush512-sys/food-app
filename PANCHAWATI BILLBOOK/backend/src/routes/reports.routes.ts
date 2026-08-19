import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getDashboardSummary, getTopProducts, getGstReport } from '../controllers/reports.controller';

const router = express.Router();

router.get('/dashboard', authenticate, getDashboardSummary);
router.get('/top-products', authenticate, getTopProducts);
router.get('/gst', authenticate, getGstReport);

export default router;
