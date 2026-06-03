import { useState } from 'react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import type { Transaction } from '@/types';

interface TransactionFormProps {
  type: 'income' | 'expense';
  onSubmit: (t: Omit<Transaction, 'id'>) => void;
}

const EXPENSE_EMOJIS = {
  'Alimentación': '🍽️', 'Transporte': '🚗', 'Vivienda': '🏠', 'Servicios': '🔌',
  'Entretenimiento': '🎬', 'Salud': '🏥', 'Educación': '📚', 'Ropa': '👕',
  'Tecnología': '📱', 'Mascotas': '🐾', 'Suscripciones': '📺', 'Deudas': '💳',
  'Hogar': '🏡', 'Viajes': '✈️', 'Fitness': '🏋️', 'Otro': '📦',
};
const INCOME_EMOJIS = {
  'Salario': '💼', 'Freelance': '💻', 'Ventas': '🛒', 'Inversiones': '📈',
  'Regalo': '🎁', 'Otro': '📦',
};

export default function TransactionForm({ type, onSubmit }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showAllCategories, setShowAllCategories] = useState(false);

  const isExpense = type === 'expense';
  const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const emojis = isExpense ? EXPENSE_EMOJIS : INCOME_EMOJIS;

  const quickAmounts = isExpense
    ? [50, 100, 200, 500, 1000]
    : [500, 1000, 2000, 5000, 10000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !category) return;

    onSubmit({
      amount: numAmount,
      type,
      category,
      description: description.trim() || `${emojis[category as keyof typeof emojis] || ''} ${category}`,
      date,
    });

    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().slice(0, 10));
    setShowAllCategories(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-medium">Monto</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3.5 pl-9 pr-4 text-white text-xl font-semibold placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            required
          />
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {quickAmounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a.toString())}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                amount === a.toString()
                  ? isExpense
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              ${a.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-medium">Categoría</label>
        
        <button
          type="button"
          onClick={() => setShowAllCategories(!showAllCategories)}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
            category 
              ? isExpense 
                ? 'bg-red-500/10 border-red-500/30 text-red-200' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-slate-900/80 border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {category ? (
              <>
                <span className="text-xl">{emojis[category as keyof typeof emojis]}</span>
                <span className="font-medium text-white">{category}</span>
              </>
            ) : (
              <span className="font-medium text-slate-500">Seleccionar categoría...</span>
            )}
          </div>
          <span className="text-slate-500 text-xs">{showAllCategories ? '▲' : '▼'}</span>
        </button>

        {showAllCategories && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setShowAllCategories(false);
                }}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition-all text-center ${
                  category === cat
                    ? isExpense
                      ? 'bg-red-500/20 border-red-500/50 text-red-100 shadow-lg shadow-red-500/10'
                      : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <span className="text-lg">{emojis[cat as keyof typeof emojis] || '📦'}</span>
                <span className="text-[10px] font-medium leading-tight">{cat}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-medium">Descripción</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalle adicional..."
          className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5 font-medium">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all [color-scheme:dark]"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!amount || !category}
        className={`w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
          isExpense
            ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white disabled:from-red-500/30 disabled:to-rose-500/30 disabled:text-red-300/50'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white disabled:from-emerald-500/30 disabled:to-teal-500/30 disabled:text-emerald-300/50'
        }`}
      >
        {isExpense ? '💸 Registrar Gasto' : '💰 Registrar Ingreso'}
      </button>
    </form>
  );
}
