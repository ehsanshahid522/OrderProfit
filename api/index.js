import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes directly from the server folder
import authRoutes from '../server/routes/authRoutes.js';
import productSheetRoutes from '../server/routes/productSheetRoutes.js';
import orderRoutes from '../server/routes/orderRoutes.js';
import costRoutes from '../server/routes/costRoutes.js';
import dashboardRoutes from '../server/routes/dashboardRoutes.js';
import insightsRoutes from '../server/routes/insightsRoutes.js';
import companyRoutes from '../server/routes/companyRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/product-sheets', productSheetRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/company', companyRoutes);

// Keep root API info
app.get('/api', (req, res) => {
    const status = mongoose.connection.readyState;
    const states = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };
    res.json({
        message: 'OrderProfit Vercel API is running...',
        database: states[status],
        envLoaded: !!process.env.MONGODB_URI
    });
});

// Database connection function for serverless
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;

    if (!process.env.MONGODB_URI) {
        console.error('CRITICAL: MONGODB_URI is missing in production environment');
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/orderprofit');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

// Middleware to ensure DB is connected before handling request
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

export default app;
