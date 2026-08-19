const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.log("No users found. Creating default admin...");
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@panchawati.com',
        name: 'Admin',
        password_hash: hashedPassword,
        role: 'Admin'
      }
    });
    console.log("Created admin user: email=admin@panchawati.com, password=admin123");
  } else {
    console.log("Existing users:", users.map(u => u.email).join(', '));
    const admin = users[0];
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
        where: { id: admin.id },
        data: { password_hash: hashedPassword }
    });
    console.log(`Reset admin password to 'admin123' for ${admin.email}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
