import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Loader2, Key, ExternalLink } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = Capacitor.isNativePlatform();

  const handleResetPassword = async () => {
    if (!email) {
      alert("Por favor, ingresa tu correo electrónico primero para enviarte el enlace de recuperación.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth',
    });
    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Te hemos enviado un correo con un enlace para recuperar tu contraseña. Revisa tu bandeja de entrada o spam.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/app');
      } else {
        if (!token) {
          throw new Error('Debes ingresar un Token válido para registrarte.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
              token,
            }
          }
        });
        if (error) throw error;
        alert('Registro exitoso. Ya puedes iniciar sesión.');
        setIsLogin(true);
      }
    } catch (error: any) {
      let msg = error.message || 'Ocurrió un error';
      if (msg.includes('Database error saving new user') || msg.toLowerCase().includes('token')) {
        msg = 'El Código Premium es inválido o ya fue utilizado. Por favor verifica tu código.';
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Volver
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-4xl block mb-2">💵</span>
            <h1 className="text-2xl font-bold">{(!isMobile && !isLogin) ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}</h1>
            <p className="text-slate-400 mt-2">
              {(!isMobile && !isLogin)
                ? 'Mantén tus finanzas seguras en la nube.'
                : 'Ingresa para sincronizar tus datos.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isMobile && !isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nombre Completo</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Celular</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Código Premium</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    <input
                      type="text"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-emerald-500/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="Ej: ABC-123-XYZ"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Obtén tu código premium contactando al administrador en la página web.</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {(!isMobile && !isLogin) ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </form>

          {isMobile ? (
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-sm text-slate-400 mb-3">¿Aún no tienes cuenta Premium?</p>
              <button
                onClick={async () => {
                  await Browser.open({ url: 'https://finsink.app' }); // CAMBIA ESTE ENLACE POR TU WEB REAL
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                Obtener cuenta Premium <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="mt-6 text-center text-sm text-slate-400">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {isLogin ? 'Regístrate' : 'Inicia Sesión'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
