import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getPayments, getExpenses, createExpense, deleteExpense } from '../controllers/accounting.controller';

const router = express.Router();

router.get('/payments', authenticate, getPayments);
router.get('/expenses', authenticate, getExpenses);
router.post('/expenses', authenticate, createExpense);
router.delete('/expenses/:id', authenticate, deleteExpense);

export default router;
