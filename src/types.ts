export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  time?: string;
  location?: { lat: number; lng: number };
  recurring?: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly';
}

export interface DeliveryOrder {
  id: string;
  amount: number;
  description: string;
  timestamp: string;
  date: string;
  time: string;
  location?: { lat: number; lng: number };
  syncedToTransactions: boolean;
}

export interface ShiftSummary {
  date: string;
  orders: DeliveryOrder[];
  totalEarnings: number;
  orderCount: number;
  averagePerOrder: number;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  emoji: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  emoji: string;
  createdAt: string;
}

export interface BudgetAllocation {
  category: string;
  percentage: number;
  recommended: number;
  actual: number;
  status: 'good' | 'warning' | 'danger';
  emoji?: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  categoryBreakdown: { category: string; amount: number; percentage: number; emoji?: string }[];
  daysInMonth: number;
  dailyAverage: number;
  weeklyAverage: number;
  trend: 'up' | 'down' | 'stable';
  prevMonthBalance: number;
  biggestExpense: { category: string; amount: number } | null;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
}

export interface MonthlyHistory {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Salario': '💼',
  'Freelance': '💻',
  'Ventas': '🛒',
  'Inversiones': '📈',
  'Regalo': '🎁',
  'Alimentación': '🍽️',
  'Transporte': '🚗',
  'Vivienda': '🏠',
  'Servicios': '🔌',
  'Entretenimiento': '🎬',
  'Salud': '🏥',
  'Educación': '📚',
  'Ropa': '👕',
  'Tecnología': '📱',
  'Mascotas': '🐾',
  'Deudas': '💳',
  'Suscripciones': '📺',
  'Hogar': '🏡',
  'Viajes': '✈️',
  'Fitness': '🏋️',
  'Ahorro': '🏦',
  'Otro': '📦',
};

export const INCOME_CATEGORIES = [
  'Salario',
  'Freelance',
  'Ventas',
  'Inversiones',
  'Regalo',
  'Otro',
] as const;

export const EXPENSE_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Ropa',
  'Tecnología',
  'Mascotas',
  'Suscripciones',
  'Deudas',
  'Hogar',
  'Viajes',
  'Fitness',
  'Otro',
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
