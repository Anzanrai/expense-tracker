import { useState, useEffect } from 'react';
import { Modal, Input, Select, Spinner } from '../ui';
import { categoriesApi, transactionsApi } from '../../api/services';
import type { Category, Transaction } from '../../types';
import { getMonthYear } from '../../utils';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editTx?: Transaction | null;
}

export default function TransactionForm({ isOpen, onClose, onSaved, editTx }: Props) {
  const { year, month } = getMonthYear();
  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    type: 'expense' as 'expense' | 'income' | 'saving',
    category_id: '',
    subcategory_id: '',
    amount: '',
    description: '',
    date: defaultDate,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    categoriesApi.list()
      .then((res) => setCategories(res.data))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (editTx) {
      setForm({
        type: editTx.type,
        category_id: String(editTx.category_id),
        subcategory_id: editTx.subcategory_id ? String(editTx.subcategory_id) : '',
        amount: String(editTx.amount),
        description: editTx.description || '',
        date: editTx.date,
      });
    } else {
      setForm({ type: 'expense', category_id: '', subcategory_id: '', amount: '', description: '', date: defaultDate });
    }
  }, [editTx, isOpen]);

  const filteredCats = categories.filter((c) => c.type === form.type);
  const selectedCat = categories.find((c) => String(c.id) === form.category_id);
  const subcats = selectedCat?.subcategories || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id) { toast.error('Please select a category'); return; }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        category_id: Number(form.category_id),
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : undefined,
        amount: parseFloat(form.amount),
        description: form.description || undefined,
        date: form.date,
      };
      if (editTx) {
        await transactionsApi.update(editTx.id, payload);
        toast.success('Transaction updated');
      } else {
        await transactionsApi.create(payload as any);
        toast.success('Transaction added');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = [
    { value: 'expense', label: '💸 Expense' },
    { value: 'income', label: '💰 Income' },
    { value: 'saving', label: '🏦 Saving' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTx ? 'Edit Transaction' : 'Add Transaction'}>
      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type tabs */}
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: opt.value as any, category_id: '', subcategory_id: '' })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    form.type === opt.value
                      ? 'bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] text-[var(--accent-blue)]'
                      : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: '' })}
              options={[{ value: '', label: 'Select…' }, ...filteredCats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))]}
            />
            <Select
              label="Subcategory"
              value={form.subcategory_id}
              onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
              options={[{ value: '', label: 'None' }, ...subcats.map((s) => ({ value: s.id, label: `${s.icon} ${s.name}` }))]}
              disabled={subcats.length === 0}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description (optional)"
            placeholder="Add a note…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Spinner size={14} />}
              {editTx ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
