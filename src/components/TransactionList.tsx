import { useMemo, useState } from 'react';
import type { Transaction } from '@/types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_EMOJIS } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
  type: 'income' | 'expense';
  onDelete: (id: string) => void;
}

export default function TransactionList({ transactions, type, onDelete }: TransactionListProps) {
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isExpense = type === 'expense';

  const filtered = useMemo(() => {
    let result = transactions.filter((t) => t.type === type);
    if (filterCategory) result = result.filter((t) => t.category === filterCategory);
    switch (sortOrder) {
      case 'oldest': result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); break;
      case 'highest': result.sort((a, b) => b.amount - a.amount); break;
      case 'lowest': result.sort((a, b) => a.amount - b.amount); break;
      default: result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return result;
  }, [transactions, type, filterCategory, sortOrder]);

  const total = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    for (const t of filtered) {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    }
    return groups;
  }, [filtered]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return 'Hoy';
    if (dateStr === yesterday) return 'Ayer';
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`rounded-2xl p-4 border ${
        isExpense ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total {isExpense ? 'Gastado' : 'Recibido'}</p>
            <p className={`text-2xl font-bold mt-0.5 tabular-nums ${isExpense ? 'text-red-400' : 'text-emerald-400'}`}>
              ${total.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-slate-500">{filtered.length} registros</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex-1 bg-slate-800/70 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">📋 Todas</option>
          {categories.map((c) => (
            <option key={c} value={c}>{CATEGORY_EMOJIS[c] || '📦'} {c}</option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
          className="bg-slate-800/70 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="newest">🕐 Reciente</option>
          <option value="oldest">🔄 Antiguo</option>
          <option value="highest">⬆️ Mayor</option>
          <option value="lowest">⬇️ Menor</option>
        </select>
      </div>

      {/* Grouped List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">{isExpense ? '💸' : '💰'}</p>
          <p className="text-slate-400 text-sm">
            {filterCategory ? `Sin registros en "${filterCategory}"` : `Aún no has registrado ${isExpense ? 'gastos' : 'ingresos'}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, txs]) => {
            const dayTotal = txs.reduce((s, t) => s + t.amount, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400">{formatDate(date)}</p>
                  <span className={`text-xs font-medium ${isExpense ? 'text-red-400/60' : 'text-emerald-400/60'}`}>
                    {isExpense ? '-' : '+'}${dayTotal.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {txs.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isExpense ? 'bg-red-500/10' : 'bg-emerald-500/10'
                        }`}>
                          <span className="text-base">{CATEGORY_EMOJIS[tx.category] || '📦'}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200 truncate font-medium">{tx.description}</p>
                          <span className="text-[10px] text-slate-500 bg-slate-700/40 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {tx.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-sm font-semibold tabular-nums ${isExpense ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isExpense ? '-' : '+'}${tx.amount.toLocaleString()}
                        </span>
                        <button onClick={() => onDelete(tx.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
