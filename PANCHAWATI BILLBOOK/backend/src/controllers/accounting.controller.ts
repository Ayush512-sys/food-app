import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all ledgers (payments)
export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        customer: true,
        supplier: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// Get all expenses
export const getExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        user: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

// Create an expense
export const createExpense = async (req: Request, res: Response) => {
  try {
    const { category, amount, payment_mode, remarks, date } = req.body;
    const userId = (req as any).user.id;

    if (!category || !amount) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: Number(amount),
        payment_mode: payment_mode || 'Cash',
        remarks,
        date: date ? new Date(date) : new Date(),
        user_id: userId
      }
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

// Delete an expense
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};
