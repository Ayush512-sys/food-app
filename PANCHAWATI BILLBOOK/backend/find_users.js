const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_Qy1lV2ZgqBMd@ep-cool-bonus-ao7a6o3z-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true'
    }
  }
});

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('USERS FOUND:');
    users.forEach(u => {
      console.log(`ID: ${u.id}, Name: ${u.name}, Email: "${u.email}", Role: ${u.role}, PasswordHash: ${u.password_hash.substring(0, 10)}...`);
    });
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
