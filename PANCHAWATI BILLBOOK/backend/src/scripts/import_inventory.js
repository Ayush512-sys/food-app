const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting bulk import...');
  const jsonPath = path.resolve(process.cwd(), '../extracted_inventory.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('Extracted JSON file not found at:', jsonPath);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const items = JSON.parse(rawData);
  console.log(`Found ${items.length} items to import.`);

  // 1. Ensure the default location exists
  let mainLocation = await prisma.location.findUnique({ where: { name: 'Main Shop' } });
  if (!mainLocation) {
    mainLocation = await prisma.location.create({
      data: { name: 'Main Shop', type: 'Main Shop' }
    });
  }

  // 2. Ensure an Admin user exists for StockHistory user_id tracking
  let admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: { name: 'System Admin', email: 'admin@system.local', role: 'admin', password_hash: 'hashed_pw' }
    });
  }

  // 3. Extract unique categories and create them
  console.log('Extracting and creating categories...');
  const uniqueCategories = Array.from(new Set(items.map(item => item.category || 'Uncategorized')));
  
  const categoryMap = new Map();
  for (const catName of uniqueCategories) {
    let category = await prisma.category.findUnique({ where: { name: catName } });
    if (!category) {
      category = await prisma.category.create({ data: { name: catName } });
    }
    categoryMap.set(catName, category.id);
  }

  console.log(`Prepared ${categoryMap.size} categories. Starting product imports...`);

  // 4. Import products
  let importedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    try {
      // Create product
      let productCode = item.code || `ITEM-${Math.floor(Math.random() * 10000000)}`;
      
      // Ensure unique code
      let exists = await prisma.product.findUnique({ where: { code: productCode } });
      if (exists) {
         productCode = `${productCode}-${Math.floor(Math.random() * 10000)}`;
      }

      const product = await prisma.product.create({
        data: {
          name: item.name,
          code: productCode,
          category_id: categoryMap.get(item.category || 'Uncategorized'),
          description: item.description,
          purchase_price: item.purchase_price,
          selling_price: item.selling_price,
          gst_rate: item.gst_rate,
          min_stock: item.min_stock,
          unit: 'PCS',
          inventory: {
            create: {
              location_id: mainLocation.id,
              quantity: item.current_stock
            }
          }
        }
      });

      // Create StockHistory for opening stock
      if (item.current_stock > 0) {
        await prisma.stockHistory.create({
          data: {
            product_id: product.id,
            location_id: mainLocation.id,
            action: 'Opening Stock',
            quantity: item.current_stock,
            previous_qty: 0,
            new_qty: item.current_stock,
            user_id: admin.id,
            reference_type: 'Bulk Import'
          }
        });
      }

      importedCount++;
      if (importedCount % 500 === 0) {
        console.log(`Imported ${importedCount} items...`);
      }
    } catch (err) {
      console.error(`Failed to import item: ${item.name}`);
      skippedCount++;
    }
  }

  console.log(`Import Complete! Successfully imported: ${importedCount}, Skipped/Errors: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => {
    prisma.$disconnect();
  });
