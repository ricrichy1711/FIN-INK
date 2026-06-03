import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Smartphone, ShieldCheck, Download, LogIn, Check, Mail, MessageCircle, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  const [contactEmail, setContactEmail] = useState('contacto@finsync.app');
  const [contactPhone, setContactPhone] = useState('+52 55 0000 0000');
  const [promoBanner, setPromoBanner] = useState('');

  useEffect(() => {
    const savedContact = localStorage.getItem('finSync_contact');
    if (savedContact) {
      const parsed = JSON.parse(savedContact);
      if (parsed.email) setContactEmail(parsed.email);
      if (parsed.phone) setContactPhone(parsed.phone);
    }
    const savedPromo = localStorage.getItem('finSync_promo');
    if (savedPromo) setPromoBanner(savedPromo);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30 pb-20">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FinSync Logo" className="w-8 h-8 rounded-lg shadow-md" />
            <span className="text-xl font-bold tracking-tight">FIN$INK</span>
          </div>
          <div className="flex gap-4">
            <Link to="/auth" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Promotional Banner */}
      {promoBanner && (
        <div className="mt-20 max-w-6xl mx-auto px-4">
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-center gap-3 text-emerald-200">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm md:text-base text-center">{promoBanner}</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className={`px-4 ${promoBanner ? 'pt-12' : 'pt-32'} pb-20`}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            ¡Nueva versión con sincronización en la nube!
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
            Controla tus gastos,<br/> sin perder un solo dato.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Regístrate para mantener todo sincronizado en la nube entre tu celular y la web. O si prefieres, descarga la app e instálala en tu celular gratis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              to="/auth" 
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Cloud className="w-5 h-5" />
              Crear Cuenta Premium
            </Link>
            
            <a 
              href="#descargar" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl transition-all border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Descargar APK Gratis
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 text-emerald-400">
              <Cloud className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Sincronización Total</h3>
            <p className="text-slate-400">Crea una cuenta y tus datos estarán seguros en la nube. Accede desde tu celular, tablet o computadora en cualquier momento.</p>
          </div>

          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Uso Local Offline</h3>
            <p className="text-slate-400">¿No quieres crear una cuenta? Descarga la app y úsala sin internet. Todos los datos se guardarán localmente en tu dispositivo.</p>
          </div>

          <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Privacidad Garantizada</h3>
            <p className="text-slate-400">Tu información financiera está encriptada y segura. Nadie más tiene acceso a tus presupuestos o historiales de gastos.</p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="max-w-6xl mx-auto mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planes Simples y Transparentes</h2>
            <p className="text-slate-400">Comienza a ordenar tus finanzas hoy mismo.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Básico</h3>
              <div className="text-4xl font-bold mb-6 text-slate-300">Gratis</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-400"><Check className="w-5 h-5 text-emerald-500" /> Registro de gastos e ingresos</li>
                <li className="flex items-center gap-3 text-slate-400"><Check className="w-5 h-5 text-emerald-500" /> Historial y Estadísticas</li>
                <li className="flex items-center gap-3 text-slate-400"><Check className="w-5 h-5 text-emerald-500" /> Guardado Local (Offline)</li>
              </ul>
              <a href="#descargar" className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all border border-slate-700 text-center flex items-center justify-center gap-2">
                <Smartphone className="w-4 h-4"/> Descargar la App
              </a>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 p-8 rounded-3xl border border-emerald-500/50 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMENDADO</div>
              <h3 className="text-2xl font-bold mb-2 text-emerald-400">Premium SaaS</h3>
              <div className="text-4xl font-bold mb-6 text-white">$99 <span className="text-xl text-slate-400 font-normal">MXN / mes</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-emerald-100"><Check className="w-5 h-5 text-emerald-400" /> Todo lo del plan Básico</li>
                <li className="flex items-center gap-3 text-emerald-100"><Check className="w-5 h-5 text-emerald-400" /> Sincronización en la Nube</li>
                <li className="flex items-center gap-3 text-emerald-100"><Check className="w-5 h-5 text-emerald-400" /> Perfil de Usuario Único</li>
                <li className="flex items-center gap-3 text-emerald-100"><Check className="w-5 h-5 text-emerald-400" /> Acceso desde Web y Móvil</li>
              </ul>
              <div className="bg-slate-950/50 p-4 rounded-xl border border-emerald-500/20 mb-4">
                <p className="text-sm text-emerald-200 mb-2 font-medium">Contáctanos para obtener tu Token de acceso Premium:</p>
                <div className="flex flex-col gap-2">
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"><Mail className="w-4 h-4"/> {contactEmail}</a>
                  <a href={`https://wa.me/${contactPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"><MessageCircle className="w-4 h-4"/> WhatsApp: {contactPhone}</a>
                </div>
              </div>
              <Link to="/auth" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all text-center">
                Tengo un Token / Registrarme
              </Link>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div id="descargar" className="max-w-4xl mx-auto mt-32 mb-20 p-8 md:p-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] border border-slate-700/50 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full"></div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Lleva el control en tu bolsillo</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto relative z-10">Instala nuestra aplicación nativa para Android y registra tus gastos e ingresos al instante, incluso sin conexión a internet.</p>
          
          <a 
            href="/apk/app_de_gastos.apk"
            download="FINSINK_Gastos.apk"
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-2xl transition-all shadow-xl inline-flex items-center justify-center gap-3 relative z-10"
          >
            <Download className="w-6 h-6" />
            Descargar Instalador (.apk)
          </a>
          
          <div className="mt-8 text-sm text-slate-400 relative z-10 max-w-lg mx-auto bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 text-left space-y-3">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ¿Cómo instalar el archivo APK en tu celular?
            </h4>
            <ol className="list-decimal pl-4 space-y-2 text-slate-400">
              <li>Haz clic en el botón de arriba para descargar el archivo.</li>
              <li>Abre el archivo descargado desde tus notificaciones o la carpeta de Descargas.</li>
              <li>Si tu celular muestra un aviso de seguridad, dale clic en <strong>Configuración</strong> y activa <strong>"Permitir desde esta fuente"</strong> (u Orígenes Desconocidos).</li>
              <li>Vuelve atrás y haz clic en <strong>Instalar</strong>. ¡Listo!</li>
            </ol>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-slate-500 text-sm">
        <p>© 2026 FIN$INK SaaS. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
