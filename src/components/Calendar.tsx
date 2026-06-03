import { useMemo, useState, useCallback } from 'react';
import type { Transaction } from '@/types';
import { CATEGORY_EMOJIS } from '@/types';

interface CalendarProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

interface DayData {
  date: Date;
  dateStr: string;
  dayNum: number;
  income: number;
  expense: number;
  transactions: Transaction[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function Calendar({ transactions, onDelete }: CalendarProps) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const navigate = useCallback((dir: number) => {
    setSelectedDay(null);
    setViewMonth((m) => {
      const newM = m + dir;
      if (newM < 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      if (newM > 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return newM;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDay(null);
    setViewYear(new Date().getFullYear());
    setViewMonth(new Date().getMonth());
  }, []);

  const calendarDays = useMemo((): DayData[] => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // First day of month (Monday=0 for Spanish locale)
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // getDay(): 0=Sun, 1=Mon ... 6=Sat → convert to Mon=0 ... Sun=6
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: DayData[] = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const date = new Date(viewYear, viewMonth - 1, d);
      const dateStr = date.toISOString().slice(0, 10);
      const dayTxs = transactions.filter((t) => t.date === dateStr);
      days.push({
        date, dateStr, dayNum: d,
        income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        transactions: dayTxs,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateStr = date.toISOString().slice(0, 10);
      const dayTxs = transactions.filter((t) => t.date === dateStr);
      days.push({
        date, dateStr, dayNum: d,
        income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        transactions: dayTxs,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill 6 rows (42 cells)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewYear, viewMonth + 1, d);
      const dateStr = date.toISOString().slice(0, 10);
      const dayTxs = transactions.filter((t) => t.date === dateStr);
      days.push({
        date, dateStr, dayNum: d,
        income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        transactions: dayTxs,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [viewYear, viewMonth, transactions]);

  const monthSummary = useMemo(() => {
    const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const monthTxs = transactions.filter((t) => t.date.startsWith(monthKey));
    const income = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const daysWithTxs = new Set(monthTxs.map((t) => t.date)).size;
    return { income, expenses, balance: income - expenses, total: monthTxs.length, daysWithTxs };
  }, [viewYear, viewMonth, transactions]);

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    const day = calendarDays.find((d) => d.dateStr === selectedDay);
    return day || null;
  }, [selectedDay, calendarDays]);

  const formatAmount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-2xl p-4 border border-indigo-700/30">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all"
          >
            ‹
          </button>
          <div className="text-center">
            <h2 className="text-base font-bold text-indigo-200">{monthNames[viewMonth]}</h2>
            <p className="text-xs text-indigo-400/60">{viewYear}</p>
          </div>
          <button
            onClick={() => navigate(1)}
            className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all"
          >
            ›
          </button>
        </div>

        {/* Month Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-500/5 rounded-lg p-2 text-center">
            <p className="text-[9px] text-emerald-500/60 uppercase">Ingresos</p>
            <p className="text-sm font-bold text-emerald-400">${formatAmount(monthSummary.income)}</p>
          </div>
          <div className="bg-red-500/5 rounded-lg p-2 text-center">
            <p className="text-[9px] text-red-500/60 uppercase">Gastos</p>
            <p className="text-sm font-bold text-red-400">${formatAmount(monthSummary.expenses)}</p>
          </div>
          <div className={`rounded-lg p-2 text-center ${monthSummary.balance >= 0 ? 'bg-blue-500/5' : 'bg-red-500/5'}`}>
            <p className="text-[9px] text-blue-500/60 uppercase">Balance</p>
            <p className={`text-sm font-bold ${monthSummary.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              ${formatAmount(monthSummary.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-[10px] text-slate-500 font-medium uppercase py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {calendarDays.map((day) => {
          const hasIncome = day.income > 0;
          const hasExpense = day.expense > 0;
          const hasTxs = day.transactions.length > 0;
          const isSelected = selectedDay === day.dateStr;

          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDay(isSelected ? null : day.dateStr)}
              className={`relative flex flex-col items-center py-1.5 px-0.5 rounded-xl transition-all min-h-[60px] ${
                !day.isCurrentMonth
                  ? 'opacity-30 bg-slate-800/20'
                  : isSelected
                  ? 'bg-indigo-500/20 border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-800/40 border border-slate-700/30 hover:bg-slate-700/40 hover:border-slate-600/40'
              } ${day.isToday ? 'ring-1 ring-emerald-500/60' : ''}`}
            >
              {/* Day Number */}
              <span className={`text-xs font-semibold leading-tight ${
                day.isToday
                  ? 'text-emerald-400'
                  : day.isCurrentMonth
                  ? 'text-slate-300'
                  : 'text-slate-600'
              }`}>
                {day.dayNum}
              </span>

              {/* Income/Expense Indicators */}
              {day.isCurrentMonth && (hasIncome || hasExpense) && (
                <div className="flex flex-col items-center gap-0 mt-0.5 w-full">
                  {hasIncome && (
                    <span className="text-[8px] text-emerald-400 font-medium leading-tight w-full text-center truncate px-0.5">
                      +{formatAmount(day.income)}
                    </span>
                  )}
                  {hasExpense && (
                    <span className="text-[8px] text-red-400 font-medium leading-tight w-full text-center truncate px-0.5">
                      -{formatAmount(day.expense)}
                    </span>
                  )}
                </div>
              )}

              {/* Dots indicator for non-current month */}
              {!day.isCurrentMonth && hasTxs && (
                <div className="flex gap-0.5 mt-1">
                  {hasIncome && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                  {hasExpense && <span className="w-1 h-1 rounded-full bg-red-400" />}
                </div>
              )}

              {/* Today marker */}
              {day.isToday && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Go to Today Button */}
      {(viewYear !== new Date().getFullYear() || viewMonth !== new Date().getMonth()) && (
        <button
          onClick={goToToday}
          className="w-full py-2.5 rounded-xl border border-slate-700/50 text-xs text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
        >
          📍 Ir al mes actual
        </button>
      )}

      {/* Selected Day Details */}
      {selectedDayData && (
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              📅 {new Date(selectedDayData.dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </h3>
          </div>

          {/* Day Summary */}
          <div className="flex gap-2">
            <div className="flex-1 bg-emerald-500/10 rounded-lg p-2 text-center">
              <p className="text-[9px] text-emerald-500/60 uppercase">Ingresos</p>
              <p className="text-sm font-bold text-emerald-400">${selectedDayData.income.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-red-500/10 rounded-lg p-2 text-center">
              <p className="text-[9px] text-red-500/60 uppercase">Gastos</p>
              <p className="text-sm font-bold text-red-400">${selectedDayData.expense.toLocaleString()}</p>
            </div>
            <div className={`flex-1 rounded-lg p-2 text-center ${
              (selectedDayData.income - selectedDayData.expense) >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'
            }`}>
              <p className="text-[9px] text-blue-500/60 uppercase">Neto</p>
              <p className={`text-sm font-bold ${
                (selectedDayData.income - selectedDayData.expense) >= 0 ? 'text-blue-400' : 'text-red-400'
              }`}>
                ${(selectedDayData.income - selectedDayData.expense).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Transactions List */}
          {selectedDayData.transactions.length > 0 ? (
            <div className="space-y-1.5">
              {selectedDayData.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{CATEGORY_EMOJIS[tx.category] || '📦'}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-200 truncate font-medium">{tx.description}</p>
                      <p className="text-[9px] text-slate-500">{tx.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs font-semibold tabular-nums ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors text-[10px] p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-2">Sin movimientos este día</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Ingreso
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400" /> Gasto
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-emerald-400/40" /> Hoy
        </span>
      </div>
    </div>
  );
}
