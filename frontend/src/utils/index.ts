import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}

export function formatDate(date: string, fmt = 'MMM d, yyyy'): string {
  try { return format(parseISO(date), fmt); } catch { return date; }
}

export function formatMonth(yearMonth: string): string {
  try { return format(parseISO(yearMonth + '-01'), 'MMM yyyy'); } catch { return yearMonth; }
}

export function getMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getTypeColor(type: string): string {
  switch (type) {
    case 'income': return '#22c55e';
    case 'expense': return '#ef4444';
    case 'saving': return '#6366f1';
    default: return '#8b92b3';
  }
}

export function getTypeBadgeClass(type: string): string {
  switch (type) {
    case 'income': return 'badge-income';
    case 'expense': return 'badge-expense';
    case 'saving': return 'badge-saving';
    default: return 'badge';
  }
}

export function getTypeLabel(type: string): string {
  switch (type) {
    case 'income': return 'Income';
    case 'expense': return 'Expense';
    case 'saving': return 'Saving';
    default: return type;
  }
}

export function calcBudgetPercent(actual: number, budget: number): number {
  if (!budget) return 0;
  return Math.min(Math.round((actual / budget) * 100), 999);
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'NPR', 'INR', 'AUD', 'CAD', 'SGD', 'CHF'];

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
