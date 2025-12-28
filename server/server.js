import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/product-sheets', productSheetRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/company', companyRoutes);

app.get('/', (req, res) => {
    res.send('OrderProfit API is running...');
});

// DB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/orderprofit')
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
