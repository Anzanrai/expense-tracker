export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  currency: string;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'saving';
  created_at: string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  user_id: number;
  name: string;
  icon: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number;
  subcategory_id?: number;
  amount: number;
  type: 'expense' | 'income' | 'saving';
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  month: number;
  year: number;
  created_at: string;
}

export interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export interface JwtPayload {
  id: number;
  email: string;
}
