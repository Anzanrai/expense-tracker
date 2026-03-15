import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { transactionsApi } from '../api/services';
import type { Transaction } from '../types';
import { formatCurrency, formatDate, getMonthYear, MONTHS, getTypeBadgeClass, getTypeLabel } from '../utils';
import { SectionHeader, PageLoader, EmptyState, ConfirmDialog, Select } from '../components/ui';
import TransactionForm from '../components/transactions/TransactionForm';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LIMIT = 20;

export default function TransactionsPage() {
  const { user } = useAuth();
  const { month: nowMonth, year: nowYear } = getMonthYear();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.list({
        month, year,
        type: typeFilter || undefined,
        limit: LIMIT,
        offset: page * LIMIT,
      });
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [month, year, typeFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTx) return;
    setDeleting(true);
    try {
      await transactionsApi.delete(deleteTx.id);
      toast.success('Transaction deleted');
      setDeleteTx(null);
      load();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const filtered = search
    ? transactions.filter((tx) =>
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.category_name?.toLowerCase().includes(search.toLowerCase()) ||
        tx.subcategory_name?.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  const currency = user?.currency || 'USD';
  const yearOptions = [nowYear - 1, nowYear, nowYear + 1].map((y) => ({ value: y, label: String(y) }));
  const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'expense', label: '💸 Expense' },
    { value: 'income', label: '💰 Income' },
    { value: 'saving', label: '🏦 Saving' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Transactions"
        subtitle={`${total} records · ${MONTHS[month - 1]} ${year}`}
        action={
          <button onClick={() => { setEditTx(null); setShowForm(true); }} className="btn-primary">
            <Plus size={15} /> Add Transaction
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="input pl-8 h-9 text-sm"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setPage(0); }} options={monthOptions} className="!w-32 h-9" />
        <Select value={year} onChange={(e) => { setYear(Number(e.target.value)); setPage(0); }} options={yearOptions} className="!w-24 h-9" />
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} options={typeOptions} className="!w-36 h-9" />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Filter size={32} className="text-[var(--text-muted)]" />}
            title="No transactions found"
            description="Try adjusting your filters or add a new transaction."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={14} /> Add Transaction
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Date', 'Category', 'Description', 'Type', 'Amount', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs whitespace-nowrap">
                        {formatDate(tx.date, 'MMM d')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                            style={{ backgroundColor: (tx.category_color || '#6366f1') + '22' }}>
                            {tx.category_icon}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)] text-xs">{tx.category_name}</p>
                            {tx.subcategory_name && (
                              <p className="text-[10px] text-[var(--text-muted)]">{tx.subcategory_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-xs truncate">
                        {tx.description || <span className="text-[var(--text-muted)] italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={getTypeBadgeClass(tx.type)}>{getTypeLabel(tx.type)}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">
                        <span className={tx.type === 'income' ? 'amount-positive' : tx.type === 'saving' ? 'amount-saving' : 'amount-negative'}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditTx(tx); setShowForm(true); }}
                            className="p-1.5 rounded-lg hover:bg-[var(--accent-blue)]/10 text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTx(tx)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)]">
                  Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                    className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                  >← Prev</button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * LIMIT >= total}
                    className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                  >Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TransactionForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTx(null); }}
        onSaved={load}
        editTx={editTx}
      />

      <ConfirmDialog
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${deleteTx?.type} of ${formatCurrency(deleteTx?.amount || 0, currency)}? This action cannot be undone.`}
      />
    </div>
  );
}
