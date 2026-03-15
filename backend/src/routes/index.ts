import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { getCategories, createCategory, updateCategory, deleteCategory, createSubcategory, deleteSubcategory } from '../controllers/categories.controller';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transactions.controller';
import { getDashboard, getBudgets, upsertBudget, deleteBudget } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// Categories
router.get('/categories', authenticate, getCategories);
router.post('/categories', authenticate, createCategory);
router.put('/categories/:id', authenticate, updateCategory);
router.delete('/categories/:id', authenticate, deleteCategory);
router.post('/subcategories', authenticate, createSubcategory);
router.delete('/subcategories/:id', authenticate, deleteSubcategory);

// Transactions
router.get('/transactions', authenticate, getTransactions);
router.post('/transactions', authenticate, createTransaction);
router.put('/transactions/:id', authenticate, updateTransaction);
router.delete('/transactions/:id', authenticate, deleteTransaction);

// Dashboard & Budgets
router.get('/dashboard', authenticate, getDashboard);
router.get('/budgets', authenticate, getBudgets);
router.post('/budgets', authenticate, upsertBudget);
router.delete('/budgets/:id', authenticate, deleteBudget);

export default router;
