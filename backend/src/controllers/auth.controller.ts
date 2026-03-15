import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db/database';
import { User } from '../types';

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  currency: z.string().default('USD'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const DEFAULT_CATEGORIES = [
  { name: 'Savings', icon: '🏦', color: '#10b981', type: 'saving', subs: ['Child Education Fund', 'Emergency Fund', 'Retirement'] },
  { name: 'Housing', icon: '🏠', color: '#6366f1', type: 'expense', subs: ['Rent / Mortgage', 'Utilities', 'Internet', 'Maintenance'] },
  { name: 'Food & Groceries', icon: '🛒', color: '#f59e0b', type: 'expense', subs: ['Grocery', 'Vegetables & Fruits', 'Dairy'] },
  { name: 'Eating Out', icon: '🍽️', color: '#ef4444', type: 'expense', subs: ['Restaurants', 'Cafes', 'Fast Food', 'Food Delivery'] },
  { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense', subs: ['Netflix', 'Spotify', 'Movies', 'Games'] },
  { name: 'Transport', icon: '🚗', color: '#0ea5e9', type: 'expense', subs: ['Fuel', 'Public Transport', 'Taxi / Uber', 'Parking'] },
  { name: 'Health', icon: '🏥', color: '#06b6d4', type: 'expense', subs: ['Insurance', 'Medicine', 'Doctor Visits', 'Gym'] },
  { name: 'Travel', icon: '✈️', color: '#f97316', type: 'expense', subs: ['Flights', 'Hotels', 'Tours', 'Activities'] },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense', subs: ['Clothing', 'Electronics', 'Home Goods'] },
  { name: 'Income', icon: '💼', color: '#22c55e', type: 'income', subs: ['Salary', 'Freelance', 'Investments', 'Other Income'] },
];

function seedCategories(userId: number) {
  const insertCat = db.prepare(
    'INSERT INTO categories (user_id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)'
  );
  const insertSub = db.prepare(
    'INSERT INTO subcategories (category_id, user_id, name, icon) VALUES (?, ?, ?, ?)'
  );
  for (const cat of DEFAULT_CATEGORIES) {
    const result = insertCat.run(userId, cat.name, cat.icon, cat.color, cat.type);
    const catId = result.lastInsertRowid as number;
    for (const sub of cat.subs) {
      insertSub.run(catId, userId, sub, '📌');
    }
  }
}

export function register(req: Request, res: Response): void {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { name, email, password, currency } = parsed.data;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, currency) VALUES (?, ?, ?, ?)'
  ).run(name, email, hash, currency);
  const userId = result.lastInsertRowid as number;
  seedCategories(userId);
  const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
  const user = db.prepare('SELECT id, name, email, currency, created_at FROM users WHERE id = ?').get(userId);
  res.status(201).json({ token, user });
}

export function login(req: Request, res: Response): void {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
}

export function getMe(req: Request & { user?: { id: number } }, res: Response): void {
  const user = db.prepare('SELECT id, name, email, currency, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json(user);
}
