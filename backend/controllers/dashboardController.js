import Order from '../models/Order.js';
import ProductSheet from '../models/ProductSheet.js';
import GlobalCost from '../models/GlobalCost.js';
import mongoose from 'mongoose';
import { calculateOverheadPerOrder } from '../services/overheadService.js';

export const getDashboardSummary = async (req, res) => {
    try {
        const { from, to } = req.query;
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const dateQuery = { userId };

        if (from && to) {
            dateQuery.createdAt = { $gte: new Date(from), $lte: new Date(to) };
        }

        // Aggregate Orders
        const stats = await Order.aggregate([
            { $match: dateQuery },
            {
                $addFields: {
                    additionalTotal: {
                        $reduce: {
                            input: "$additionalCostsSnapshot",
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
                    returnedOrders: { $sum: { $cond: [{ $eq: ["$status", "Returned"] }, 1, 0] } },
                    totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, "$sellingPrice", 0] } },
                    totalCOGS: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "Delivered"] }, { $add: ["$templateCostsSnapshot.total", "$additionalTotal"] }, 0]
                        }
                    },
                    totalReturnLoss: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "Returned"] },
                                { $subtract: [{ $add: ["$templateCostsSnapshot.total", "$additionalTotal", "$returnCharges"] }, { $ifNull: ["$recoveredAmount", 0] }] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const globalCosts = await GlobalCost.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const summary = stats[0] || {
            totalOrders: 0,
            deliveredOrders: 0,
            returnedOrders: 0,
            totalRevenue: 0,
            totalCOGS: 0,
            totalReturnLoss: 0
        };

        const totalGlobalCosts = globalCosts[0]?.total || 0;
        const grossProfit = summary.totalRevenue - (summary.totalCOGS + summary.totalReturnLoss);
        const netProfit = grossProfit - totalGlobalCosts;

        res.json({
            ...summary,
            totalGlobalCosts,
            grossProfit,
            netProfit,
            returnRate: summary.totalOrders > 0 ? (summary.returnedOrders / summary.totalOrders) * 100 : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductAnalytics = async (req, res) => {
    try {
        const { from, to } = req.query;
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const dateQuery = { userId };

        if (from && to) {
            dateQuery.createdAt = { $gte: new Date(from), $lte: new Date(to) };
        }

        const now = new Date();
        const overheadPerOrder = await calculateOverheadPerOrder(req.user.id, now.getMonth(), now.getFullYear());

        const productStats = await Order.aggregate([
            { $match: dateQuery },
            {
                $addFields: {
                    additionalTotal: {
                        $reduce: {
                            input: "$additionalCostsSnapshot",
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.amount", 0] }] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$sku",
                    productName: { $first: "$productName" },
                    totalOrders: { $sum: 1 },
                    deliveredCount: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
                    returnedCount: { $sum: { $cond: [{ $eq: ["$status", "Returned"] }, 1, 0] } },
                    revenue: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, "$sellingPrice", 0] } },
                    cogs: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "Delivered"] },
                                { $add: ["$templateCostsSnapshot.total", "$additionalTotal"] },
                                0
                            ]
                        }
                    },
                    returnLossTotal: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "Returned"] },
                                { $subtract: [{ $add: ["$templateCostsSnapshot.total", "$additionalTotal", "$returnCharges"] }, { $ifNull: ["$recoveredAmount", 0] }] },
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    sku: "$_id",
                    productName: 1,
                    totalOrders: 1,
                    deliveredCount: 1,
                    returnedCount: 1,
                    revenue: 1,
                    totalProductCost: { $add: ["$cogs", "$returnLossTotal", { $multiply: ["$totalOrders", overheadPerOrder] }] },
                    profit: {
                        $subtract: [
                            "$revenue",
                            { $add: ["$cogs", "$returnLossTotal", { $multiply: ["$totalOrders", overheadPerOrder] }] }
                        ]
                    },
                    returnRate: { $multiply: [{ $divide: ["$returnedCount", "$totalOrders"] }, 100] }
                }
            },
            {
                $addFields: {
                    roi: {
                        $cond: [
                            { $gt: ["$totalProductCost", 0] },
                            { $divide: ["$profit", "$totalProductCost"] },
                            0
                        ]
                    }
                }
            },
            { $sort: { profit: -1 } }
        ]);

        res.json(productStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
