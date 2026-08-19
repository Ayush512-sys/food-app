import { Request, Response } from 'express';
import { prisma } from '../index';

// --- Customers ---
export const getCustomers = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany();
  res.json(customers);
};
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    res.status(201).json(customer);
  } catch (error) { res.status(500).json({ error }); }
};

// --- Suppliers ---
export const getSuppliers = async (req: Request, res: Response) => {
  const suppliers = await prisma.supplier.findMany();
  res.json(suppliers);
};
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    res.status(201).json(supplier);
  } catch (error) { res.status(500).json({ error }); }
};

// --- Purchase Bills (Increases Stock) ---
export const createPurchaseBill = async (req: Request, res: Response) => {
  try {
    const { supplier_id, invoice_number, date, total_amount, items, location_id } = req.body;
    const userId = (req as any).user.id;

    const result = await prisma.$transaction(async (tx) => {
      const cleanPurchaseItems = items.map((i: any) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        purchase_price: i.purchase_price || i.unit_price || 0,
        line_total: i.line_total
      }));

      const bill = await tx.purchaseBill.create({
        data: {
          supplier_id, invoice_number, date: new Date(date), total_amount, user_id: userId,
          items: { create: cleanPurchaseItems }
        },
        include: { items: true }
      });

      for (let item of bill.items) {
        let inv = await tx.inventory.findUnique({
          where: { product_id_location_id: { product_id: item.product_id, location_id: location_id || 1 } }
        });
        if (!inv) {
          inv = await tx.inventory.create({ data: { product_id: item.product_id, location_id: location_id || 1, quantity: 0 } });
        }
        const previous_qty = inv.quantity;
        const new_qty = previous_qty + item.quantity;

        await tx.inventory.update({ where: { id: inv.id }, data: { quantity: new_qty } });

        await tx.stockHistory.create({
          data: {
            product_id: item.product_id, location_id: location_id || 1, action: "Added",
            quantity: item.quantity, previous_qty, new_qty, user_id: userId,
            reference_type: "PurchaseBill", reference_id: bill.id
          }
        });
      }

      // Record Payment if paid_amount > 0
      const paid_amount = req.body.paid_amount || 0;
      if (paid_amount > 0) {
        await tx.payment.create({
          data: {
            amount: paid_amount,
            payment_mode: req.body.payment_method || 'Cash',
            type: 'Pay',
            supplier_id: supplier_id,
            purchase_bill_id: bill.id
          }
        });
      }

      // Update Supplier Ledger (Outstanding Payable)
      const due_amount = total_amount - paid_amount;
      if (due_amount > 0) {
        await tx.supplier.update({
          where: { id: supplier_id },
          data: {
            outstanding_payable: { increment: due_amount }
          }
        });
      }

      return bill;
    });

    res.status(201).json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

// --- Sales Invoices (Decreases Stock) ---
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { customer_id, items, payment_method, location_id, discount, gst_amount, paid_amount } = req.body;
    const userId = (req as any).user.id;

    const total_qty = items.reduce((acc: any, item: any) => acc + item.quantity, 0);
    const subtotal = items.reduce((acc: any, item: any) => acc + item.line_total, 0);
    const grand_total = subtotal - (discount || 0) + (gst_amount || 0);
    const due_amount = grand_total - (paid_amount || 0);
    const status = due_amount <= 0 ? 'Paid' : (paid_amount > 0 ? 'Partial' : 'Unpaid');

    const result = await prisma.$transaction(async (tx) => {
      // Auto-generate invoice number based on count
      const count = await tx.invoice.count();
      const invoice_number = `INV-2026-${String(count + 1).padStart(6, '0')}`;

      const cleanItems = items.map((i: any) => ({
        product_id: i.product_id || null, // null for custom items
        custom_name: i.custom_name || null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.line_total,
        discount: i.discount || 0,
        gst_amount: i.gst_amount || 0
      }));

      const invoice = await tx.invoice.create({
        data: {
          invoice_number, customer_id, total_items: items.length, total_qty, subtotal,
          discount: discount || 0, gst_amount: gst_amount || 0, grand_total, paid_amount: paid_amount || 0, due_amount,
          payment_method: payment_method || 'Cash', status, user_id: userId,
          items: { create: cleanItems }
        },
        include: { items: true }
      });

      for (let item of invoice.items) {
        // Skip inventory deduction for custom items
        if (!item.product_id) continue;

        const inv = await tx.inventory.findUnique({
          where: { product_id_location_id: { product_id: item.product_id, location_id: location_id || 1 } }
        });
        
        if (!inv || inv.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ID: ${item.product_id}`);
        }

        const previous_qty = inv.quantity;
        const new_qty = previous_qty - item.quantity;

        await tx.inventory.update({ where: { id: inv.id }, data: { quantity: new_qty } });

        await tx.stockHistory.create({
          data: {
            product_id: item.product_id, location_id: location_id || 1, action: "Sold",
            quantity: item.quantity, previous_qty, new_qty, user_id: userId,
            reference_type: "Invoice", reference_id: invoice.id
          }
        });
      }

      // Record Payment if paid_amount > 0
      if (paid_amount > 0) {
        await tx.payment.create({
          data: {
            amount: paid_amount,
            payment_mode: payment_method || 'Cash',
            type: 'Receive',
            customer_id: customer_id,
            invoice_id: invoice.id
          }
        });
      }

      // Update Customer Ledger (Outstanding Balance)
      if (due_amount > 0) {
        await tx.customer.update({
          where: { id: customer_id },
          data: {
            outstanding_balance: { increment: due_amount }
          }
        });
      }

      return invoice;
    });

    res.status(201).json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

export const getInvoices = async (req: Request, res: Response) => {
  const invoices = await prisma.invoice.findMany({ include: { customer: true } });
  res.json(invoices);
};
