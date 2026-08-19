const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fakeNames = ['pappa', 'ayush', 'block piston'];
  
  for (const name of fakeNames) {
    const product = await prisma.product.findFirst({ where: { name } });
    if (product) {
      console.log(`Deleting ${name}...`);
      await prisma.inventory.deleteMany({ where: { product_id: product.id } });
      await prisma.stockHistory.deleteMany({ where: { product_id: product.id } });
      await prisma.invoiceItem.deleteMany({ where: { product_id: product.id } });
      await prisma.purchaseItem.deleteMany({ where: { product_id: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
      console.log(`Deleted ${name}.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
