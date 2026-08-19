const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const seedData = require('./seed');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this
    methods: ['GET', 'POST']
  }
});

// Attach socket io to the app so routes can use it
app.set('io', io);

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: '*', // In production, replace with specific frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-simulated-time', 'x-simulated-date', 'Bypass-Tunnel-Reminder', 'localtunnel-warning']
}));

// Rate limiting (Basic protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased limit since all devices share proxy IP during testing
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Connect to Database
connectDB().then(() => {
  // Seed initial data
  seedData();
});

// Import route files
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const feedbackRoutes = require('./routes/feedback');
const complaintRoutes = require('./routes/complaints');
const menuRoutes = require('./routes/menu');
const paymentRoutes = require('./routes/payments');
const forecastingRoutes = require('./routes/forecasting');
const wasteRoutes = require('./routes/waste');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const announcementRoutes = require('./routes/announcements');
const notificationRoutes = require('./routes/notifications');
const managerRoutes = require('./routes/managers');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/forecasting', forecastingRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/managers', managerRoutes);

// Static file serving for React frontend
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Ensure that API requests that are not found don't return the HTML
app.use('/api', (req, res, next) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// For any other route, send the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
