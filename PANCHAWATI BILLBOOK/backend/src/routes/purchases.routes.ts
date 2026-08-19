import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all purchase bills
router.get('/bills', authenticate, async (req, res) => {
  try {
    const bills = await prisma.purchaseBill.findMany({
      include: {
        supplier: true,
        items: { include: { product: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase bills' });
  }
});

export default router;
