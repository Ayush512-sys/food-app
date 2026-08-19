import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // 1. Total Sales (Invoices)
    const sales = await prisma.invoice.aggregate({
      _sum: { grand_total: true }
    });
    
    // 2. Total Purchases (Purchase Bills)
    const purchases = await prisma.purchaseBill.aggregate({
      _sum: { total_amount: true }
    });

    // 3. Total Expenses
    const expenses = await prisma.expense.aggregate({
      _sum: { amount: true }
    });

    // 4. Current Inventory Value
    const inventory = await prisma.inventory.findMany({
      include: { product: true }
    });
    const inventoryValue = inventory.reduce((acc: number, item: any) => {
      return acc + (item.quantity * (item.product.purchase_price || 0));
    }, 0);

    res.json({
      totalSales: sales._sum.grand_total || 0,
      totalPurchases: purchases._sum.total_amount || 0,
      totalExpenses: expenses._sum.amount || 0,
      inventoryValue
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

export const getTopProducts = async (req: Request, res: Response) => {
  try {
    // Find top selling products by aggregating invoice items
    const topItems = await prisma.invoiceItem.groupBy({
      by: ['product_id'],
      where: {
        product_id: { not: null }
      },
      _sum: {
        quantity: true,
        line_total: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });

    // Fetch product details for these top items
    const products = await Promise.all(
      topItems.map(async (item) => {
        if (!item.product_id) return null;
        const prod = await prisma.product.findUnique({
          where: { id: item.product_id },
          select: { name: true, code: true }
        });
        return {
          ...prod,
          total_sold: item._sum.quantity,
          total_revenue: item._sum.line_total
        };
      })
    );

    res.json(products.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
};

export const getGstReport = async (req: Request, res: Response) => {
  try {
    const salesGst = await prisma.invoice.aggregate({
      _sum: { gst_amount: true }
    });
    
    // For purchases, if we added GST tracking in the future it would go here. 
    // Currently PurchaseBill doesn't have explicit GST column, we can assume 0 or add it later.
    
    res.json({
      gstCollected: salesGst._sum.gst_amount || 0,
      gstPaid: 0 // Placeholder until Purchase GST is implemented
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GST report' });
  }
};
