export interface User {
  id: number;
  name: string;
  email: string;
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
  subcategories?: Subcategory[];
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
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  subcategory_name?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  amount: number;
  month: number;
  year: number;
}

export interface DashboardData {
  monthlyTotals: { type: string; total: number }[];
  byCategory: { id: number; name: string; icon: string; color: string; type: string; total: number }[];
  trend: { month: string; income: number; expense: number; saving: number }[];
  budgetVsActual: { id: number; name: string; icon: string; color: string; budget: number; actual: number }[];
  savingsTotal: number;
  savingsBySubcat: { name: string; total: number }[];
  recent: Transaction[];
  period: { month: string; year: string };
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export type TransactionType = 'expense' | 'income' | 'saving';
