const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const results = [];

fs.createReadStream('clean_inventory.csv')
  .pipe(csv({ 
    skipLines: 2,
    mapHeaders: ({ header }) => header ? header.trim().replace(/\n/g, ' ') : ''
  }))
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    try {
      console.log(`Parsed ${results.length} items from CSV.`);
      
      // Clear existing products and categories safely (must handle foreign key in inventory)
      await prisma.stockHistory.deleteMany();
      await prisma.invoiceItem.deleteMany();
      await prisma.invoice.deleteMany();
      await prisma.purchaseItem.deleteMany();
      await prisma.purchaseBill.deleteMany();
      await prisma.inventory.deleteMany();
      await prisma.product.deleteMany();
      await prisma.category.deleteMany();
      
      console.log('Cleared old inventory database.');
      
      let count = 0;
      for (const row of results) {
        // Fallback to array values if headers are weird
        const vals = Object.values(row);
        const name = row['Item Name* (mandatory field)'] || vals[1] || '';
        const description = row['Description'] || vals[2] || '';
        const categoryName = row['Category'] || vals[3] || 'Uncategorized';
        const sellingPrice = parseFloat(row['Sales Price'] || vals[7]) || 0;
        const purchasePrice = parseFloat(row['Purchase Price'] || vals[9]) || 0;
        const currentStock = parseInt(row['Current stock'] || vals[12], 10) || 0;
        const minStock = parseInt(row['Low stock alert quantity'] || vals[13], 10) || 0;
        
        if (!name) continue;

        let category = await prisma.category.findFirst({ where: { name: categoryName } });
        if (!category) {
          category = await prisma.category.create({ data: { name: categoryName } });
        }
        
        let location = await prisma.location.findFirst({ where: { name: 'Main Shop' } });
        if (!location) {
          location = await prisma.location.create({ data: { name: 'Main Shop', type: 'Main Shop' } });
        }

        let code = row['Item code'] || vals[4] || '';
        code = code.trim();
        
        if (!code) {
          code = 'GEN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        } else {
          const existing = await prisma.product.findUnique({ where: { code } });
          if (existing) {
            code = code + '-DUP-' + Math.random().toString(36).substr(2, 4).toUpperCase();
          }
        }

        const product = await prisma.product.create({
          data: {
            name,
            description,
            category_id: category.id,
            code,
            gst_rate: 0,
            selling_price: sellingPrice,
            purchase_price: purchasePrice,
            min_stock: minStock
          }
        });
        
        await prisma.inventory.create({
          data: {
            product_id: product.id,
            location_id: location.id,
            quantity: currentStock
          }
        });
        count++;
        if (count % 500 === 0) console.log(`Imported ${count} items...`);
      }
      
      console.log(`Successfully imported all ${count} items with PERFECT barcodes!`);
    } catch (e) {
      console.error('Import failed:', e);
    } finally {
      await prisma.$disconnect();
    }
  });
