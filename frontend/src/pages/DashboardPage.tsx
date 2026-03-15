import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, PiggyBank, Wallet, Plus } from 'lucide-react';
import { dashboardApi } from '../api/services';
import type { DashboardData } from '../types';
import { formatCurrency, formatMonth, getMonthYear, MONTHS } from '../utils';
import { PageLoader, SectionHeader, Select, ProgressBar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#6366f1','#22c55e','#ef4444','#f59e0b','#8b5cf6','#06b6d4','#f97316','#ec4899','#0ea5e9','#84cc16'];

function StatCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}

function ChartTooltipStyle({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card py-2 px-3 text-xs shadow-xl">
      {label && <p className="text-[var(--text-secondary)] mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { month: nowMonth, year: nowYear } = getMonthYear();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.get(month, year);
      setData(res.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return <PageLoader />;

  const totals = Object.fromEntries(data.monthlyTotals.map((t) => [t.type, t.total]));
  const income = totals.income || 0;
  const expense = totals.expense || 0;
  const saving = totals.saving || 0;
  const net = income - expense - saving;
  const currency = user?.currency || 'USD';

  const expenseCategories = data.byCategory.filter((c) => c.type === 'expense');
  const yearOptions = [nowYear - 1, nowYear, nowYear + 1].map((y) => ({ value: y, label: String(y) }));
  const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Dashboard"
        subtitle={`${MONTHS[month - 1]} ${year} · ${user?.name}`}
        action={
          <div className="flex items-center gap-2">
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} options={monthOptions} className="!w-32" />
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} options={yearOptions} className="!w-24" />
            <Link to="/transactions" className="btn-primary"><Plus size={15} /> Add</Link>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Income" value={formatCurrency(income, currency)} icon={<ArrowUpRight size={16} />} color="#22c55e" sub="This month" />
        <StatCard label="Expenses" value={formatCurrency(expense, currency)} icon={<ArrowDownRight size={16} />} color="#ef4444" sub="This month" />
        <StatCard label="Savings" value={formatCurrency(saving, currency)} icon={<PiggyBank size={16} />} color="#6366f1" sub="This month" />
        <StatCard label="Net Balance" value={formatCurrency(net, currency)} icon={<Wallet size={16} />} color={net >= 0 ? '#22c55e' : '#ef4444'} sub={net >= 0 ? 'Surplus' : 'Deficit'} />
      </div>

      {/* Trend + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area trend */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">6-Month Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.trend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                {[['income','#22c55e'],['expense','#ef4444'],['saving','#6366f1']].map(([key, color]) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltipStyle />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#grad-income)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#grad-expense)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="saving" stroke="#6366f1" fill="url(#grad-saving)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Expense Breakdown</h3>
          {expenseCategories.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">No expenses yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={expenseCategories} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {expenseCategories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {expenseCategories.slice(0, 5).map((cat, i) => (
                  <div key={cat.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[var(--text-secondary)] flex-1 truncate">{cat.icon} {cat.name}</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">{formatCurrency(cat.total, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Budget vs Actual + Savings Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget vs Actual bar */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Budget vs Actual</h3>
          {data.budgetVsActual.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <p className="text-sm text-[var(--text-muted)]">No budgets set</p>
              <Link to="/budgets" className="btn-secondary text-xs">Set Budgets</Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.budgetVsActual} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltipStyle />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[4,4,0,0]} fillOpacity={0.4} />
                <Bar dataKey="actual" name="Actual" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Savings progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Savings Progress</h3>
            <span className="text-xs font-mono font-bold text-[var(--accent-blue)]">{formatCurrency(data.savingsTotal, currency)} total</span>
          </div>
          <div className="space-y-3">
            {data.savingsBySubcat.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">No savings recorded</p>
            ) : (
              data.savingsBySubcat.map((s, i) => {
                const pct = ((s.total / data.savingsTotal) * 100).toFixed(1);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)] font-medium">{s.name}</span>
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {formatCurrency(s.total, currency)} <span className="text-[var(--text-muted)]">({pct}%)</span>
                      </span>
                    </div>
                    <ProgressBar value={s.total} max={data.savingsTotal} color={PIE_COLORS[i % PIE_COLORS.length]} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Transactions</h3>
          <Link to="/transactions" className="text-xs text-[var(--accent-blue)] hover:underline font-medium">View all →</Link>
        </div>
        <div className="space-y-1">
          {data.recent.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">No transactions yet</p>
          ) : (
            data.recent.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: (tx.category_color || '#6366f1') + '22' }}>
                  {tx.category_icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.description || tx.category_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{tx.subcategory_name || tx.category_name} · {tx.date}</p>
                </div>
                <span className={tx.type === 'income' ? 'amount-positive' : tx.type === 'saving' ? 'amount-saving' : 'amount-negative'}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
