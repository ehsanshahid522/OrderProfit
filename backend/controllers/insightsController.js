export const generateInsights = async (req, res) => {
    try {
        const { stats } = req.body;

        let insights = [];

        if (stats.returnRate > 20) {
            insights.push({
                type: 'warning',
                message: "Returns are high (>20%); check product quality or sizing accuracy."
            });
        }

        if (stats.totalRevenue > 0 && (stats.totalReturnLoss / stats.totalRevenue) > 0.15) {
            insights.push({
                type: 'caution',
                message: "Return losses are eating up more than 15% of your revenue. Consider revising return policies."
            });
        }

        if (stats.netProfit < 0) {
            insights.push({
                type: 'danger',
                message: "Your net profit for this period is negative. Review global costs and pause ads on losing products."
            });
        } else if (stats.netProfit > 50000) { // Example threshold
            insights.push({
                type: 'success',
                message: "Great job! Your business is performing well. Consider scaling your top 3 winning products."
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: 'info',
                message: "Keep collecting data. Once you have more orders, I can provide actionable business insights."
            });
        }

        res.json({ insights });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
