import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

import authRoutes from './routes/authRoutes.js';
import productSheetRoutes from './routes/productSheetRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import costRoutes from './routes/costRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import insightsRoutes from './routes/insightsRoutes.js';
import companyRoutes from './routes/companyRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logging Helper
const logEvent = (msg) => {
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync('db-events.log', `[${timestamp}] ${msg}\n`);
    } catch (e) {
        // Silently ignore log errors
    }
    console.log(`[${timestamp}] ${msg}`);
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/product-sheets', productSheetRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/company', companyRoutes);

app.get('/', (req, res) => {
    const status = mongoose.connection.readyState;
    const states = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };
    const uriRaw = process.env.MONGODB_URI || '';
    res.json({
        message: 'OrderProfit API is running...',
        database: states[status],
        uriPrefix: uriRaw.substring(0, 15),
        envLoaded: !!process.env.MONGODB_URI
    });
});

// DB Connection Listeners
mongoose.connection.on('connected', () => logEvent('Mongoose connected to DB'));
mongoose.connection.on('error', (err) => logEvent(`Mongoose connection error: ${err.message}`));
mongoose.connection.on('disconnected', () => logEvent('Mongoose disconnected'));

logEvent('Attempting to connect to MongoDB...');
// DB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/orderprofit')
    .then(() => {
        logEvent('Initial connection successful');
        app.listen(PORT, () => logEvent(`Server running on port ${PORT}`));
    })
    .catch((err) => logEvent(`Initial connection failed: ${err.message}`));

export default app;
