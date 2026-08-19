import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function seed() {
  try {
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@billbook.com' }});
    if (existingAdmin) {
      console.log("Admin already exists! Use email: admin@billbook.com, password: password123");
      return;
    }
    
    const hash = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@billbook.com',
        password_hash: hash,
        role: 'Admin'
      }
    });
    console.log("Admin created successfully! Use email: admin@billbook.com, password: password123");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
