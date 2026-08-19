const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log("Reading JSON data...");
  const rawData = fs.readFileSync(path.join(__dirname, '../extracted_inventory.json'), 'utf-8');
  const items = JSON.parse(rawData);

  // We already wiped data and inserted categories. Let's just fetch them.
  const categories = await prisma.category.findMany();
  const categoryMap = new Map();
  categories.forEach(c => categoryMap.set(c.name, c.id));
  
  const mainLocation = await prisma.location.findFirst({ where: { name: "Main Shop" } });

  console.log("Preparing products...");
  
  const usedCodes = new Set();
  const productsToCreate = [];
  const stockToCreate = []; // Wait, inventory requires product IDs. We must create products first and get their IDs.
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let itemCode = item.code ? item.code.toString().trim() : '';
    if (!itemCode) itemCode = `SYS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    while (usedCodes.has(itemCode)) itemCode = `${itemCode}-${Math.floor(Math.random() * 1000)}`;
    usedCodes.add(itemCode);

    const categoryId = categoryMap.get(item.category || 'General') || categories[0].id;

    productsToCreate.push({
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
    });
  }

  console.log("Batch inserting products...");
  // Split into chunks of 1000
  const chunkSize = 1000;
  for (let i = 0; i < productsToCreate.length; i += chunkSize) {
    const chunk = productsToCreate.slice(i, i + chunkSize);
    await prisma.product.createMany({ data: chunk, skipDuplicates: true });
    console.log(`Inserted ${i + chunk.length} products`);
  }

  console.log("Fetching inserted products to build inventory...");
  const insertedProducts = await prisma.product.findMany({ select: { id: true, code: true } });
  const productMap = new Map();
  insertedProducts.forEach(p => productMap.set(p.code, p.id));

  console.log("Preparing inventory...");
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemCode = productsToCreate[i].code;
    const stock = parseInt(item.current_stock) || 0;
    
    if (stock > 0 && productMap.has(itemCode)) {
      stockToCreate.push({
        product_id: productMap.get(itemCode),
        location_id: mainLocation.id,
        quantity: stock
      });
    }
  }

  console.log("Batch inserting inventory...");
  for (let i = 0; i < stockToCreate.length; i += chunkSize) {
    const chunk = stockToCreate.slice(i, i + chunkSize);
    await prisma.inventory.createMany({ data: chunk, skipDuplicates: true });
    console.log(`Inserted ${i + chunk.length} inventory records`);
  }

  console.log("✅ Import completed successfully!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
