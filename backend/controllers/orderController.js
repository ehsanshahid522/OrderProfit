import Order from '../models/Order.js';
import ProductSheet from '../models/ProductSheet.js';
import { calculateOverheadPerOrder } from '../services/overheadService.js';

export const createOrder = async (req, res) => {
    try {
        const {
            orderNo, orderNumber,
            sku,
            productName,
            sellingPrice, orderPrice,
            status, deliveryStatus,
            additionalSnapshot
        } = req.body;

        const finalOrderNo = orderNo || orderNumber;
        const finalSellingPrice = Number(sellingPrice || orderPrice) || 0;
        const rawStatus = status || deliveryStatus || 'In-Transit';

        const statusMap = {
            'delivered': 'Delivered',
            'returned': 'Returned',
            'cancelled': 'Cancelled',
            'pending': 'In-Transit'
        };
        const finalStatus = statusMap[rawStatus.toLowerCase()] || 'In-Transit';

        let sheet = null;
        if (sku) {
            sheet = await ProductSheet.findOne({ userId: req.user.id, sku });
        }

        if (!sheet && productName) {
            sheet = await ProductSheet.findOne({
                userId: req.user.id,
                productName: { $regex: new RegExp(`^${productName}$`, 'i') }
            });
        }

        let templateSnapshot = {
            baseCost: 0,
            marketingCost: 0,
            salaryCost: 0,
            otherFixedCosts: 0,
            customCosts: [],
            total: 0
        };

        if (sheet) {
            const sc = {
                base: Number(sheet.baseCost) || 0,
                marketing: Number(sheet.marketingCost) || 0,
                salary: Number(sheet.salaryCost) || 0,
                fixed: Number(sheet.otherFixedCosts) || 0
            };
            const customTotal = (sheet.customCosts || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
            const total = sc.base + sc.marketing + sc.salary + sc.fixed + customTotal;

            templateSnapshot = {
                baseCost: sc.base,
                marketingCost: sc.marketing,
                salaryCost: sc.salary,
                otherFixedCosts: sc.fixed,
                customCosts: (sheet.customCosts || []).map(c => ({ name: c.name, amount: Number(c.amount) || 0 })),
                total
            };
        }

        const order = await Order.create({
            userId: req.user.id,
            orderNo: finalOrderNo,
            sku: sku || (sheet ? sheet.sku : 'N/A'),
            productName: productName || (sheet ? sheet.productName : ''),
            sellingPrice: finalSellingPrice,
            status: finalStatus,
            templateCostsSnapshot: templateSnapshot,
            additionalCostsSnapshot: additionalSnapshot || []
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const getOrders = async (req, res) => {
    try {
        const { from, to, status, sku } = req.query;
        let query = { userId: req.user.id };

        if (from && to) {
            query.createdAt = { $gte: new Date(from), $lte: new Date(to) };
        }
        if (status) query.status = status;
        if (sku) query.sku = sku;

        const orders = await Order.find(query).sort({ createdAt: -1 });

        // 1. Identify unique months for overhead calculation
        const months = [...new Set(orders.map(o => {
            const d = new Date(o.createdAt);
            return `${d.getFullYear()}-${d.getMonth()}`;
        }))];

        // 2. Pre-fetch overheads for these months
        const overheadMap = {};
        await Promise.all(months.map(async (key) => {
            const [year, month] = key.split('-').map(Number);
            overheadMap[key] = await calculateOverheadPerOrder(req.user.id, month, year);
        }));

        // 3. Apply profit calculation
        const ordersWithProfit = orders.map(order => {
            const date = new Date(order.createdAt);
            const cacheKey = `${date.getFullYear()}-${date.getMonth()}`;
            const overheadPerOrder = overheadMap[cacheKey] || 0;

            const templateTotal = order.templateCostsSnapshot ? (order.templateCostsSnapshot.total || 0) : 0;
            const additionalTotal = order.additionalCostsSnapshot ? order.additionalCostsSnapshot.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) : 0;

            // Total Cost = Snapshot Template + Additional + Dynamic Monthly Overhead
            const totalCost = templateTotal + additionalTotal + overheadPerOrder;

            let profit = 0;
            if (order.status === 'Delivered') {
                profit = (order.sellingPrice || 0) - totalCost;
            } else if (order.status === 'Returned') {
                profit = -(totalCost + (order.returnCharges || 0) - (order.recoveredAmount || 0));
            } else if (order.status === 'Cancelled') {
                profit = -totalCost;
            }

            const profitMargin = (order.sellingPrice || 0) > 0 ? (profit / order.sellingPrice) * 100 : 0;

            return {
                ...order.toObject(),
                totalCost,
                profit,
                profitMargin,
                monthlyOverheadApplied: overheadPerOrder
            };
        });

        res.json(ordersWithProfit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const { orderNumber, orderNo, orderPrice, sellingPrice, deliveryStatus, status, ...rest } = req.body;

        const updateData = { ...rest };
        if (orderNumber || orderNo) updateData.orderNo = orderNo || orderNumber;
        if (orderPrice || sellingPrice) updateData.sellingPrice = Number(sellingPrice || orderPrice) || 0;

        const rawStatus = status || deliveryStatus;
        if (rawStatus) {
            const statusMap = {
                'delivered': 'Delivered',
                'returned': 'Returned',
                'cancelled': 'Cancelled',
                'pending': 'In-Transit'
            };
            updateData.status = statusMap[rawStatus.toLowerCase()] || 'In-Transit';
        }

        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            updateData,
            { new: true }
        );
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
