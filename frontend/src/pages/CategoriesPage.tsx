import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { categoriesApi } from '../api/services';
import type { Category } from '../types';
import { SectionHeader, PageLoader, EmptyState, ConfirmDialog, Modal, Input, Select } from '../components/ui';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: 'expense', label: '💸 Expense' },
  { value: 'income', label: '💰 Income' },
  { value: 'saving', label: '🏦 Saving' },
];

const COLOR_PRESETS = ['#6366f1','#22c55e','#ef4444','#f59e0b','#8b5cf6','#06b6d4','#f97316','#ec4899','#0ea5e9','#84cc16','#10b981','#3b82f6'];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', icon: '💰', color: '#6366f1', type: 'expense' });
  const [savingCat, setSavingCat] = useState(false);

  // Subcategory form
  const [showSubForm, setShowSubForm] = useState(false);
  const [subParentId, setSubParentId] = useState<number | null>(null);
  const [subForm, setSubForm] = useState({ name: '', icon: '📌' });
  const [savingSub, setSavingSub] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'cat' | 'sub'; id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.list();
      setCategories(res.data);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      await categoriesApi.create(catForm);
      toast.success('Category created');
      setCatForm({ name: '', icon: '💰', color: '#6366f1', type: 'expense' });
      setShowCatForm(false);
      load();
    } catch { toast.error('Failed to create category'); }
    finally { setSavingCat(false); }
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subParentId) return;
    setSavingSub(true);
    try {
      await categoriesApi.createSub({ ...subForm, category_id: subParentId });
      toast.success('Subcategory added');
      setSubForm({ name: '', icon: '📌' });
      setShowSubForm(false);
      load();
    } catch { toast.error('Failed to create subcategory'); }
    finally { setSavingSub(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'cat') await categoriesApi.delete(deleteTarget.id);
      else await categoriesApi.deleteSub(deleteTarget.id);
      toast.success('Deleted successfully');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const typeGroups: Record<string, Category[]> = { expense: [], income: [], saving: [] };
  categories.forEach((c) => typeGroups[c.type]?.push(c));

  const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
    expense: { label: '💸 Expense Categories', color: '#ef4444', bg: '#ef444422' },
    income:  { label: '💰 Income Categories',  color: '#22c55e', bg: '#22c55e22' },
    saving:  { label: '🏦 Saving Categories',  color: '#6366f1', bg: '#6366f122' },
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Categories"
        subtitle="Organise your spending into categories and subcategories"
        action={
          <button onClick={() => setShowCatForm(true)} className="btn-primary">
            <Plus size={15} /> New Category
          </button>
        }
      />

      {loading ? <PageLoader /> : categories.length === 0 ? (
        <EmptyState icon={<Tag size={32} />} title="No categories" description="Create your first category to get started." />
      ) : (
        <div className="space-y-6">
          {Object.entries(typeGroups).map(([type, cats]) => {
            if (cats.length === 0) return null;
            const meta = typeLabels[type];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                    {cats.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {cats.map((cat) => {
                    const isOpen = expanded[cat.id];
                    return (
                      <div key={cat.id} className="card p-0 overflow-hidden">
                        {/* Category header */}
                        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors group"
                          onClick={() => setExpanded({ ...expanded, [cat.id]: !isOpen })}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: cat.color + '22' }}>
                            {cat.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[var(--text-primary)]">{cat.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{cat.subcategories?.length || 0} subcategories</p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSubParentId(cat.id); setShowSubForm(true); }}
                              className="p-1.5 rounded-lg hover:bg-[var(--accent-blue)]/10 text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors"
                              title="Add subcategory"
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'cat', id: cat.id, name: cat.name }); }}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="text-[var(--text-muted)] ml-1">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                        </div>

                        {/* Subcategories */}
                        {isOpen && (
                          <div className="border-t border-[var(--border-subtle)] px-4 py-2 bg-[var(--bg-secondary)]">
                            {(cat.subcategories || []).length === 0 ? (
                              <p className="text-xs text-[var(--text-muted)] py-2 italic">No subcategories yet</p>
                            ) : (
                              <div className="flex flex-wrap gap-2 py-2">
                                {(cat.subcategories || []).map((sub) => (
                                  <div key={sub.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs group">
                                    <span>{sub.icon}</span>
                                    <span className="text-[var(--text-secondary)] font-medium">{sub.name}</span>
                                    <button
                                      onClick={() => setDeleteTarget({ type: 'sub', id: sub.id, name: sub.name })}
                                      className="ml-1 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => { setSubParentId(cat.id); setShowSubForm(true); }}
                              className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1 pb-1"
                            >
                              <Plus size={11} /> Add subcategory
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Category Modal */}
      <Modal isOpen={showCatForm} onClose={() => setShowCatForm(false)} title="New Category">
        <form onSubmit={handleSaveCat} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input label="Icon (emoji)" value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="💰" className="text-center text-xl" />
            <div className="col-span-2">
              <Input label="Category Name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Housing" required />
            </div>
          </div>
          <Select label="Type" value={catForm.type} onChange={(e) => setCatForm({ ...catForm, type: e.target.value })} options={TYPE_OPTIONS} />
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => setCatForm({ ...catForm, color: c })}
                  className={`w-7 h-7 rounded-lg transition-all ${catForm.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-card)] scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowCatForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={savingCat} className="btn-primary">Create Category</button>
          </div>
        </form>
      </Modal>

      {/* New Subcategory Modal */}
      <Modal isOpen={showSubForm} onClose={() => setShowSubForm(false)} title="Add Subcategory" size="sm">
        <form onSubmit={handleSaveSub} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input label="Icon" value={subForm.icon} onChange={(e) => setSubForm({ ...subForm, icon: e.target.value })} placeholder="📌" className="text-center text-xl" />
            <div className="col-span-2">
              <Input label="Name" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} placeholder="e.g. Netflix" required autoFocus />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowSubForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={savingSub} className="btn-primary">Add Subcategory</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete ${deleteTarget?.type === 'cat' ? 'Category' : 'Subcategory'}`}
        message={`Delete "${deleteTarget?.name}"? ${deleteTarget?.type === 'cat' ? 'This will also delete all subcategories and may affect existing transactions.' : ''}`}
      />
    </div>
  );
}
