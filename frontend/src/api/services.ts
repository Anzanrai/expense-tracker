import api from './client';
import type { DashboardData, TransactionsResponse, Category, Budget, Transaction } from '../types';

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string; currency?: string }) =>
    api.post<{ token: string; user: any }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: any }>('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  get: (month?: number, year?: number) =>
    api.get<DashboardData>('/dashboard', { params: { month, year } }),
};

// Transactions
export const transactionsApi = {
  list: (params?: { month?: number; year?: number; category_id?: number; type?: string; limit?: number; offset?: number }) =>
    api.get<TransactionsResponse>('/transactions', { params }),
  create: (data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
    api.post<Transaction>('/transactions', data),
  update: (id: number, data: Partial<Transaction>) =>
    api.put<Transaction>(`/transactions/${id}`, data),
  delete: (id: number) =>
    api.delete(`/transactions/${id}`),
};

// Categories
export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: { name: string; icon: string; color: string; type: string }) =>
    api.post<Category>('/categories', data),
  update: (id: number, data: Partial<Category>) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
  createSub: (data: { name: string; icon: string; category_id: number }) =>
    api.post('/subcategories', data),
  deleteSub: (id: number) => api.delete(`/subcategories/${id}`),
};

// Budgets
export const budgetsApi = {
  list: (month?: number, year?: number) =>
    api.get<Budget[]>('/budgets', { params: { month, year } }),
  upsert: (data: { category_id: number; amount: number; month: number; year: number }) =>
    api.post('/budgets', data),
  delete: (id: number) => api.delete(`/budgets/${id}`),
};
