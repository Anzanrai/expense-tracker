import { Response } from 'express';
import db from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

export function getDashboard(req: AuthenticatedRequest, res: Response): void {
  const { month, year } = req.query as Record<string, string>;
  const userId = req.user!.id;
  const now = new Date();
  const m = month ? month.padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');
  const y = year || String(now.getFullYear());

  // Monthly totals by type
  const monthlyTotals = db.prepare(`
    SELECT type, SUM(amount) as total
    FROM transactions
    WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
    GROUP BY type
  `).all(userId, m, y);

  // Spending by category this month
  const byCategory = db.prepare(`
    SELECT c.id, c.name, c.icon, c.color, c.type, SUM(t.amount) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
    GROUP BY c.id ORDER BY total DESC
  `).all(userId, m, y);

  // Monthly trend (last 6 months)
  const trend = db.prepare(`
    SELECT strftime('%Y-%m', date) as month,
           SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
           SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense,
           SUM(CASE WHEN type='saving' THEN amount ELSE 0 END) as saving
    FROM transactions
    WHERE user_id = ? AND date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all(userId);

  // Budget vs Actual
  const budgetVsActual = db.prepare(`
    SELECT c.id, c.name, c.icon, c.color, b.amount as budget,
           COALESCE(SUM(t.amount), 0) as actual
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    LEFT JOIN transactions t ON t.category_id = c.id
      AND t.user_id = b.user_id
      AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?
    WHERE b.user_id = ? AND b.month = ? AND b.year = ?
    GROUP BY b.id
    ORDER BY (COALESCE(SUM(t.amount), 0) / b.amount) DESC
  `).all(m, y, userId, parseInt(m), parseInt(y));

  // Savings progress (all time)
  const savingsTotal = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions WHERE user_id = ? AND type = 'saving'
  `).get(userId) as { total: number };

  // Savings by subcategory
  const savingsBySubcat = db.prepare(`
    SELECT COALESCE(s.name, 'General Savings') as name, SUM(t.amount) as total
    FROM transactions t
    LEFT JOIN subcategories s ON t.subcategory_id = s.id
    WHERE t.user_id = ? AND t.type = 'saving'
    GROUP BY t.subcategory_id ORDER BY total DESC
  `).all(userId);

  // Recent transactions
  const recent = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           s.name as subcategory_name
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    LEFT JOIN subcategories s ON t.subcategory_id = s.id
    WHERE t.user_id = ?
    ORDER BY t.date DESC, t.created_at DESC LIMIT 5
  `).all(userId);

  res.json({
    monthlyTotals,
    byCategory,
    trend,
    budgetVsActual,
    savingsTotal: savingsTotal.total,
    savingsBySubcat,
    recent,
    period: { month: m, year: y },
  });
}

export function getBudgets(req: AuthenticatedRequest, res: Response): void {
  const { month, year } = req.query as Record<string, string>;
  const now = new Date();
  const m = parseInt(month || String(now.getMonth() + 1));
  const y = parseInt(year || String(now.getFullYear()));
  const budgets = db.prepare(`
    SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM budgets b JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ? AND b.month = ? AND b.year = ?
  `).all(req.user!.id, m, y);
  res.json(budgets);
}

export function upsertBudget(req: AuthenticatedRequest, res: Response): void {
  const { category_id, amount, month, year } = req.body;
  if (!category_id || !amount || !month || !year) {
    res.status(400).json({ error: 'category_id, amount, month, year are required' });
    return;
  }
  db.prepare(`
    INSERT INTO budgets (user_id, category_id, amount, month, year)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, category_id, month, year) DO UPDATE SET amount = excluded.amount
  `).run(req.user!.id, category_id, amount, month, year);
  res.json({ message: 'Budget saved' });
}

export function deleteBudget(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, req.user!.id);
  res.json({ message: 'Budget deleted' });
}
