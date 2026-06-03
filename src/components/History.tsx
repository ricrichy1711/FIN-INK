import { useMemo, useState } from 'react';
import type { Transaction, MonthlyHistory } from '@/types';
import SimpleChart from './SimpleChart';
import Calendar from './Calendar';

interface HistoryProps {
  history: MonthlyHistory[];
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function History({ history, transactions, onDelete }: HistoryProps) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'chart' | 'list'>('calendar');

  const chartData = useMemo(() => {
    return [...history]
      .reverse()
      .map((h) => ({
        label: h.monthLabel,
        value: h.expenses,
        color: '',
      }));
  }, [history]);

  const incomeChartData = useMemo(() => {
    return [...history]
      .reverse()
      .map((h) => ({
        label: h.monthLabel,
        value: h.income,
        color: '#10b981',
      }));
  }, [history]);

  const selectedTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions.filter((t) => t.date.startsWith(selectedMonth)).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, selectedMonth]);

  const selectedSummary = history.find((h) => h.month === selectedMonth);
  const totalAllTime = useMemo(() => {
    return {
      income: history.reduce((s, h) => s + h.income, 0),
      expenses: history.reduce((s, h) => s + h.expenses, 0),
    };
  }, [history]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const CATEGORY_EMOJIS: Record<string, string> = {
    'Salario': '💼', 'Freelance': '💻', 'Ventas': '🛒', 'Inversiones': '📈',
    'Regalo': '🎁', 'Alimentación': '🍽️', 'Transporte': '🚗', 'Vivienda': '🏠',
    'Servicios': '🔌', 'Entretenimiento': '🎬', 'Salud': '🏥', 'Educación': '📚',
    'Ropa': '👕', 'Tecnología': '📱', 'Mascotas': '🐾', 'Deudas': '💳',
    'Suscripciones': '📺', 'Hogar': '🏡', 'Viajes': '✈️', 'Fitness': '🏋️',
    'Ahorro': '🏦', 'Otro': '📦',
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-900/30 to-blue-900/30 rounded-2xl p-5 border border-sky-700/30">
        <h2 className="text-lg font-bold text-sky-200">📅 Historial</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-sky-900/20 rounded-xl p-2.5">
            <p className="text-[10px] text-sky-500/60 uppercase">Ingresos Totales</p>
            <p className="text-lg font-bold text-emerald-400">${totalAllTime.income.toLocaleString()}</p>
          </div>
          <div className="bg-sky-900/20 rounded-xl p-2.5">
            <p className="text-[10px] text-sky-500/60 uppercase">Gastos Totales</p>
            <p className="text-lg font-bold text-red-400">${totalAllTime.expenses.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
        {([
          { id: 'calendar' as const, label: '📅 Calendario' },
          { id: 'chart' as const, label: '📊 Gráfico' },
          { id: 'list' as const, label: '📋 Lista' },
        ]).map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === mode.id
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Calendar transactions={transactions} onDelete={onDelete} />
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="space-y-4">
          {history.length > 0 ? (
            <>
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                <h3 className="text-sm font-medium text-slate-200 mb-3">Gastos Mensuales</h3>
                <SimpleChart data={chartData} type="bar" height={160} />
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                <h3 className="text-sm font-medium text-slate-200 mb-3">Ingresos Mensuales</h3>
                <SimpleChart data={incomeChartData} type="bar" height={160} />
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                <h3 className="text-sm font-medium text-slate-200 mb-3">Balance Mensual</h3>
                <SimpleChart
                  data={[...history].reverse().map((h) => ({
                    label: h.monthLabel,
                    value: Math.max(h.balance, 0),
                    color: h.balance >= 0 ? '#10b981' : '#ef4444',
                  }))}
                  type="bar"
                  height={160}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/30">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-slate-400 text-sm">Aún no hay datos históricos</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {/* Month Selector */}
          {history.length > 0 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700/50 rounded-xl px-3 py-3 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">Selecciona un mes</option>
              {history.map((h) => (
                <option key={h.month} value={h.month}>
                  {h.monthLabel} — ${h.balance >= 0 ? '' : '-'}${Math.abs(h.balance).toLocaleString()}
                </option>
              ))}
            </select>
          )}

          {selectedSummary && (
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-200">{selectedSummary.monthLabel}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  selectedSummary.balance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  ${selectedSummary.balance.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <p className="text-[10px] text-slate-500">Ingresos</p>
                  <p className="text-sm font-semibold text-emerald-400">${selectedSummary.income.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <p className="text-[10px] text-slate-500">Gastos</p>
                  <p className="text-sm font-semibold text-red-400">${selectedSummary.expenses.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <p className="text-[10px] text-slate-500">Ahorro</p>
                  <p className={`text-sm font-semibold ${selectedSummary.savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedSummary.savingsRate.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Month Transactions */}
          {selectedTransactions.length > 0 && (
            <div className="space-y-1.5">
              {selectedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700/30"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">{CATEGORY_EMOJIS[tx.category] || '📦'}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{tx.description}</p>
                      <p className="text-[10px] text-slate-500">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-sm font-semibold tabular-nums ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                    <button onClick={() => onDelete(tx.id)} className="text-slate-600 hover:text-red-400 text-xs p-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full History Table */}
          {history.length > 0 && !selectedMonth && (
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
              <h3 className="text-sm font-medium text-slate-200 mb-3">Resumen Mensual</h3>
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.month}
                    onClick={() => setSelectedMonth(h.month)}
                    className="flex items-center justify-between bg-slate-800/70 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-sm text-slate-300 font-medium">{h.monthLabel}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-emerald-400 tabular-nums">+${h.income.toLocaleString()}</span>
                      <span className="text-xs text-red-400 tabular-nums">-${h.expenses.toLocaleString()}</span>
                      <span className={`text-sm font-semibold tabular-nums ${h.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                        ${h.balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedMonth && history.length === 0 && (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/30">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-slate-400 text-sm">Sin datos aún</p>
            </div>
          )}
        </div>
      )}

      {/* Export */}
      {transactions.length > 0 && (
        <button
          onClick={() => {
            const data = JSON.stringify(transactions, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mi_dinero_export_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full py-3 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-500 hover:text-slate-300 transition-all"
        >
          📤 Exportar Datos (JSON)
        </button>
      )}
    </div>
  );
}
