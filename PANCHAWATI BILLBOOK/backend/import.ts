import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log("Wiping old data...");
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.stockHistory.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("Reading JSON data...");
  const rawData = fs.readFileSync(path.join(__dirname, '../extracted_inventory.json'), 'utf-8');
  const items = JSON.parse(rawData);

  // 1. Extract Unique Categories
  const uniqueCategories = [...new Set(items.map((i: any) => i.category || 'General'))] as string[];
  console.log(`Found ${uniqueCategories.length} categories.`);
  
  const categoryMap = new Map<string, number>();
  for (const catName of uniqueCategories) {
    const cat = await prisma.category.create({
      data: { name: catName }
    });
    categoryMap.set(catName, cat.id);
  }

  // Find default location
  let mainLocation = await prisma.location.findFirst({ where: { name: "Main Shop" }});
  if (!mainLocation) {
    mainLocation = await prisma.location.create({ data: { name: "Main Shop", type: "Main Shop" } });
  }

  console.log("Importing products and inventory...");
  
  const usedCodes = new Set<string>();
  
  for (const item of items) {
    // Generate unique code if empty or duplicate
    let itemCode = item.code?.toString().trim();
    if (!itemCode) {
      itemCode = `SYS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
    while (usedCodes.has(itemCode)) {
      itemCode = `${itemCode}-${Math.floor(Math.random() * 1000)}`;
    }
    usedCodes.add(itemCode);

    const categoryId = categoryMap.get(item.category || 'General')!;

    const product = await prisma.product.create({
      data: {
        name: item.name || 'Unknown',
        code: itemCode,
        barcode: itemCode,
        description: item.description || '',
        category_id: categoryId,
        purchase_price: parseFloat(item.purchase_price) || 0,
        selling_price: parseFloat(item.selling_price) || 0,
        gst_rate: parseFloat(item.gst_rate) || 0,
        min_stock: parseInt(item.min_stock) || 0,
        unit: 'pcs',
      }
    });

    const stock = parseInt(item.current_stock) || 0;
    
    if (stock > 0) {
      await prisma.inventory.create({
        data: {
          product_id: product.id,
          location_id: mainLocation.id,
          quantity: stock
        }
      });
    }
  }

  console.log("✅ Import completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
