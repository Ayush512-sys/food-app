import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all sales invoices
router.get('/invoices', authenticate, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

export default router;
