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

// Database connection function for serverless
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('CRITICAL: MONGODB_URI is missing in production environment');
        return;
    }

    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected to Atlas');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err; // Rethrow to let the middleware handle it
    }
};

// IMPORTANT: Middleware to ensure DB is connected BEFORE routes
app.use(async (req, res, next) => {
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

// Root API Diagnostic
app.get('/api', (req, res) => {
    const status = mongoose.connection.readyState;
    const states = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };
    res.json({
        message: 'OrderProfit Live API is running...',
        database: states[status],
        envVariables: {
            MONGODB_URI: process.env.MONGODB_URI ? 'Present (Hidden)' : 'MISSING',
            JWT_SECRET: process.env.JWT_SECRET ? 'Present' : 'MISSING',
            NODE_ENV: process.env.NODE_ENV
        },
        timestamp: new Date().toISOString()
    });
});

export default app;
