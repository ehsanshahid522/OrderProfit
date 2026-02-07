import mongoose from 'mongoose';

const globalCostSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: [
            'ads', 'salary', 'rent', 'tools', 'courier-adjustments', 'other',
            'advertising', 'courier', 'packaging', 'platform_fee', 'return_loss'
        ],
        required: true
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    sku: String,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, { timestamps: true });

export default mongoose.model('GlobalCost', globalCostSchema);
