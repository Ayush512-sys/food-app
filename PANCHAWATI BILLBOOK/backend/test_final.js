const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany({ include: { inventory: true } }).then(products => {
  let val = 0;
  for (const p of products) {
    const qty = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const price = p.purchase_price > 0 ? p.purchase_price : p.selling_price;
    val += qty * price;
  }
  console.log('Final Calculated Value:', val);
}).finally(() => prisma.$disconnect());
