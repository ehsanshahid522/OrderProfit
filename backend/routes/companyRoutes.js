import express from 'express';
import { getEmployees, addEmployee, deleteEmployee, getExpenses, addExpense, deleteExpense } from '../controllers/companyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/employees', getEmployees);
router.post('/employees', addEmployee);
router.delete('/employees/:id', deleteEmployee);

router.get('/expenses', getExpenses);
router.post('/expenses', addExpense);
router.delete('/expenses/:id', deleteExpense);

export default router;
