import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Tag, Target,
  LogOut, ChevronLeft, ChevronRight, User, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/budgets', icon: Target, label: 'Budgets' },
  { to: '/savings', icon: TrendingUp, label: 'Savings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-[var(--border)] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm text-[var(--text-primary)] leading-none">Spendly</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Expense Tracker</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
            title={collapsed ? label : undefined}
          >
            <Icon size={17} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-[var(--border)] p-2 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user?.name}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.currency}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="nav-item w-full" title={collapsed ? 'Logout' : undefined}>
          <LogOut size={16} className="flex-shrink-0 text-red-400" />
          {!collapsed && <span className="text-red-400">Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-item w-full text-[var(--text-muted)]"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
