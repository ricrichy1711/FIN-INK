import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Transaction,
  MonthlySummary,
  BudgetAllocation,
  ExpenseCategory,
  Budget,
  SavingsGoal,
  MonthlyHistory,
} from '@/types';
import { CATEGORY_EMOJIS } from '@/types';

const STORAGE_TX_KEY = 'gastosapp_v2_transactions';
const STORAGE_BUDGET_KEY = 'gastosapp_v2_budgets';
const STORAGE_GOALS_KEY = 'gastosapp_v2_goals';
const STORAGE_PENDING_TX_KEY = 'gastosapp_v2_pending_tx';
const STORAGE_PENDING_DELETES_KEY = 'gastosapp_v2_pending_deletes';

function loadPendingTx(): Transaction[] {
  try { const raw = localStorage.getItem(STORAGE_PENDING_TX_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function savePendingTx(tx: Transaction[]) {
  if (tx.length === 0) localStorage.removeItem(STORAGE_PENDING_TX_KEY);
  else localStorage.setItem(STORAGE_PENDING_TX_KEY, JSON.stringify(tx));
}
function loadPendingDeletes(): string[] {
  try { const raw = localStorage.getItem(STORAGE_PENDING_DELETES_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function savePendingDeletes(ids: string[]) {
  if (ids.length === 0) localStorage.removeItem(STORAGE_PENDING_DELETES_KEY);
  else localStorage.setItem(STORAGE_PENDING_DELETES_KEY, JSON.stringify(ids));
}

function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_TX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(STORAGE_BUDGET_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTransactions(tx: Transaction[]) {
  localStorage.setItem(STORAGE_TX_KEY, JSON.stringify(tx));
}
function saveBudgets(b: Budget[]) {
  localStorage.setItem(STORAGE_BUDGET_KEY, JSON.stringify(b));
}
function saveGoals(g: SavingsGoal[]) {
  localStorage.setItem(STORAGE_GOALS_KEY, JSON.stringify(g));
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr + '-01T00:00:00');
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(loadBudgets);
  const [goals, setGoals] = useState<SavingsGoal[]>(loadGoals);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expenses' | 'strategy' | 'goals' | 'delivery' | 'history' | 'profile'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Sincronización Inteligente y Merge de Datos Locales
  const syncTransactions = useCallback(async () => {
    if (!user) return;
    
    // 1. Descargar transacciones de la nube
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      const cloudTx = data as Transaction[];
      
      // Procesar eliminaciones pendientes
      const pendingDeletes = loadPendingDeletes();
      if (pendingDeletes.length > 0) {
        supabase.from('transactions').delete().in('id', pendingDeletes).then(({ error }) => {
          if (!error) savePendingDeletes([]);
        });
      }

      // Filtrar de cloudTx los que acabamos de mandar a borrar
      const finalCloudTx = cloudTx.filter(t => !pendingDeletes.includes(t.id));

      // Procesar subidas pendientes
      const pendingTx = loadPendingTx();
      if (pendingTx.length > 0) {
        const txToInsert = pendingTx.map(t => ({
          id: t.id, user_id: user.id, type: t.type, amount: t.amount, category: t.category,
          description: t.description, date: t.date, time: t.time, location: t.location,
        }));
        
        supabase.from('transactions').insert(txToInsert).then(({ error }) => {
          if (!error) savePendingTx([]);
        });
      }

      // Combinar
      const mergedTx = [...finalCloudTx, ...pendingTx];
      mergedTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(mergedTx);
      saveTransactions(mergedTx);
    }
  }, [user]);

  // Sincronizar cuando el usuario cambia (ej. inicia sesión)
  useEffect(() => {
    if (user) {
      syncTransactions();
    }
  }, [user, syncTransactions]);

  // Sincronizar automáticamente cuando el celular recupera la conexión a internet
  useEffect(() => {
    window.addEventListener('online', syncTransactions);
    return () => window.removeEventListener('online', syncTransactions);
  }, [syncTransactions]);

  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveBudgets(budgets); }, [budgets]);
  useEffect(() => { saveGoals(goals); }, [goals]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...t, id: crypto.randomUUID() };
    setTransactions((prev) => [newTx, ...prev]);

    if (user) {
      if (navigator.onLine) {
        supabase.from('transactions').insert({
          id: newTx.id, user_id: user.id, type: newTx.type, amount: newTx.amount,
          category: newTx.category, description: newTx.description, date: newTx.date,
          time: newTx.time, location: newTx.location,
        }).then(({ error }) => {
          if (error) savePendingTx([...loadPendingTx(), newTx]);
        });
      } else {
        savePendingTx([...loadPendingTx(), newTx]);
      }
    }
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const pending = loadPendingTx();
    if (pending.some(t => t.id === id)) {
      savePendingTx(pending.filter(t => t.id !== id));
    }

    if (user) {
      if (navigator.onLine) {
        supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => {
          if (error) savePendingDeletes([...loadPendingDeletes(), id]);
        });
      } else {
        savePendingDeletes([...loadPendingDeletes(), id]);
      }
    }
  }, [user]);

  const addBudget = useCallback((b: Omit<Budget, 'id'>) => {
    const newB: Budget = { ...b, id: crypto.randomUUID() };
    setBudgets((prev) => [...prev.filter((p) => p.category !== b.category), newB]);
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addGoal = useCallback((g: Omit<SavingsGoal, 'id' | 'current' | 'createdAt'>) => {
    const newG: SavingsGoal = { ...g, id: crypto.randomUUID(), current: 0, createdAt: new Date().toISOString() };
    setGoals((prev) => [...prev, newG]);
  }, []);

  const updateGoal = useCallback((id: string, current: number) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, current } : g)));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  const getCurrentMonthTransactions = useCallback(() => {
    const now = new Date();
    const mk = getMonthKey(now);
    return transactions.filter((t) => getMonthKey(new Date(t.date)) === mk);
  }, [transactions]);

  const monthlyHistory = useMemo((): MonthlyHistory[] => {
    const monthMap: Record<string, { income: number; expenses: number }> = {};
    for (const t of transactions) {
      const mk = getMonthKey(new Date(t.date));
      if (!monthMap[mk]) monthMap[mk] = { income: 0, expenses: 0 };
      if (t.type === 'income') monthMap[mk].income += t.amount;
      else monthMap[mk].expenses += t.amount;
    }
    return Object.entries(monthMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .map(([mk, data]) => ({
        month: mk,
        monthLabel: getMonthLabel(mk),
        income: data.income,
        expenses: data.expenses,
        balance: data.income - data.expenses,
        savingsRate: data.income > 0 ? ((data.income - data.expenses) / data.income) * 100 : 0,
      }));
  }, [transactions]);

  const monthlySummary = useMemo((): MonthlySummary => {
    const monthTx = getCurrentMonthTransactions();
    const income = monthTx.filter((t) => t.type === 'income');
    const expenses = monthTx.filter((t) => t.type === 'expense');
    const totalIncome = income.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    const categoryTotals: Record<string, number> = {};
    for (const t of expenses) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        emoji: CATEGORY_EMOJIS[category] || '📦',
      }))
      .sort((a, b) => b.amount - a.amount);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const dailyAverage = daysPassed > 0 ? totalExpenses / daysPassed : 0;
    const weeklyAverage = totalExpenses / Math.max(Math.ceil(daysPassed / 7), 1);

    // Trend
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const thisWeekExpenses = expenses
      .filter((t) => t.date >= weekAgo)
      .reduce((s, t) => s + t.amount, 0);
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const prevWeekExpenses = expenses
      .filter((t) => t.date >= prevWeekStart && t.date < weekAgo)
      .reduce((s, t) => s + t.amount, 0);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (prevWeekExpenses > 0) {
      const diff = ((thisWeekExpenses - prevWeekExpenses) / prevWeekExpenses) * 100;
      trend = diff > 10 ? 'up' : diff < -10 ? 'down' : 'stable';
    }

    // Previous month balance
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMk = getMonthKey(prevMonth);
    const prevMonthTx = transactions.filter((t) => getMonthKey(new Date(t.date)) === prevMk);
    const prevIncome = prevMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const prevExpenses = prevMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const prevMonthBalance = prevIncome - prevExpenses;

    // Biggest expense
    const biggestExpense = categoryBreakdown.length > 0
      ? { category: categoryBreakdown[0].category, amount: categoryBreakdown[0].amount }
      : null;

    return {
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
      categoryBreakdown,
      daysInMonth,
      dailyAverage,
      weeklyAverage,
      trend,
      prevMonthBalance,
      biggestExpense,
      transactionCount: monthTx.length,
      incomeCount: income.length,
      expenseCount: expenses.length,
    };
  }, [getCurrentMonthTransactions, transactions]);

  const budgetStrategy = useMemo((): BudgetAllocation[] => {
    const { totalIncome, totalExpenses, categoryBreakdown } = monthlySummary;

    const needsCategories: ExpenseCategory[] = [
      'Alimentación', 'Transporte', 'Vivienda', 'Servicios', 'Salud', 'Educación', 'Deudas',
    ];
    const wantsCategories: ExpenseCategory[] = [
      'Entretenimiento', 'Ropa', 'Tecnología', 'Mascotas', 'Suscripciones', 'Hogar', 'Viajes', 'Fitness',
    ];

    const allocations: BudgetAllocation[] = [];

    const needsActual = categoryBreakdown
      .filter((c) => needsCategories.includes(c.category as ExpenseCategory))
      .reduce((s, c) => s + c.amount, 0);
    allocations.push({
      category: 'Necesidades', percentage: 50, recommended: totalIncome * 0.5,
      actual: needsActual,
      status: needsActual <= totalIncome * 0.5 ? 'good' : needsActual <= totalIncome * 0.6 ? 'warning' : 'danger',
      emoji: '🏠',
    });

    const wantsActual = categoryBreakdown
      .filter((c) => wantsCategories.includes(c.category as ExpenseCategory))
      .reduce((s, c) => s + c.amount, 0);
    allocations.push({
      category: 'Deseos', percentage: 30, recommended: totalIncome * 0.3,
      actual: wantsActual,
      status: wantsActual <= totalIncome * 0.3 ? 'good' : wantsActual <= totalIncome * 0.4 ? 'warning' : 'danger',
      emoji: '🎬',
    });

    const savingsActual = totalIncome - totalExpenses;
    allocations.push({
      category: 'Ahorro', percentage: 20, recommended: totalIncome * 0.2,
      actual: savingsActual > 0 ? savingsActual : 0,
      status: savingsActual >= totalIncome * 0.2 ? 'good' : savingsActual > 0 ? 'warning' : 'danger',
      emoji: '🏦',
    });

    // Custom budgets
    for (const budget of budgets) {
      const spent = categoryBreakdown.find((c) => c.category === budget.category)?.amount || 0;
      allocations.push({
        category: budget.category,
        percentage: totalIncome > 0 ? Math.round((spent / totalIncome) * 100) : 0,
        recommended: budget.monthlyLimit,
        actual: spent,
        status: spent <= budget.monthlyLimit * 0.7 ? 'good' : spent <= budget.monthlyLimit ? 'warning' : 'danger',
        emoji: budget.emoji || CATEGORY_EMOJIS[budget.category] || '📦',
      });
    }

    return allocations;
  }, [monthlySummary, budgets]);

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    monthlySummary,
    budgetStrategy,
    monthlyHistory,
    activeTab,
    setActiveTab,
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    budgets,
    addBudget,
    deleteBudget,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}
