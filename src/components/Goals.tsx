import { useState } from 'react';
import type { SavingsGoal } from '@/types';

interface GoalsProps {
  goals: SavingsGoal[];
  addGoal: (g: { name: string; target: number; deadline: string; emoji: string }) => void;
  updateGoal: (id: string, current: number) => void;
  deleteGoal: (id: string) => void;
}

const GOAL_EMOJIS = ['🏠', '🚗', '✈️', '📱', '💻', '🎮', '🎓', '🏥', '💍', '🛒', '🎯', '🏦', '🐾', '📚', '⌚', '🎸'];

export default function Goals({ goals, addGoal, updateGoal, deleteGoal }: GoalsProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [emoji, setEmoji] = useState('🎯');

  const totalSaved = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target || !deadline) return;
    addGoal({ name, target: parseFloat(target), deadline, emoji });
    setName('');
    setTarget('');
    setDeadline('');
    setEmoji('🎯');
    setShowForm(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-2xl p-5 border border-amber-700/30">
        <h2 className="text-lg font-bold text-amber-200">⭐ Metas de Ahorro</h2>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-[10px] text-amber-500/60 uppercase">Total Ahorrado</p>
            <p className="text-xl font-bold text-amber-400">${totalSaved.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-amber-500/60 uppercase">Meta Total</p>
            <p className="text-xl font-bold text-amber-300">${totalTarget.toLocaleString()}</p>
          </div>
        </div>
        {totalTarget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-amber-500/60 mb-1">
              <span>Progreso General</span>
              <span>{Math.round((totalSaved / totalTarget) * 100)}%</span>
            </div>
            <div className="h-2 bg-amber-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/30">
          <p className="text-4xl mb-3">⭐</p>
          <p className="text-slate-400 text-sm">¡Crea tu primera meta de ahorro!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
            const remaining = goal.target - goal.current;
            const days = daysLeft(goal.deadline);
            const needed = days > 0 ? remaining / days : 0;

            return (
              <div key={goal.id} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{goal.name}</p>
                      <p className="text-[10px] text-slate-500">Meta: {formatDate(goal.deadline)} · {days} días</p>
                    </div>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-red-400 transition-colors text-xs p-1">
                    ✕
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">${goal.current.toLocaleString()}</span>
                    <span className="text-slate-500">${goal.target.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>{pct.toFixed(0)}% completado</span>
                    <span>Faltan ${remaining.toLocaleString()}</span>
                  </div>
                </div>

                {/* Daily needed */}
                {days > 0 && pct < 100 && (
                  <div className="bg-slate-900/50 rounded-xl px-3 py-2 mb-3">
                    <p className="text-[10px] text-slate-500">Necesitas ahorrar diariamente:</p>
                    <p className="text-sm font-semibold text-blue-400">${needed.toFixed(0)}</p>
                  </div>
                )}

                {/* Add funds */}
                {pct < 100 && (
                  <div className="flex gap-2">
                    {[50, 100, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => updateGoal(goal.id, Math.min(goal.current + amt, goal.target))}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg py-2 text-xs font-medium text-emerald-400 transition-all"
                      >
                        +${amt}
                      </button>
                    ))}
                  </div>
                )}

                {pct >= 100 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 text-center">
                    <p className="text-sm text-emerald-400 font-medium">🎉 ¡Meta alcanzada!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-700 text-slate-500 hover:border-amber-500/50 hover:text-amber-400 transition-all text-sm font-medium"
        >
          + Nueva Meta de Ahorro
        </button>
      ) : (
        <form onSubmit={handleAdd} className="bg-slate-800/50 rounded-2xl p-4 border border-amber-700/30 space-y-4">
          <h3 className="text-sm font-medium text-amber-200">Nueva Meta</h3>

          {/* Emoji Picker */}
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Ícono</p>
            <div className="flex gap-1.5 flex-wrap">
              {GOAL_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-xl p-1.5 rounded-lg transition-all ${
                    emoji === e ? 'bg-amber-500/20 scale-110' : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Vacaciones, Auto..."
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase mb-1">Meta ($)</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="10000"
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase mb-1">Fecha Límite</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-amber-500/50 [color-scheme:dark]"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-700/50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Crear Meta
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
