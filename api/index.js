import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes directly from the backend folder
import authRoutes from '../backend/routes/authRoutes.js';
import productSheetRoutes from '../backend/routes/productSheetRoutes.js';
import orderRoutes from '../backend/routes/orderRoutes.js';
import costRoutes from '../backend/routes/costRoutes.js';
import dashboardRoutes from '../backend/routes/dashboardRoutes.js';
import insightsRoutes from '../backend/routes/insightsRoutes.js';
import companyRoutes from '../backend/routes/companyRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Database connection function for serverless
let cachedError = null;
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        cachedError = 'CRITICAL: MONGODB_URI is missing';
        console.error(cachedError);
        return;
    }

    try {
        await mongoose.connect(uri);
        console.log('MongoDB Connected');
        cachedError = null;
    } catch (err) {
        cachedError = `MongoDB connection error: ${err.message}`;
        console.error(cachedError);
        throw err;
    }
};

// Health Check / Diagnostic
app.get('/api/health', async (req, res) => {
    try {
        await connectDB();
        const status = mongoose.connection.readyState;
        res.json({
            status: 'ok',
            database: status === 1 ? 'Connected' : 'Disconnected',
            connectionError: cachedError,
            env: {
                hasUri: !!process.env.MONGODB_URI,
                hasSecret: !!process.env.JWT_SECRET
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Root API info
app.get('/api', (req, res) => {
    const status = mongoose.connection.readyState;
    res.json({
        message: 'OrderProfit Live API is running...',
        versionLabel: 'V2_Bismillah_Traders_Fix',
        database: status === 1 ? 'Connected' : 'Disconnected',
        envVariables: {
            MONGODB_URI: process.env.MONGODB_URI ? 'Present' : 'MISSING',
            JWT_SECRET: process.env.JWT_SECRET ? 'Present' : 'MISSING'
        }
    });
});

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
    if (req.path === '/api/health' || req.path === '/api') return next();
    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(500).json({
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/product-sheets', productSheetRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/company', companyRoutes);

export default app;
