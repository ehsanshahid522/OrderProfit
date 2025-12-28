import ProductSheet from '../models/ProductSheet.js';
import { calculateOverheadPerOrder } from '../services/overheadService.js';

export const getProductSheets = async (req, res) => {
    try {
        const sheets = await ProductSheet.find({ userId: req.user.id });

        // Calculate current month's overhead
        const now = new Date();
        const overheadPerOrder = await calculateOverheadPerOrder(req.user.id, now.getMonth(), now.getFullYear());

        const sheetsWithOverhead = sheets.map(sheet => {
            const sheetObj = sheet.toJSON();
            // If the user hasn't explicitly set salaryCost or otherFixedCosts, 
            // we can show the projected overhead
            return {
                ...sheetObj,
                projectedOverhead: overheadPerOrder
            };
        });

        res.json(sheetsWithOverhead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveProductSheet = async (req, res) => {
    try {
        const { _id, productName, sku, baseCost, marketingCost, salaryCost, otherFixedCosts, customCosts } = req.body;

        let sheet = null;
        if (_id) {
            sheet = await ProductSheet.findOne({ _id, userId: req.user.id });
        } else if (sku) {
            sheet = await ProductSheet.findOne({ sku, userId: req.user.id });
        }

        const finalSku = sku || productName.toLowerCase().replace(/\s+/g, '-');

        const sheetData = {
            userId: req.user.id,
            productName,
            sku: finalSku,
            baseCost: Number(baseCost) || 0,
            marketingCost: Number(marketingCost) || 0,
            salaryCost: Number(salaryCost) || 0,
            otherFixedCosts: Number(otherFixedCosts) || 0,
            customCosts: customCosts ? customCosts.filter(c => c.name && c.amount).map(c => ({
                name: c.name.trim(),
                amount: Number(c.amount) || 0
            })) : []
        };

        if (sheet) {
            sheet = await ProductSheet.findByIdAndUpdate(sheet._id, sheetData, { new: true });
        } else {
            sheet = await ProductSheet.create(sheetData);
        }

        res.status(200).json(sheet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteProductSheet = async (req, res) => {
    try {
        const sheet = await ProductSheet.findOne({ _id: req.params.id, userId: req.user.id });
        if (!sheet) return res.status(404).json({ message: 'Sheet not found' });

        await ProductSheet.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product sheet deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
