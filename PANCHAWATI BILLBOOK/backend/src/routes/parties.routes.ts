import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all customers
router.get('/customers', authenticate, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get all suppliers
router.get('/suppliers', authenticate, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

export default router;
