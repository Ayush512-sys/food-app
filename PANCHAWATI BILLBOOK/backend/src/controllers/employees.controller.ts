import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Get all employees
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, created_at: true }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Add a new employee
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userRole = role || 'Staff';

    const user = await prisma.user.create({
      data: { name, email, password_hash, role: userRole }
    });

    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

// Delete an employee
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting the main admin
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (user?.role === 'Admin') {
      const adminCount = await prisma.user.count({ where: { role: 'Admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};
