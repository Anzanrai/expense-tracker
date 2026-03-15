import { Response } from 'express';
import { z } from 'zod';
import db from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

const TransactionSchema = z.object({
  category_id: z.number().int().positive(),
  subcategory_id: z.number().int().positive().optional(),
  amount: z.number().positive(),
  type: z.enum(['expense', 'income', 'saving']),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export function getTransactions(req: AuthenticatedRequest, res: Response): void {
  const { month, year, category_id, type, limit = '50', offset = '0' } = req.query as Record<string, string>;
  let query = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           s.name as subcategory_name
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    LEFT JOIN subcategories s ON t.subcategory_id = s.id
    WHERE t.user_id = ?
  `;
  const params: (string | number)[] = [req.user!.id];
  if (month && year) {
    query += ` AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?`;
    params.push(month.padStart(2, '0'), year);
  }
  if (category_id) { query += ` AND t.category_id = ?`; params.push(category_id); }
  if (type) { query += ` AND t.type = ?`; params.push(type); }
  query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  const transactions = db.prepare(query).all(...params);
  const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/, '');
  const countParams = params.slice(0, -2);
  const { total } = db.prepare(countQuery).get(...countParams) as { total: number };
  res.json({ transactions, total, limit: parseInt(limit), offset: parseInt(offset) });
}

export function createTransaction(req: AuthenticatedRequest, res: Response): void {
  const parsed = TransactionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { category_id, subcategory_id, amount, type, description, date } = parsed.data;
  const catExists = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(category_id, req.user!.id);
  if (!catExists) { res.status(404).json({ error: 'Category not found' }); return; }
  const result = db.prepare(
    'INSERT INTO transactions (user_id, category_id, subcategory_id, amount, type, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user!.id, category_id, subcategory_id ?? null, amount, type, description ?? null, date);
  const tx = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           s.name as subcategory_name
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    LEFT JOIN subcategories s ON t.subcategory_id = s.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(tx);
}

export function updateTransaction(req: AuthenticatedRequest, res: Response): void {
  const parsed = TransactionSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) { res.status(404).json({ error: 'Transaction not found' }); return; }
  const fields = Object.keys(parsed.data).map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(parsed.data), new Date().toISOString(), id];
  db.prepare(`UPDATE transactions SET ${fields}, updated_at = ? WHERE id = ?`).run(...values);
  const updated = db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           s.name as subcategory_name
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    LEFT JOIN subcategories s ON t.subcategory_id = s.id
    WHERE t.id = ?
  `).get(id);
  res.json(updated);
}

export function deleteTransaction(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM transactions WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) { res.status(404).json({ error: 'Transaction not found' }); return; }
  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  res.json({ message: 'Transaction deleted' });
}
