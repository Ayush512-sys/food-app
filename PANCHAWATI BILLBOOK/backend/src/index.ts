import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

import authRoutes from './routes/auth.routes';
import inventoryRoutes from './routes/inventory.routes';
import billingRoutes from './routes/billing.routes';
import salesRoutes from './routes/sales.routes';
import purchasesRoutes from './routes/purchases.routes';
import partiesRoutes from './routes/parties.routes';
import accountingRoutes from './routes/accounting.routes';
import reportsRoutes from './routes/reports.routes';
import employeesRoutes from './routes/employees.routes';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/parties', partiesRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/employees', employeesRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BillBook Backend is running!' });
});

// Start server only if not in Vercel serverless environment
if (!process.env.VERCEL) {
  httpServer.listen(port as number, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
export { app, prisma, io };
