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
        email: "admin@billbook.com",
        password_hash: hashedPassword,
        role: "Admin",
        name: "Shop Owner"
      }
    });
    console.log("Created admin user: username=admin, password=admin123");
  } else {
    console.log("Existing users:");
    users.forEach(u => console.log(`Username: ${u.username}, Role: ${u.role}`));
    
    // reset admin password just in case
    const admin = users.find(u => u.username === 'admin');
    if (admin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.update({
            where: { id: admin.id },
            data: { password: hashedPassword }
        });
        console.log("Reset admin password to 'admin123'");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
