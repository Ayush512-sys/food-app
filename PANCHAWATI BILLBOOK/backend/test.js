const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findFirst({ where: { name: 'ARF SUPER XL FUEL TANK CAP' }, include: { inventory: true } }).then(console.log).finally(() => prisma.$disconnect());
