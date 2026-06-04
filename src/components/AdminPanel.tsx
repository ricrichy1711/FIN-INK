import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, LayoutTemplate, Megaphone, Save, ArrowLeft, Key, Loader2, Activity, Menu, X, ShieldCheck, LogOut, Search, RefreshCcw, DollarSign, Image } from 'lucide-react';
import { supabase } from '@/utils/supabase';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface PromoBlock {
  id: string;
  type: 'image' | 'video' | 'text';
  url?: string;
  title?: string;
  description?: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'tokens' | 'cms'>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // CMS State
  const [contactEmail, setContactEmail] = useState('contacto@finsync.app');
  const [contactPhone, setContactPhone] = useState('+52 55 0000 0000');
  const [promoBanner, setPromoBanner] = useState('');
  const [promoBlocks, setPromoBlocks] = useState<PromoBlock[]>([
    { id: '1', type: 'image', url: '', title: '', description: '' },
    { id: '2', type: 'image', url: '', title: '', description: '' },
    { id: '3', type: 'image', url: '', title: '', description: '' }
  ]);
  
  // Supabase Users & Tokens
  const [users, setUsers] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokenDuration, setTokenDuration] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    setLoadingUsers(true);
    setLoadingTokens(true);
    
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (usersData) setUsers(usersData);
    
    const { data: tokensData } = await supabase.from('premium_tokens').select('*').order('created_at', { ascending: false });
    if (tokensData) setTokens(tokensData);
    
    // Fetch CMS settings
    const { data: settings } = await supabase.from('app_settings').select('*').single();
    if (settings) {
      if (settings.promo_blocks && settings.promo_blocks.length > 0) {
        setPromoBlocks(settings.promo_blocks);
      }
    }

    setLoadingUsers(false);
    setLoadingTokens(false);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchData();
    const savedContact = localStorage.getItem('finSync_contact');
    if (savedContact) {
      const parsed = JSON.parse(savedContact);
      if (parsed.email) setContactEmail(parsed.email);
      if (parsed.phone) setContactPhone(parsed.phone);
    }
    const savedPromo = localStorage.getItem('finSync_promo');
    if (savedPromo) setPromoBanner(savedPromo);
  }, []);

  const handleGenerateToken = async () => {
    const code = `FINSYNC-${tokenDuration}M-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { data, error } = await supabase.from('premium_tokens').insert({
      token: code,
      duration_months: tokenDuration
    }).select().single();

    if (error) {
      alert("Error creando token: " + error.message);
    } else {
      setTokens([data, ...tokens]);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string, warnings: number) => {
    if (!window.confirm(`¿Estás seguro de cambiar el estado a ${status.toUpperCase()}?`)) return;
    
    const { error } = await supabase.from('profiles').update({ status, warnings }).eq('id', userId);
    if (error) {
      alert("Error actualizando usuario: " + error.message);
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, status, warnings } : u));
    }
  };

  const handleSaveCMS = async () => {
    // Save to LocalStorage for backwards compatibility in other parts of the app
    localStorage.setItem('finSync_contact', JSON.stringify({ email: contactEmail, phone: contactPhone }));
    localStorage.setItem('finSync_promo', promoBanner);
    
    // Save Promo Blocks to Supabase
    const { error } = await supabase.from('app_settings').update({
      promo_blocks: promoBlocks
    }).eq('id', 1); // Assuming id 1 is the main settings row

    if (error) {
      alert('Error guardando en Supabase: ' + error.message + '\n\nNOTA: Asegúrate de haber ejecutado la migración de base de datos para agregar la columna promo_blocks en app_settings.');
    } else {
      alert('Cambios guardados exitosamente. Se reflejarán en la Landing Page al instante.');
    }
  };

  const navItems = [
    { id: 'users', label: 'Usuarios y Clientes', icon: Users, desc: 'Gestión de Cuentas Premium' },
    { id: 'tokens', label: 'Bóveda de Tokens', icon: Key, desc: 'Generador de Accesos Seguros' },
    { id: 'cms', label: 'Transmisión Web', icon: LayoutTemplate, desc: 'Control de Landing Page' },
  ];

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-400 font-sans selection:bg-emerald-500 selection:text-black flex overflow-hidden">
      
      {/* ── SIDEBAR (GLASS COMMAND) ────────────────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#050505] border-r border-white/[0.02] transition-transform duration-500 lg:translate-x-0 lg:static lg:block",
        isSidebarOpen ? "translate-x-0 outline-none ring-1 ring-emerald-500/20 shadow-2xl shadow-emerald-500/10" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-12 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center text-black font-bold">FS</div>
              <span className="text-xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">FIN$INK</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest italic">Núcleo</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-8 pr-1">
            <div>
              <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-3 px-2">Comandos Principales</p>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full group flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 relative overflow-hidden",
                      activeTab === item.id
                        ? "bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 text-white shadow-lg shadow-emerald-500/5 scale-[1.02]"
                        : "hover:bg-white/5 border border-transparent text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {activeTab === item.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                    )}
                    <item.icon className={cn("w-5 h-5 mt-0.5 shrink-0", activeTab === item.id ? "text-emerald-500" : "text-zinc-600 group-hover:text-zinc-400")} />
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest italic">{item.label}</p>
                      <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1 tracking-tighter opacity-70">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <div className="pt-6 border-t border-white/[0.03] space-y-4">
            <div className="bg-zinc-900/30 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black italic">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white uppercase truncate">Administrador</p>
                  <p className="text-[8px] text-zinc-600 uppercase font-bold truncate">Acceso Total</p>
                </div>
              </div>
            </div>
            <Link
              to="/app"
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all text-[10px] font-black uppercase tracking-widest italic border border-emerald-500/10"
            >
              <ArrowLeft className="w-4 h-4" /> <span>Volver a App</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── MAIN VIEWPORT (NEXUS ENGINE) ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#020202] relative overflow-hidden">
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/5 blur-[100px] rounded-full -ml-40 -mb-40 pointer-events-none"></div>

        {/* Header (Control Bar) */}
        <header className="h-20 border-b border-white/[0.03] flex items-center justify-between px-8 bg-[#050505]/80 backdrop-blur-xl z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-zinc-500 hover:text-white transition-all">
              {isSidebarOpen ? <X className="w-6 h-6 text-emerald-500" /> : <Menu className="w-6 h-6" />}
            </button>
            <div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-500" />
                {navItems.find(n => n.id === activeTab)?.label}
              </h2>
              <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-0.5">Centro de Comando</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-xl border border-white/5 ring-1 ring-white/5 focus-within:ring-emerald-500/30 transition-all">
              <Search className="w-3.5 h-3.5 text-zinc-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar entidad..."
                className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder:text-zinc-700 w-48"
              />
            </div>
            <button
              onClick={fetchData}
              className={cn(
                "p-3 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-emerald-500 transition-all",
                isRefreshing && "animate-spin text-emerald-500"
              )}
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 lg:p-12 custom-scrollbar relative z-10">
          
          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#09090b] border border-white/[0.05] rounded-[2rem] p-6 shadow-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500"><Users className="w-6 h-6"/></div>
                  <div><p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Total Usuarios</p><p className="text-2xl font-black text-white">{users.length}</p></div>
                </div>
                <div className="bg-[#09090b] border border-white/[0.05] rounded-[2rem] p-6 shadow-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500"><ShieldCheck className="w-6 h-6"/></div>
                  <div><p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Premium Activos</p><p className="text-2xl font-black text-white">{users.filter(u => u.premium_until && new Date(u.premium_until) > new Date()).length}</p></div>
                </div>
                <div className="bg-[#09090b] border border-white/[0.05] rounded-[2rem] p-6 shadow-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500"><DollarSign className="w-6 h-6"/></div>
                  <div><p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Roles Admin</p><p className="text-2xl font-black text-white">{users.filter(u => u.role === 'admin').length}</p></div>
                </div>
              </div>

              <div className="bg-[#09090b] border border-white/[0.05] rounded-[2.5rem] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#050505] border-b border-white/5">
                      <tr>
                        <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Identidad</th>
                        <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contacto</th>
                        <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Estado</th>
                        <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Moderación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {loadingUsers ? (
                        <tr><td colSpan={4} className="p-12 text-center text-emerald-500"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={4} className="p-12 text-center text-zinc-600 font-black uppercase tracking-widest text-[10px]">No se encontraron identidades en el ecosistema.</td></tr>
                      ) : (
                        filteredUsers.map(u => {
                          const isPremium = u.premium_until && new Date(u.premium_until) > new Date();
                          return (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="p-6">
                                <p className="text-sm font-bold text-white">{u.name || 'ANÓNIMO'}</p>
                                <p className="text-[10px] text-zinc-600 font-mono mt-1">{u.id.substring(0,8)}</p>
                                <span className={cn("inline-block mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border", u.role === 'admin' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700")}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-6">
                                <p className="text-xs text-zinc-400">{u.email}</p>
                                <p className="text-[10px] text-zinc-600 mt-1">{u.phone || 'Sin número'}</p>
                              </td>
                              <td className="p-6">
                                {u.status === 'banned' ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Baneado</span>
                                  </div>
                                ) : isPremium ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                      Premium ({new Date(u.premium_until).toLocaleDateString()})
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Básico Local</span>
                                  </div>
                                )}
                                {u.warnings > 0 && <p className="text-[9px] text-amber-500 font-bold mt-1 tracking-wider uppercase">⚠️ {u.warnings} Advertencias</p>}
                              </td>
                              <td className="p-6 text-right">
                                {u.role !== 'admin' && (
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => handleUpdateUserStatus(u.id, 'warned', (u.warnings || 0) + 1)}
                                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                      Advertir
                                    </button>
                                    {u.status === 'banned' ? (
                                      <button 
                                        onClick={() => handleUpdateUserStatus(u.id, 'active', 0)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                                      >
                                        Desbanear
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => handleUpdateUserStatus(u.id, 'banned', u.warnings)}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black border border-red-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                                      >
                                        Banear
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TOKENS */}
          {activeTab === 'tokens' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="bg-gradient-to-br from-[#09090b] to-[#050505] border border-white/[0.05] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                      <Key className="w-6 h-6 text-emerald-500" /> Bóveda Criptográfica
                    </h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Generador de Llaves de Acceso Premium</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
                    <select 
                      value={tokenDuration} 
                      onChange={e => setTokenDuration(Number(e.target.value))}
                      className="bg-[#050505] border border-white/10 rounded-xl px-6 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                    >
                      <option value={1}>Protocolo 1 Mes</option>
                      <option value={3}>Protocolo 3 Meses</option>
                      <option value={6}>Protocolo 6 Meses</option>
                      <option value={12}>Protocolo 1 Año</option>
                    </select>
                    <button 
                      onClick={handleGenerateToken}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl text-sm font-black uppercase italic tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <Zap className="w-4 h-4" /> Ejecutar Generación
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#09090b] border border-white/[0.05] rounded-[2.5rem] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#050505] border-b border-white/5">
                      <tr>
                        <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Firma Hash (Código)</th>
                        <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tiempo Habilitado</th>
                        <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Estatus de Integridad</th>
                        <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Generación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {loadingTokens ? (
                        <tr><td colSpan={4} className="p-12 text-center text-emerald-500"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></td></tr>
                      ) : tokens.length === 0 ? (
                        <tr><td colSpan={4} className="p-12 text-center text-zinc-600 font-black uppercase tracking-widest text-[10px]">La bóveda está vacía.</td></tr>
                      ) : (
                        tokens.map(t => (
                          <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-6">
                              <span className="font-mono text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">{t.token}</span>
                            </td>
                            <td className="p-6 text-sm text-white font-bold">{t.duration_months} MESES</td>
                            <td className="p-6">
                              {t.is_used ? (
                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-zinc-800 text-zinc-500 border-zinc-700 flex items-center gap-1.5 inline-flex">
                                  <Lock className="w-3 h-3" /> Consumido
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5 inline-flex">
                                  <ShieldCheck className="w-3 h-3" /> Intacto
                                </span>
                              )}
                            </td>
                            <td className="p-6 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                              {new Date(t.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CMS */}
          {activeTab === 'cms' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="bg-[#09090b] border border-white/[0.05] rounded-[3rem] p-10 shadow-2xl">
                <div className="mb-10">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                    <LayoutTemplate className="w-6 h-6 text-amber-500" /> Transmisión Web
                  </h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Configuración de Landing Page Externa</p>
                </div>
                
                <div className="space-y-8">
                  <div className="p-6 bg-[#050505] rounded-3xl border border-white/5 space-y-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-500" /> Modulador de Alertas (Banner)</h3>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Mensaje en tiempo real (Dejar vacío para ocultar)</label>
                      <input 
                        type="text" 
                        value={promoBanner}
                        onChange={e => setPromoBanner(e.target.value)}
                        className="w-full bg-[#020202] border border-white/10 rounded-2xl p-4 text-sm font-medium text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                        placeholder="Ej: ¡Descuento de fin de año!"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-[#050505] rounded-3xl border border-white/5 space-y-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-emerald-500" /> Vectores de Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Email Operativo</label>
                        <input 
                          type="email" 
                          value={contactEmail}
                          onChange={e => setContactEmail(e.target.value)}
                          className="w-full bg-[#020202] border border-white/10 rounded-2xl p-4 text-sm font-medium text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Canal WhatsApp (Con código)</label>
                        <input 
                          type="text" 
                          value={contactPhone}
                          onChange={e => setContactPhone(e.target.value)}
                          className="w-full bg-[#020202] border border-white/10 rounded-2xl p-4 text-sm font-medium text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-[#050505] rounded-3xl border border-white/5 space-y-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><Image className="w-4 h-4 text-emerald-500" /> Bloques Multimedia (Landing Page)</h3>
                    <p className="text-xs text-zinc-500 mb-4">Configura los 3 bloques que aparecen antes de los precios en la página principal.</p>
                    <div className="space-y-8">
                      {promoBlocks.map((block, index) => (
                        <div key={block.id} className="p-4 bg-[#09090b] border border-white/5 rounded-2xl space-y-4">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Bloque {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Tipo de Medio</label>
                              <select
                                value={block.type}
                                onChange={(e) => setPromoBlocks(blocks => blocks.map(b => b.id === block.id ? { ...b, type: e.target.value as any } : b))}
                                className="w-full bg-[#020202] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                              >
                                <option value="text">Solo Texto</option>
                                <option value="image">Imagen / GIF</option>
                                <option value="video">Video (MP4)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">URL del Archivo (Imagen/Video)</label>
                              <input 
                                type="text"
                                placeholder="https://ejemplo.com/foto.png"
                                value={block.url || ''}
                                onChange={(e) => setPromoBlocks(blocks => blocks.map(b => b.id === block.id ? { ...b, url: e.target.value } : b))}
                                className="w-full bg-[#020202] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                                disabled={block.type === 'text'}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Título Principal</label>
                              <input 
                                type="text"
                                value={block.title || ''}
                                onChange={(e) => setPromoBlocks(blocks => blocks.map(b => b.id === block.id ? { ...b, title: e.target.value } : b))}
                                className="w-full bg-[#020202] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Descripción Corta</label>
                              <textarea 
                                value={block.description || ''}
                                onChange={(e) => setPromoBlocks(blocks => blocks.map(b => b.id === block.id ? { ...b, description: e.target.value } : b))}
                                className="w-full bg-[#020202] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleSaveCMS}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-2xl text-sm font-black uppercase italic tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <Save className="w-5 h-5" /> Sincronizar Cambios a Web
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function Zap(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
}
function Lock(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}
