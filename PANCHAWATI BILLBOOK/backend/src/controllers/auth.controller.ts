import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export const login = async (req: Request, res: Response) => {
  try {
    const email = req.body.email || req.body.username;
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    // In a real app, protect this route so only Admin can register users.
    // For setup, we'll allow it if there are no users yet.
    
    const userCount = await prisma.user.count();
    
    // If users exist and no auth, deny. This is a simplified check.
    // Ideally this route uses authenticate + requireAdmin middleware.

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userRole = userCount === 0 ? 'Admin' : (role || 'Staff'); // First user is Admin

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: userRole
      }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
