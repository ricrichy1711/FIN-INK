import { useState } from 'react';
import type { MonthlySummary, BudgetAllocation, Budget } from '@/types';
import SimpleChart from './SimpleChart';

interface StrategyProps {
  summary: MonthlySummary;
  allocations: BudgetAllocation[];
  budgets: Budget[];
  addBudget: (b: { category: string; monthlyLimit: number; emoji: string }) => void;
  deleteBudget: (id: string) => void;
}

export default function Strategy({ summary, allocations, budgets, addBudget, deleteBudget }: StrategyProps) {
  const { totalIncome, balance, savingsRate, dailyAverage, daysInMonth, categoryBreakdown } = summary;
  const daysPassed = new Date().getDate();
  const daysLeft = daysInMonth - daysPassed;

  const ruleAllocations = allocations.filter(
    (a) => ['Necesidades', 'Deseos', 'Ahorro'].includes(a.category)
  );
  const categoryAllocations = allocations.filter(
    (a) => !['Necesidades', 'Deseos', 'Ahorro'].includes(a.category)
  );

  const getStatusBadge = (status: BudgetAllocation['status']) => {
    const map = {
      good: { text: '✅ OK', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      warning: { text: '⚠️ Atención', className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      danger: { text: '🔴 Excedido', className: 'bg-red-500/10 text-red-400 border-red-500/30' },
    };
    return map[status];
  };

  const getProgressColor = (status: BudgetAllocation['status']) => {
    return status === 'good' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500';
  };

  const getAdvice = () => {
    const advice: string[] = [];
    if (totalIncome === 0) {
      return ['📌 Registra tus ingresos primero para obtener recomendaciones.'];
    }
    if (balance < 0) advice.push('🚨 ¡Urgente! Estás gastando más de lo que ganas. Corta gastos no esenciales ahora.');
    if (savingsRate < 20 && balance > 0) advice.push(`💡 Ahorra al menos el 20%. Te faltan ${(totalIncome * 0.2 - balance).toFixed(0)} más.`);
    if (savingsRate >= 20) advice.push('🎉 ¡Gran trabajo! Estás ahorrando más del 20%.');
    const dangerCats = categoryAllocations.filter((a) => a.status === 'danger');
    if (dangerCats.length > 0) advice.push(`⚠️ Reduce en: ${dangerCats.map((a) => `${a.emoji || ''} ${a.category}`).join(', ')}.`);
    if (dailyAverage > 0 && balance > 0) {
      advice.push(`📅 Presupuesto diario para los ${daysLeft} días restantes: $${(balance / Math.max(daysLeft, 1)).toFixed(0)}.`);
    }
    return advice;
  };

  // Add budget form
  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-900/40 to-indigo-900/40 rounded-2xl p-5 border border-violet-700/30">
        <h2 className="text-lg font-bold text-violet-200">🎯 Estrategia Financiera</h2>
        <p className="text-violet-400/60 text-xs mt-1">Regla 50/30/20: Necesidades / Deseos / Ahorro</p>
      </div>

      {/* Score */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={savingsRate >= 20 ? '#10b981' : savingsRate > 0 ? '#f59e0b' : '#ef4444'}
                strokeWidth="2.5"
                strokeDasharray={`${Math.min(Math.max(savingsRate, 0), 100)} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{savingsRate.toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Score Financiero</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {savingsRate >= 20 ? '🟢 Saludable' : savingsRate > 0 ? '🟡 Regular' : '🔴 Crítico'}
            </p>
          </div>
        </div>
      </div>

      {/* 50/30/20 Chart */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
        <h3 className="text-sm font-medium text-slate-200 mb-3">Distribución Real vs Meta</h3>
        {ruleAllocations.map((a) => {
          const badge = getStatusBadge(a.status);
          const pct = a.recommended > 0 ? Math.min((a.actual / a.recommended) * 100, 100) : 0;
          return (
            <div key={a.category} className="mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300 font-medium">
                  {a.emoji} {a.category} ({a.percentage}%)
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.className}`}>{badge.text}</span>
              </div>
              <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${getProgressColor(a.status)}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                <span>${a.actual.toLocaleString()}</span>
                <span>Meta: ${a.recommended.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
          <h3 className="text-sm font-medium text-slate-200 mb-3">Gastos por Categoría</h3>
          <SimpleChart
            data={categoryBreakdown.slice(0, 8).map((c) => ({
              label: c.emoji || c.category,
              value: c.amount,
              color: '',
            }))}
            type="donut"
            height={180}
            totalLabel="Total"
          />
        </div>
      )}

      {/* Custom Budgets */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
        <h3 className="text-sm font-medium text-slate-200 mb-3">📋 Presupuestos Personalizados</h3>
        {categoryAllocations.length > 0 ? (
          <div className="space-y-3 mb-4">
            {categoryAllocations.map((a) => {
              const badge = getStatusBadge(a.status);
              const pct = a.recommended > 0 ? Math.min((a.actual / a.recommended) * 100, 100) : 0;
              return (
                <div key={a.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300">{a.emoji} {a.category}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.className}`}>{badge.text}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(a.status)}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                    <span>${a.actual.toLocaleString()}</span>
                    <span>Límite: ${a.recommended.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-3">Sin presupuestos personalizados</p>
        )}

        <AddBudgetForm budgets={budgets} onAdd={addBudget} onDelete={deleteBudget} />
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-2xl p-4 border border-cyan-700/20">
        <h3 className="text-sm font-medium text-cyan-200 mb-3">💡 Recomendaciones</h3>
        <ul className="space-y-2">
          {getAdvice().map((a, i) => (
            <li key={i} className="text-xs text-cyan-300/80 bg-cyan-900/10 rounded-lg px-3 py-2.5">{a}</li>
          ))}
        </ul>
      </div>

      {/* Projections */}
      {totalIncome > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
          <h3 className="text-sm font-medium text-slate-200 mb-3">📊 Proyecciones</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase">Gasto Diario</p>
              <p className="text-lg font-bold text-slate-200">${dailyAverage.toFixed(0)}</p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase">Días Restantes</p>
              <p className="text-lg font-bold text-slate-200">{daysLeft}</p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase">Proyección Final</p>
              <p className={`text-lg font-bold ${(balance - dailyAverage * daysLeft) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${(balance - dailyAverage * daysLeft).toFixed(0)}
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase">Presupuesto Diario</p>
              <p className="text-lg font-bold text-amber-400">
                ${balance > 0 ? (balance / Math.max(daysLeft, 1)).toFixed(0) : 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddBudgetForm({
  budgets,
  onAdd,
  onDelete,
}: {
  budgets: Budget[];
  onAdd: (b: { category: string; monthlyLimit: number; emoji: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');

  const expenseCats = ['Alimentación', 'Transporte', 'Vivienda', 'Servicios', 'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Tecnología', 'Mascotas', 'Suscripciones', 'Deudas', 'Hogar', 'Viajes', 'Fitness', 'Otro'];
  const available = expenseCats.filter((c) => !budgets.find((b) => b.category === c));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !limit) return;
    const emojis: Record<string, string> = {
      'Alimentación': '🍽️', 'Transporte': '🚗', 'Vivienda': '🏠', 'Servicios': '🔌',
      'Entretenimiento': '🎬', 'Salud': '🏥', 'Educación': '📚', 'Ropa': '👕',
      'Tecnología': '📱', 'Mascotas': '🐾', 'Suscripciones': '📺', 'Deudas': '💳',
      'Hogar': '🏡', 'Viajes': '✈️', 'Fitness': '🏋️', 'Otro': '📦',
    };
    onAdd({ category, monthlyLimit: parseFloat(limit), emoji: emojis[category] || '📦' });
    setCategory('');
    setLimit('');
  };

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">Agregar presupuesto por categoría</p>
      <form onSubmit={handleAdd} className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 bg-slate-900/80 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">Categoría</option>
          {available.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="Límite"
          className="w-24 bg-slate-900/80 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
        />
        <button
          type="submit"
          disabled={!category || !limit}
          className="bg-emerald-500/20 text-emerald-400 px-3 py-2.5 rounded-xl text-xs font-medium disabled:opacity-30 hover:bg-emerald-500/30 transition-colors"
        >
          +
        </button>
      </form>
      {budgets.length > 0 && (
        <div className="mt-2 space-y-1">
          {budgets.map((b) => (
            <div key={b.id} className="flex items-center justify-between bg-slate-900/40 rounded-lg px-2 py-1.5">
              <span className="text-xs text-slate-300">{b.emoji} {b.category}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">${b.monthlyLimit.toLocaleString()}</span>
                <button onClick={() => onDelete(b.id)} className="text-red-400/60 hover:text-red-400 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
