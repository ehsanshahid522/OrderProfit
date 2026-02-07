import Employee from '../models/Employee.js';
import Expense from '../models/Expense.js';

export const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ userId: req.user.id });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addEmployee = async (req, res) => {
    try {
        const employee = await Employee.create({ ...req.body, userId: req.user.id });
        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        await Employee.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Employee deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.id });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addExpense = async (req, res) => {
    try {
        const expense = await Expense.create({ ...req.body, userId: req.user.id });
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteExpense = async (req, res) => {
    try {
        await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
