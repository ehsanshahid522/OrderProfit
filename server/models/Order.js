import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNo: { type: String, required: true },
    productName: { type: String },
    sku: { type: String, required: true },
    sellingPrice: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['Delivered', 'Returned', 'Cancelled', 'In-Transit'],
        default: 'In-Transit'
    },
    templateCostsSnapshot: {
        baseCost: Number,
        marketingCost: Number,
        salaryCost: Number,
        otherFixedCosts: Number,
        customCosts: [{ name: String, amount: Number }],
        total: Number
    },
    additionalCostsSnapshot: [{
        name: String,
        amount: Number
    }],
    returnCharges: { type: Number, default: 0 },
    recoveredAmount: { type: Number, default: 0 },
    returnReason: String,
    returnedAt: Date
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
