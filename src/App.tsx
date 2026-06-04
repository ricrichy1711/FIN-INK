import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import DashboardApp from '@/components/DashboardApp';
import Auth from '@/components/Auth';
import AdminPanel from '@/components/AdminPanel';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/utils/supabase';
import { useState, useEffect } from 'react';

const CURRENT_APP_VERSION = '1.0.0';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Cargando...</div>;
  
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function WebAppRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const isMobile = Capacitor.isNativePlatform();

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Cargando...</div>;

  // Si está en la web y NO tiene sesión iniciada, no puede usar la app en modo local
  if (!isMobile && !session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function GlobalProtection({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  if (profile?.status === 'banned') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
          <span className="text-4xl">⛔</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Cuenta Suspendida</h1>
          <p className="text-zinc-400 max-w-sm">
            Tu cuenta ha sido bloqueada permanentemente por violar nuestras políticas de servicio. No puedes acceder a la aplicación web ni móvil.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function UpdateChecker({ children }: { children: React.ReactNode }) {
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateUrl, setUpdateUrl] = useState('');

  useEffect(() => {
    async function checkVersion() {
      if (!Capacitor.isNativePlatform()) return; // Solo revisar en la app móvil
      
      const { data } = await supabase.from('app_settings').select('*').single();
      if (data && data.latest_version && data.latest_version !== CURRENT_APP_VERSION) {
        setUpdateRequired(true);
        setUpdateUrl(data.update_url || 'https://registro-de-gastos.vercel.app');
      }
    }
    checkVersion();
  }, []);

  if (updateRequired) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
          <span className="text-4xl animate-bounce">🚀</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">¡Nueva Versión!</h1>
          <p className="text-zinc-400 max-w-sm mb-8">
            Hay una versión más reciente de la aplicación disponible. Debes actualizar para seguir disfrutando de todas las funciones y mejoras.
          </p>
          <a 
            href={updateUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
          >
            Descargar Actualización
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('finSync_theme') || 'default';
      if (savedTheme === 'default') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    };
    applyTheme();
    window.addEventListener('storage', applyTheme);
    window.addEventListener('themeChanged', applyTheme);
    return () => {
      window.removeEventListener('storage', applyTheme);
      window.removeEventListener('themeChanged', applyTheme);
    };
  }, []);
  return <>{children}</>;
}

export default function App() {
  const isMobile = Capacitor.isNativePlatform();

  return (
    <ThemeProvider>
      <AuthProvider>
        <UpdateChecker>
          <GlobalProtection>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={isMobile ? <DashboardApp /> : <LandingPage />} />
                <Route path="/app" element={
                  <WebAppRoute>
                    <DashboardApp />
                  </WebAppRoute>
                } />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </GlobalProtection>
        </UpdateChecker>
      </AuthProvider>
    </ThemeProvider>
  );
}
