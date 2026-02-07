import Order from '../models/Order.js';
import Employee from '../models/Employee.js';
import Expense from '../models/Expense.js';

export const calculateOverheadPerOrder = async (userId, month, year) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Get total orders for the month
    const totalOrders = await Order.countDocuments({
        userId,
        createdAt: { $gte: startDate, $lte: endDate }
    });

    if (totalOrders === 0) return 0;

    // Get total salaries
    const employees = await Employee.find({ userId });
    const totalSalaries = employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);

    // Get total expenses for the month
    const expenses = await Expense.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    const totalOverhead = totalSalaries + totalExpenses;
    return totalOverhead / totalOrders;
};
