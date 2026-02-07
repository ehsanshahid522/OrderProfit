import GlobalCost from '../models/GlobalCost.js';

export const getGlobalCosts = async (req, res) => {
    try {
        const costs = await GlobalCost.find({ userId: req.user.id });
        res.json(costs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createGlobalCost = async (req, res) => {
    try {
        const cost = await GlobalCost.create({
            ...req.body,
            userId: req.user.id
        });
        res.status(201).json(cost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteGlobalCost = async (req, res) => {
    try {
        const cost = await GlobalCost.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!cost) return res.status(404).json({ message: 'Cost not found' });
        res.json({ message: 'Cost deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCostsByOrder = async (req, res) => {
    try {
        const costs = await GlobalCost.find({
            orderId: req.params.orderId,
            userId: req.user.id
        });
        res.json(costs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
