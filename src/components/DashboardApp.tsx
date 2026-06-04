import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import Strategy from '@/components/Strategy';
import Goals from '@/components/Goals';
import DeliveryPanel from '@/components/DeliveryPanel';
import History from '@/components/History';
import Profile from '@/components/Profile';

export default function DashboardApp() {
  const { profile, user } = useAuth();
  
  const isAdmin = profile?.role === 'admin' || user?.email === 'ricrichy1711@gmail.com';

  const localName = localStorage.getItem('gastosapp_local_name');
  const displayTitle = isAdmin
    ? 'Mi Dinero' 
    : (user?.user_metadata?.name || localName || 'Mi Dinero');

  const {
    transactions,
    addTransaction,
    deleteTransaction,
    monthlySummary,
    budgetStrategy,
    monthlyHistory,
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    budgets,
    addBudget,
    deleteBudget,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useTransactions();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💵</span>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight leading-tight">{displayTitle}</h1>
                <p className="text-[10px] text-slate-500 leading-tight">Administración de gastos e ingresos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin" className="text-xs text-emerald-400 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg font-bold transition-colors hover:bg-emerald-500/20">
                  Panel Admin
                </Link>
              )}
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 px-2 py-1 bg-slate-800 rounded-lg">
                  Limpiar
                </button>
              )}
            </div>
          </div>
          {/* Search */}
          <div className="mt-2.5 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar transacciones..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 pt-4">
        {activeTab === 'dashboard' && (
          <Dashboard
            summary={monthlySummary}
            transactions={searchQuery ? filteredTransactions : transactions}
            onDelete={deleteTransaction}
          />
        )}

        {activeTab === 'income' && (
          <div className="space-y-4 pb-20">
            <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-2xl p-5 border border-emerald-700/30">
              <h2 className="text-lg font-bold text-emerald-200">💰 Ingresos</h2>
              <p className="text-emerald-400/60 text-xs mt-1">Registra tus ganancias</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
              <TransactionForm type="income" onSubmit={addTransaction} />
            </div>
            <TransactionList transactions={searchQuery ? filteredTransactions : transactions} type="income" onDelete={deleteTransaction} />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-4 pb-20">
            <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 rounded-2xl p-5 border border-red-700/30">
              <h2 className="text-lg font-bold text-red-200">💸 Gastos</h2>
              <p className="text-red-400/60 text-xs mt-1">Cada peso cuenta</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
              <TransactionForm type="expense" onSubmit={addTransaction} />
            </div>
            <TransactionList transactions={searchQuery ? filteredTransactions : transactions} type="expense" onDelete={deleteTransaction} />
          </div>
        )}

        {activeTab === 'strategy' && (
          <Strategy
            summary={monthlySummary}
            allocations={budgetStrategy}
            budgets={budgets}
            addBudget={addBudget}
            deleteBudget={deleteBudget}
          />
        )}

        {activeTab === 'goals' && (
          <Goals
            goals={goals}
            addGoal={addGoal}
            updateGoal={updateGoal}
            deleteGoal={deleteGoal}
          />
        )}

        {activeTab === 'delivery' && (
          <DeliveryPanel
            onSyncToTransactions={(orders) => {
              if (orders.length === 0) return;
              
              const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
              const date = orders[0].date;
              const dObj = new Date(date + 'T12:00:00');
              const dateStr = dObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
              const average = (totalAmount / orders.length).toFixed(0);
              
              addTransaction({
                amount: totalAmount,
                type: 'income',
                category: 'Freelance',
                description: `🛵 Turno Reparto (${dateStr}): ${orders.length} pedidos. Prom: $${average}`,
                date: date,
                time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
              });
            }}
          />
        )}

        {activeTab === 'history' && (
          <History
            history={monthlyHistory}
            transactions={transactions}
            onDelete={deleteTransaction}
          />
        )}

        {activeTab === 'profile' && <Profile />}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
