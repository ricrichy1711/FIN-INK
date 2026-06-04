import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, LogOut, Download, Trash2, Shield, Settings, Calendar, Bell, Cloud, Smartphone, Lock, Palette } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, profile } = useAuth();

  const user = authUser ? {
    name: authUser.user_metadata?.name || 'Usuario Premium',
    email: authUser.email || '',
    phone: authUser.user_metadata?.phone || '',
    plan: 'Premium SaaS',
    planEnd: 'Suscripción Activa'
  } : null;

  const [announcement, setAnnouncement] = useState('');
  const [localName, setLocalName] = useState('');
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [tempLocalName, setTempLocalName] = useState('');
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('finSync_theme') || 'default');

  const THEMES = [
    { id: 'default', name: 'Classic Dark', color: 'bg-slate-900', premium: false },
    { id: 'midnight', name: 'Midnight', color: 'bg-blue-950', premium: false },
    { id: 'light', name: 'High Contrast', color: 'bg-white text-black', premium: false },
    { id: 'sunset', name: 'Sunset', color: 'bg-rose-950', premium: false },
    { id: 'dracula', name: 'Dracula', color: 'bg-purple-950', premium: false },
    { id: 'gold', name: 'Gold Luxury', color: 'bg-yellow-900', premium: true },
    { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-cyan-950', premium: true },
    { id: 'ocean', name: 'Ocean Light', color: 'bg-sky-200 text-sky-900', premium: true },
    { id: 'forest', name: 'Forest', color: 'bg-emerald-950', premium: true },
    { id: 'mono', name: 'Monochrome', color: 'bg-zinc-100 text-zinc-900', premium: true },
  ];

  const handleThemeChange = (themeId: string, isPremium: boolean) => {
    const isUserPremium = !!authUser;
    if (isPremium && !isUserPremium) {
      alert("Este tema es exclusivo para usuarios Premium. ¡Adquiere Premium para desbloquearlo!");
      return;
    }
    localStorage.setItem('finSync_theme', themeId);
    setCurrentTheme(themeId);
    window.dispatchEvent(new Event('themeChanged'));
  };

  const ThemeSelectorUi = () => (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/30 overflow-hidden mb-6">
      <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
        <Palette className="w-5 h-5 text-emerald-500" />
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Temas Visuales</h3>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {THEMES.map(theme => {
          const isUserPremium = !!authUser;
          const locked = theme.premium && !isUserPremium;
          return (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id, theme.premium)}
              className={`relative h-16 rounded-xl border-2 flex items-center justify-center transition-all overflow-hidden ${theme.color} ${currentTheme === theme.id ? 'border-emerald-500 scale-105' : 'border-slate-700/50 hover:border-slate-500'}`}
            >
              {locked && <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center"><Lock className="w-4 h-4 text-white/70" /></div>}
              <span className="text-[10px] font-black tracking-widest uppercase z-10 px-1 text-center drop-shadow-md">{theme.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    const promo = localStorage.getItem('finSync_promo');
    if (promo) setAnnouncement(promo);

    const savedLocalName = localStorage.getItem('gastosapp_local_name');
    if (savedLocalName) setLocalName(savedLocalName);
  }, []);

  const saveLocalName = () => {
    if (tempLocalName.trim()) {
      localStorage.setItem('gastosapp_local_name', tempLocalName.trim());
      setLocalName(tempLocalName.trim());
      setIsEditingLocal(false);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('⚠️ ADVERTENCIA: Esta acción borrará permanentemente todos tus registros locales (gastos, ingresos y repartos). ¿Estás completamente seguro de continuar?')) {
      if (authUser) {
        await supabase.from('transactions').delete().eq('user_id', authUser.id);
      }
      localStorage.removeItem('gastosapp_transactions');
      localStorage.removeItem('gastosapp_deliveries');
      localStorage.removeItem('gastosapp_goals');
      localStorage.removeItem('gastosapp_budgets');
      localStorage.removeItem('gastosapp_local_name');
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (!user) {
    return (
      <div className="space-y-6 pb-20">
        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 text-center space-y-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Smartphone className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Modo Local (Gratis)</h2>
            <p className="text-slate-400 text-sm">
              Tus datos se están guardando únicamente en este dispositivo. Si pierdes la aplicación, perderás tus registros.
            </p>
          </div>

          {!localName && !isEditingLocal ? (
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <p className="text-sm text-slate-300 mb-3">Ingresa tu nombre para personalizar tu perfil:</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={tempLocalName}
                  onChange={(e) => setTempLocalName(e.target.value)}
                  placeholder="Tu nombre..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button onClick={saveLocalName} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
                  Guardar
                </button>
              </div>
            </div>
          ) : localName ? (
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Perfil Local</p>
                <p className="text-lg font-bold text-slate-200">{localName}</p>
              </div>
              <button onClick={() => { setIsEditingLocal(true); setTempLocalName(localName); setLocalName(''); }} className="text-xs text-slate-400 underline">Editar</button>
            </div>
          ) : null}

          <Link to="/auth" className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all">
            <Cloud className="w-5 h-5" />
            Adquirir Premium / Iniciar Sesión
          </Link>
        </div>
        
        <ThemeSelectorUi />
        
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/30 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Opciones Locales</h3>
          </div>
          <div className="p-2">
            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-xl transition-colors text-left text-slate-300">
              <Download className="w-5 h-5 text-slate-400" />
              <span className="flex-1">Exportar mis datos (CSV)</span>
            </button>
            <button onClick={handleClearData} className="w-full flex items-center gap-3 p-3 hover:bg-red-900/20 rounded-xl transition-colors text-left text-red-400">
              <Trash2 className="w-5 h-5" />
              <span className="flex-1">Borrar todos mis datos</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-2xl p-6 border border-indigo-700/30 flex items-center gap-4">
        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-indigo-200">{user.name}</h2>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full mt-1 border border-emerald-400/20">
            <Shield className="w-3 h-3" />
            {user.plan}
          </span>
        </div>
      </div>

      <ThemeSelectorUi />

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/30 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Datos de la Cuenta</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Correo Electrónico</p>
              <p className="text-sm text-white">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Nivel de Acceso (DB)</p>
              <p className="text-sm text-white font-mono">{profile?.role || 'user'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
              <Phone className="w-5 h-5" />
            </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Celular</p>
              <p className="text-sm text-white">{user.phone || 'No registrado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
            <div>
              <p className="text-xs text-slate-500 mb-1">Tu ID Único (Pégalo en Supabase)</p>
              <p className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 p-2 rounded border border-emerald-500/20 select-all">{authUser?.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Vencimiento Premium</p>
              <p className="text-sm font-bold text-emerald-400">{user.planEnd}</p>
            </div>
          </div>
        </div>
      </div>

      {announcement && (
        <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 rounded-2xl p-4 border border-blue-500/30 flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-blue-300 mb-1">Aviso del Administrador</h3>
            <p className="text-sm text-blue-100">{announcement}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/30 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Opciones</h3>
        </div>
        <div className="p-2">
          <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-xl transition-colors text-left text-slate-300">
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="flex-1">Cambiar Contraseña</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-xl transition-colors text-left text-slate-300">
            <Download className="w-5 h-5 text-slate-400" />
            <span className="flex-1">Exportar mis datos (CSV)</span>
          </button>
          <button onClick={handleClearData} className="w-full flex items-center gap-3 p-3 hover:bg-red-900/20 rounded-xl transition-colors text-left text-red-400">
            <Trash2 className="w-5 h-5" />
            <span className="flex-1">Borrar todos mis datos</span>
          </button>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Cerrar Sesión
      </button>
    </div>
  );
}
