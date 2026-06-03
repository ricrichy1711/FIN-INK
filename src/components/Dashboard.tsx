import { useMemo } from 'react';
import type { MonthlySummary, Transaction } from '@/types';
import SimpleChart from './SimpleChart';
import { CATEGORY_EMOJIS } from '@/types';

interface DashboardProps {
  summary: MonthlySummary;
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function Dashboard({ summary, transactions, onDelete }: DashboardProps) {
  const {
    totalIncome, totalExpenses, balance, savingsRate,
    categoryBreakdown, daysInMonth, dailyAverage,
    trend, prevMonthBalance, biggestExpense,
    incomeCount, expenseCount,
  } = summary;

  const daysLeft = daysInMonth - new Date().getDate();
  const dailyBudgetLeft = balance > 0 ? balance / Math.max(daysLeft, 1) : 0;
  const projectedFinal = balance - dailyAverage * daysLeft;

  const categoryChartData = categoryBreakdown.slice(0, 6).map((c) => ({
    label: c.emoji || '📦',
    value: c.amount,
    color: '',
  }));

  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  const trendText = trend === 'up' ? 'Gastos subiendo' : trend === 'down' ? 'Gastos bajando' : 'Gastos estables';
  const trendColor = trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-slate-400';

  const prevChange = prevMonthBalance !== 0
    ? ((balance - prevMonthBalance) / Math.abs(prevMonthBalance) * 100).toFixed(0)
    : null;

  // Last 7 days spending
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTotal = transactions
        .filter((t) => t.type === 'expense' && t.date === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      days.push({
        label: d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2),
        value: dayTotal,
        color: '',
      });
    }
    return days;
  }, [transactions]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Main Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-5 border border-slate-700/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm ${trendColor}`}>{trendIcon}</span>
          <p className={`text-xs font-medium ${trendColor}`}>{trendText}</p>
          {prevChange && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              Number(prevChange) >= 0
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {Number(prevChange) >= 0 ? '+' : ''}{prevChange}% vs mes anterior
            </span>
          )}
        </div>
        <p className={`text-4xl font-bold mt-2 tabular-nums tracking-tight ${
          balance >= 0 ? 'text-white' : 'text-red-400'
        }`}>
          ${balance.toLocaleString()}
        </p>
        <p className="text-slate-500 text-xs mt-1">Balance disponible</p>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-slate-900/60 rounded-xl p-2.5">
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Ingresos</p>
            <p className="text-emerald-400 font-semibold text-sm mt-0.5">${totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-2.5">
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Gastos</p>
            <p className="text-red-400 font-semibold text-sm mt-0.5">${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-2.5">
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Ahorro</p>
            <p className={`font-semibold text-sm mt-0.5 ${
              savingsRate >= 20 ? 'text-emerald-400' : savingsRate > 0 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {savingsRate.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Spending Bar */}
      {totalIncome > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400">Gastado del presupuesto</span>
            <span className="text-xs font-medium text-slate-300">
              {Math.round((totalExpenses / totalIncome) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                totalExpenses / totalIncome > 0.9 ? 'bg-red-500' :
                totalExpenses / totalIncome > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min((totalExpenses / totalIncome) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
            <span>$0</span>
            <span>${totalIncome.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Last 7 Days Chart */}
      {last7Days.some((d) => d.value > 0) && (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
          <h3 className="text-sm font-medium text-slate-200 mb-1">Últimos 7 Días</h3>
          <SimpleChart data={last7Days} type="bar" height={140} />
        </div>
      )}

      {/* Category Breakdown */}
      {categoryChartData.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
          <h3 className="text-sm font-medium text-slate-200 mb-1">Gastos por Categoría</h3>
          <SimpleChart data={categoryChartData} type="donut" height={180} totalLabel="Total" />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 rounded-2xl p-3.5 border border-violet-700/20">
          <p className="text-[10px] text-violet-400/60 uppercase tracking-wider">Presupuesto Diario</p>
          <p className="text-xl font-bold text-violet-300 mt-1 tabular-nums">
            ${dailyBudgetLeft > 0 ? dailyBudgetLeft.toFixed(0) : '0'}
          </p>
          <p className="text-[10px] text-violet-500/60 mt-0.5">{daysLeft} días restantes</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-2xl p-3.5 border border-cyan-700/20">
          <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider">Proyección Final</p>
          <p className={`text-xl font-bold mt-1 tabular-nums ${projectedFinal >= 0 ? 'text-cyan-300' : 'text-red-400'}`}>
            ${projectedFinal.toFixed(0)}
          </p>
          <p className="text-[10px] text-cyan-500/60 mt-0.5">al fin del mes</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Ingresos', value: incomeCount.toString(), emoji: '📥' },
          { label: 'Gastos', value: expenseCount.toString(), emoji: '📤' },
          { label: 'Prom. Diario', value: `$${dailyAverage.toFixed(0)}`, emoji: '📊' },
          { label: 'Mayor Gasto', value: biggestExpense ? `$${biggestExpense.amount.toLocaleString()}` : '$0', emoji: '🔝' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/40 rounded-xl p-2.5 text-center border border-slate-700/30">
            <p className="text-lg">{s.emoji}</p>
            <p className="text-xs font-semibold text-slate-200 mt-1 truncate">{s.value}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
        <h3 className="text-sm font-medium text-slate-200 mb-3">Últimos Movimientos</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-slate-400 text-sm">¡Empieza a registrar tus movimientos!</p>
            <p className="text-slate-600 text-xs mt-1">Toma el control de tu dinero 💪</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {transactions.slice(0, 8).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between bg-slate-800/70 rounded-xl px-3 py-2.5 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                    tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}>
                    {CATEGORY_EMOJIS[tx.category] || '📦'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 truncate font-medium">{tx.description}</p>
                    <p className="text-[10px] text-slate-500">{tx.category} · {formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-sm font-semibold tabular-nums ${
                    tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => onDelete(tx.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
