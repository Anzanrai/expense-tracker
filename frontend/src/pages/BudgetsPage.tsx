import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';
import { budgetsApi, categoriesApi } from '../api/services';
import type { Budget, Category } from '../types';
import { formatCurrency, getMonthYear, MONTHS, calcBudgetPercent } from '../utils';
import { SectionHeader, PageLoader, EmptyState, ConfirmDialog, Modal, Select, Input, ProgressBar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function BudgetsPage() {
  const { user } = useAuth();
  const { month: nowMonth, year: nowYear } = getMonthYear();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsRes, catsRes] = await Promise.all([
        budgetsApi.list(month, year),
        categoriesApi.list(),
      ]);
      setBudgets(budgetsRes.data);
      setCategories(catsRes.data);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id || !form.amount) return;
    setSaving(true);
    try {
      await budgetsApi.upsert({
        category_id: Number(form.category_id),
        amount: parseFloat(form.amount),
        month, year,
      });
      toast.success('Budget saved');
      setShowForm(false);
      setForm({ category_id: '', amount: '' });
      load();
    } catch { toast.error('Failed to save budget'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await budgetsApi.delete(deleteTarget.id);
      toast.success('Budget deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const currency = user?.currency || 'USD';
  const yearOptions = [nowYear - 1, nowYear, nowYear + 1].map((y) => ({ value: y, label: String(y) }));
  const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));

  const budgetedCatIds = new Set(budgets.map((b) => b.category_id));
  const availableCats = categories.filter((c) => c.type === 'expense' && !budgetedCatIds.has(c.id));

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Budgets"
        subtitle={`${MONTHS[month - 1]} ${year} · Total budget: ${formatCurrency(totalBudget, currency)}`}
        action={
          <div className="flex items-center gap-2">
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} options={monthOptions} className="!w-32" />
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} options={yearOptions} className="!w-24" />
            <button onClick={() => setShowForm(true)} className="btn-primary" disabled={availableCats.length === 0}>
              <Plus size={15} /> Set Budget
            </button>
          </div>
        }
      />

      {loading ? <PageLoader /> : budgets.length === 0 ? (
        <EmptyState
          icon={<Target size={32} className="text-[var(--text-muted)]" />}
          title="No budgets set"
          description="Set monthly spending limits for your expense categories."
          action={
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={14} /> Set First Budget
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const pct = calcBudgetPercent(0, budget.amount); // actual comes from dashboard; here we show budget card
            const isOver = false;
            return (
              <div key={budget.id} className="card group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: (budget.category_color || '#6366f1') + '22' }}>
                      {budget.category_icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--text-primary)]">{budget.category_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">Monthly budget</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                      {formatCurrency(budget.amount, currency)}
                    </span>
                    <button
                      onClick={() => setDeleteTarget(budget)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>Limit</span>
                    <span className={isOver ? 'text-red-400 font-semibold' : ''}>{pct}% used</span>
                  </div>
                  <ProgressBar value={0} max={budget.amount} color={budget.category_color || '#6366f1'} />
                  <p className="text-xs text-[var(--text-muted)]">
                    Track in dashboard to see actual spending vs this budget
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget form modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Set Monthly Budget" size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Category"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            options={[
              { value: '', label: 'Select category…' },
              ...availableCats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
            ]}
          />
          <Input
            label={`Budget Amount (${currency})`}
            type="number"
            min="1"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <p className="text-xs text-[var(--text-muted)]">
            Setting a budget for <strong>{MONTHS[month - 1]} {year}</strong>. You can update it anytime.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">Save Budget</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Budget"
        message={`Remove the budget for "${deleteTarget?.category_name}" (${formatCurrency(deleteTarget?.amount || 0, currency)})?`}
      />
    </div>
  );
}
