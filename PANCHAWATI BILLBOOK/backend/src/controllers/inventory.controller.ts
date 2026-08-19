import { Request, Response } from 'express';
import { prisma } from '../index';

// --- Categories ---
export const getCategories = async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
};
export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json(category);
  } catch (error) { res.status(500).json({ error }); }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(category);
  } catch (error) { res.status(500).json({ error }); }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // Check if category has products
    const products = await prisma.product.count({ where: { category_id: parseInt(id) } });
    if (products > 0) {
       return res.status(400).json({ message: "Cannot delete category because it has products assigned to it." });
    }
    await prisma.category.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) { res.status(500).json({ error }); }
};

// --- Locations (Warehouses) ---
export const getLocations = async (req: Request, res: Response) => {
  const locations = await prisma.location.findMany();
  res.json(locations);
};
export const createLocation = async (req: Request, res: Response) => {
  try {
    const location = await prisma.location.create({ data: req.body });
    res.status(201).json(location);
  } catch (error) { res.status(500).json({ error }); }
};

// --- Products ---
export const getProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({ include: { category: true, inventory: true } });
  res.json(products);
};
export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (!data.code || data.code.trim() === '') {
      data.code = `ITEM-${Math.floor(Math.random() * 1000000)}`;
    }
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (error: any) { 
    console.error("Failed to create product:", error);
    res.status(500).json({ error: error.message || error }); 
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(product);
  } catch (error) { res.status(500).json({ error }); }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // Delete associated inventory and history first due to foreign key constraints
    await prisma.stockHistory.deleteMany({ where: { product_id: parseInt(id) } });
    await prisma.inventory.deleteMany({ where: { product_id: parseInt(id) } });
    await prisma.product.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) { res.status(500).json({ error }); }
};

export const getProductHistory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const history = await prisma.stockHistory.findMany({
      where: { product_id: id },
      orderBy: { date: 'desc' },
      include: { user: true, location: true }
    });
    res.json(history);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
};

// --- Inventory ---
export const getInventory = async (req: Request, res: Response) => {
  const inventory = await prisma.inventory.findMany({ include: { product: true, location: true } });
  res.json(inventory);
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { product_id, location_id, quantity, action, reason, device_type, geo_location, reference_type } = req.body;
    const userId = (req as any).user.id;

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      let inv = await tx.inventory.findUnique({
        where: { product_id_location_id: { product_id, location_id } }
      });
      if (!inv) {
        inv = await tx.inventory.create({ data: { product_id, location_id, quantity: 0 } });
      }

      const previous_qty = inv.quantity;
      let new_qty = previous_qty;

      if (action === 'Increase') new_qty += quantity;
      else if (action === 'Decrease' || action === 'Damaged' || action === 'Missing') new_qty -= quantity;

      if (new_qty < 0) throw new Error("Stock cannot be negative");

      const updatedInv = await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: new_qty }
      });

      const history = await tx.stockHistory.create({
        data: {
          product_id, location_id, action: action || 'Adjusted',
          quantity, previous_qty, new_qty, user_id: userId,
          reference_type: reference_type || "Adjustment",
          device_type: device_type || null,
          geo_location: geo_location || null
        }
      });

      return { updatedInv, history };
    });
    
    // Broadcast via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('stock_updated', {
        product_id,
        location_id,
        new_qty: result.updatedInv.quantity,
        action,
        timestamp: new Date()
      });
    }

    res.json(result);
  } catch (error: any) { 
    res.status(error.message === "Stock cannot be negative" ? 400 : 500).json({ error: error.message }); 
  }
};

export const scanProduct = async (req: Request, res: Response) => {
  try {
    const barcode = req.params.barcode as string;
    const searchTerms = [barcode, barcode.toUpperCase(), barcode.toLowerCase()];
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { barcode: { in: searchTerms } },
          { code: { in: searchTerms } },
          { sku: { in: searchTerms } },
          { oem_number: { in: searchTerms } },
          { name: { contains: barcode } }
        ]
      },
      include: {
        inventory: {
          include: { location: true }
        },
        category: true
      }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found for this barcode." });
    }

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
