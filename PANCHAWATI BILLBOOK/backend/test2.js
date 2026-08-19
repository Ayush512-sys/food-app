const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany({ include: { inventory: true } }).then(products => {
  const sorted = products.map(p => {
    const qty = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    return { name: p.name, qty, price: p.selling_price, val: qty * p.selling_price };
  }).sort((a, b) => b.val - a.val);
  console.log(sorted.slice(0, 5));
}).finally(() => prisma.$disconnect());
