import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    salary: { type: Number, required: true },
    position: String,
    joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);
