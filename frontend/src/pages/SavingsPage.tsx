import { useState, useEffect, useCallback } from 'react';
import { Plus, PiggyBank, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { transactionsApi, dashboardApi } from '../api/services';
import type { Transaction, DashboardData } from '../types';
import { formatCurrency, formatDate, formatMonth, getMonthYear } from '../utils';
import { SectionHeader, PageLoader, EmptyState } from '../components/ui';
import TransactionForm from '../components/transactions/TransactionForm';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#22c55e','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#0ea5e9','#10b981'];

export default function SavingsPage() {
  const { user } = useAuth();
  const { month, year } = getMonthYear();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, dashRes] = await Promise.all([
        transactionsApi.list({ type: 'saving', limit: 100 }),
        dashboardApi.get(month, year),
      ]);
      setTransactions(txRes.data.transactions);
      setDashData(dashRes.data);
    } catch { toast.error('Failed to load savings data'); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const totalSavings = transactions.reduce((s, t) => s + t.amount, 0);

  // Monthly savings trend from dashboard
  const trendData = dashData?.trend || [];

  // Savings by subcategory for pie
  const pieData = dashData?.savingsBySubcat || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Savings"
        subtitle="Track your savings goals and progress"
        action={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={15} /> Add Saving
          </button>
        }
      />

      {loading ? <PageLoader /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Saved</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <PiggyBank size={15} className="text-indigo-400" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-gradient">{formatCurrency(totalSavings, currency)}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">All time</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">This Month</span>
                <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <TrendingUp size={15} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                {formatCurrency(dashData?.monthlyTotals.find((t) => t.type === 'saving')?.total || 0, currency)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Current month</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Categories</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <span className="text-amber-400 text-sm">🏦</span>
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">{pieData.length}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Saving buckets</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <EmptyState
              icon={<PiggyBank size={36} className="text-[var(--text-muted)]" />}
              title="No savings recorded"
              description="Start tracking your savings to see your progress over time."
              action={
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  <Plus size={14} /> Record First Saving
                </button>
              }
            />
          ) : (
            <>
              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trend */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Savings Trend (6 months)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="savingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                      <Area type="monotone" dataKey="saving" name="Savings" stroke="#6366f1" fill="url(#savingGrad)" strokeWidth={2.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie by subcategory */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">By Savings Goal</h3>
                  {pieData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">No data</div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={pieData} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4}>
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {pieData.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{item.name}</span>
                            <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                              {formatCurrency(item.total, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions list */}
              <div className="card">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">All Saving Transactions</h3>
                <div className="space-y-1">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm bg-indigo-500/15 flex-shrink-0">
                        {tx.category_icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {tx.subcategory_name || tx.description || tx.category_name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{formatDate(tx.date)}</p>
                      </div>
                      <span className="amount-saving">+{formatCurrency(tx.amount, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <TransactionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSaved={load}
        editTx={null}
      />
    </div>
  );
}
