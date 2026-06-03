import { useEffect, useRef } from 'react';

type TabId = 'dashboard' | 'income' | 'expenses' | 'strategy' | 'goals' | 'delivery' | 'history' | 'profile';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Inicio', icon: '📊' },
  { id: 'income', label: 'Ingresos', icon: '💰' },
  { id: 'expenses', label: 'Gastos', icon: '💸' },
  { id: 'strategy', label: 'Plan', icon: '🎯' },
  { id: 'goals', label: 'Metas', icon: '⭐' },
  { id: 'delivery', label: 'Reparto', icon: '🛵' },
  { id: 'history', label: 'Historial', icon: '📅' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
];

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const idx = tabs.findIndex((t) => t.id === activeTab);
    const tabEl = el.children[idx] as HTMLElement;
    if (tabEl) {
      const offset = tabEl.offsetLeft - el.offsetWidth / 2 + tabEl.offsetWidth / 2;
      el.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80">
      <div
        ref={navRef}
        className="flex items-center overflow-x-auto no-scrollbar max-w-lg mx-auto safe-area-bottom"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] transition-all duration-300 relative shrink-0 ${
              activeTab === tab.id ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {activeTab === tab.id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-400 rounded-full" />
            )}
            <span className={`text-lg transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className="text-[9px] font-semibold leading-tight">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
