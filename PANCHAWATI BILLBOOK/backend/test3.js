const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany({ include: { inventory: true } }).then(products => {
  let val = 0;
  let val2 = 0;
  for (const p of products) {
    const qty = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    val += qty * p.selling_price;
    const price = p.purchase_price > 0 ? p.purchase_price : p.selling_price;
    val2 += qty * price;
  }
  console.log('Total Selling Price Only:', val);
  console.log('Total with Fallback:', val2);
}).finally(() => prisma.$disconnect());
