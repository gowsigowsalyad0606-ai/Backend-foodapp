import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load environment variables immediately after imports
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import restaurantRoutes from './routes/restaurants';
import menuItemRoutes from './routes/menuItems';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import categoryRoutes from './routes/categoryRoutes';
import paymentRoutes from './routes/paymentRoutes';
import notificationRoutes from './routes/notificationRoutes';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
// Relax security headers in development to debug connectivity
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginResourcePolicy: process.env.NODE_ENV === 'production' ? undefined : { policy: "cross-origin" }
}));

// Add a simple request logger to verify if traffic is reaching the server
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
  }
  next();
});

app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection (skip for development without MongoDB)
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('YOUR_PASSWORD')) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
    })
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      console.log('⚠️  Running without database - some features may not work');
    });
} else {
  console.log('⚠️  Running without database - configure MONGODB_URI in .env for full functionality');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const HOST = '0.0.0.0'; // Listen on all network interfaces
app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📱 For Emulator, use: http://10.0.2.2:${PORT}/api`);
});
