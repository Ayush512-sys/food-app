const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ include: { inventory: true } });
  let purchaseValue = 0;
  let sellingValue = 0;
  let missingPurchaseCount = 0;
  let zeroQtyCount = 0;
  
  for (const p of products) {
    const qty = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    purchaseValue += (qty * p.purchase_price);
    sellingValue += (qty * p.selling_price);
    if (!p.purchase_price || p.purchase_price === 0) missingPurchaseCount++;
    if (qty === 0) zeroQtyCount++;
  }
  console.log({ totalItems: products.length, purchaseValue, sellingValue, missingPurchaseCount, zeroQtyCount });
}

main().finally(() => prisma.$disconnect());
