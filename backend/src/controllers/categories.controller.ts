import { Response } from 'express';
import { z } from 'zod';
import db from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

const CategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().default('💰'),
  color: z.string().default('#6366f1'),
  type: z.enum(['expense', 'income', 'saving']),
});

const SubcategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().default('📌'),
  category_id: z.number().int().positive(),
});

export function getCategories(req: AuthenticatedRequest, res: Response): void {
  const categories = db.prepare(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY type, name'
  ).all(req.user!.id);

  const subcategories = db.prepare(
    'SELECT * FROM subcategories WHERE user_id = ? ORDER BY name'
  ).all(req.user!.id);

  const result = (categories as any[]).map((cat) => ({
    ...cat,
    subcategories: (subcategories as any[]).filter((s) => s.category_id === cat.id),
  }));
  res.json(result);
}

export function createCategory(req: AuthenticatedRequest, res: Response): void {
  const parsed = CategorySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { name, icon, color, type } = parsed.data;
  const result = db.prepare(
    'INSERT INTO categories (user_id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user!.id, name, icon, color, type);
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(category);
}

export function updateCategory(req: AuthenticatedRequest, res: Response): void {
  const parsed = CategorySchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) { res.status(404).json({ error: 'Category not found' }); return; }
  const fields = Object.entries(parsed.data).map(([k]) => `${k} = ?`).join(', ');
  const values = [...Object.values(parsed.data), id];
  db.prepare(`UPDATE categories SET ${fields} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json(updated);
}

export function deleteCategory(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) { res.status(404).json({ error: 'Category not found' }); return; }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: 'Category deleted' });
}

export function createSubcategory(req: AuthenticatedRequest, res: Response): void {
  const parsed = SubcategorySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { name, icon, category_id } = parsed.data;
  const catExists = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(category_id, req.user!.id);
  if (!catExists) { res.status(404).json({ error: 'Category not found' }); return; }
  const result = db.prepare(
    'INSERT INTO subcategories (category_id, user_id, name, icon) VALUES (?, ?, ?, ?)'
  ).run(category_id, req.user!.id, name, icon);
  const sub = db.prepare('SELECT * FROM subcategories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(sub);
}

export function deleteSubcategory(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM subcategories WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) { res.status(404).json({ error: 'Subcategory not found' }); return; }
  db.prepare('DELETE FROM subcategories WHERE id = ?').run(id);
  res.json({ message: 'Subcategory deleted' });
}
