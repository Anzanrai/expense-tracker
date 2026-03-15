import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

// ---------- Modal ----------
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-slide-up`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- Spinner ----------
export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-[var(--accent-blue)] ${className}`} />;
}

// ---------- Page Loader ----------
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  );
}

// ---------- Empty State ----------
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// ---------- Confirm Dialog ----------
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; loading?: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-1">{message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-400 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
          {loading && <Spinner size={14} />} Delete
        </button>
      </div>
    </Modal>
  );
}

// ---------- Section Header ----------
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------- Select ----------
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
  error?: string;
}
export function Select({ label, options, error, className = '', ...props }: SelectProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={`input ${className}`} {...props}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ---------- Input ----------
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}
export function Input({ label, error, leftIcon, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{leftIcon}</span>}
        <input className={`input ${leftIcon ? 'pl-9' : ''} ${className}`} {...props} />
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ---------- Progress Bar ----------
export function ProgressBar({ value, max, color = '#6366f1' }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const isOver = value > max;
  return (
    <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: isOver ? '#ef4444' : color }}
      />
    </div>
  );
}
