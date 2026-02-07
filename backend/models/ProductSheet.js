import mongoose from 'mongoose';

const productSheetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true },
    sku: { type: String },
    baseCost: { type: Number, default: 0 },
    marketingCost: { type: Number, default: 0 },
    salaryCost: { type: Number, default: 0 },
    otherFixedCosts: { type: Number, default: 0 },
    customCosts: [{
        name: String,
        amount: { type: Number, default: 0 }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

productSheetSchema.virtual('templateTotal').get(function () {
    const customTotal = this.customCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
    return (this.baseCost || 0) + (this.marketingCost || 0) + (this.salaryCost || 0) + (this.otherFixedCosts || 0) + customTotal;
});

productSheetSchema.index({ userId: 1, sku: 1 }, { unique: true });

export default mongoose.model('ProductSheet', productSheetSchema);
