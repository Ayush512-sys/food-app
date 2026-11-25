const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_Qy1lV2ZgqBMd@ep-cool-bonus-ao7a6o3z-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true'
    }
  }
});

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('Full Hash:', user.password_hash);
  const candidates = [
    'admin', 'password', 'admin123', 'password123', '123456', '12345678', '1234',
    'panchawati', 'Panchawati', 'Panchawati@123', 'ayush', 'Ayush', 'ayush123',
    'admin@123', 'admin@2026', 'billbook', 'Billbook'
  ];
  for (const c of candidates) {
    const match = await bcrypt.compare(c, user.password_hash);
    if (match) {
      console.log('MATCH FOUND! Password is:', c);
      return;
    }
  }
  console.log('None of the candidates matched.');
}
main().finally(() => prisma.$disconnect());
