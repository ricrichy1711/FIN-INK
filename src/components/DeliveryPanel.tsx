import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { DeliveryOrder, ShiftSummary } from '@/types';

const STORAGE_KEY = 'gastosapp_deliveries';
const STORAGE_BUTTONS_KEY = 'gastosapp_delivery_buttons';
const STORAGE_VEHICLE_KEY = 'gastosapp_delivery_vehicle';

function loadDeliveries(): DeliveryOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveDeliveries(orders: DeliveryOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function loadCustomButtons(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_BUTTONS_KEY);
    return raw ? JSON.parse(raw) : [50, 80, 100, 150, 200, 250, 300, 500];
  } catch {
    return [50, 80, 100, 150, 200, 250, 300, 500];
  }
}
function saveCustomButtons(buttons: number[]) {
  localStorage.setItem(STORAGE_BUTTONS_KEY, JSON.stringify(buttons));
}

function loadVehicle(): string {
  try { return localStorage.getItem(STORAGE_VEHICLE_KEY) || '🛵'; } catch { return '🛵'; }
}
function saveVehicle(v: string) {
  localStorage.setItem(STORAGE_VEHICLE_KEY, v);
}

interface DeliveryPanelProps {
  onSyncToTransactions: (orders: DeliveryOrder[]) => void;
}

const VEHICLE_OPTIONS = [
  { id: '🛵', label: 'Moto' },
  { id: '🚴', label: 'Bici' },
  { id: '🚗', label: 'Auto' },
  { id: '🛺', label: 'Triciclo' },
  { id: '🚚', label: 'Camión' },
];

export default function DeliveryPanel({ onSyncToTransactions }: DeliveryPanelProps) {
  const [orders, setOrders] = useState<DeliveryOrder[]>(loadDeliveries);
  const [note, setNote] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'got' | 'error'>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [customButtons, setCustomButtons] = useState<number[]>(loadCustomButtons);
  const [showManageButtons, setShowManageButtons] = useState(false);
  const [newButtonValue, setNewButtonValue] = useState('');
  const [vehicle, setVehicle] = useState<string>(loadVehicle);
  const [toast, setToast] = useState<string | null>(null);
  // expanded no longer needed
  const watchIdRef = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => { saveCustomButtons(customButtons); }, [customButtons]);
  useEffect(() => { saveVehicle(vehicle); }, [vehicle]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const addOrder = useCallback((order: Omit<DeliveryOrder, 'id' | 'syncedToTransactions'>) => {
    const newOrder: DeliveryOrder = { ...order, id: crypto.randomUUID(), syncedToTransactions: false };
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      saveDeliveries(updated);
      return updated;
    });
  }, []);

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      showToast('📵 Tu dispositivo no tiene GPS');
      return;
    }
    setGpsStatus('getting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) });
        setGpsStatus('got');
        showToast('📍 Ubicación capturada');
      },
      (err) => {
        setGpsStatus('error');
        setGpsCoords(null);
        if (err.code === 1) showToast('🔒 Activa el permiso de ubicación');
        else if (err.code === 3) showToast('⏱️ GPS tardó demasiado, intenta de nuevo');
        else showToast('❌ No se pudo obtener ubicación');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, [showToast]);

  const registerOrder = useCallback((orderAmount: number) => {
    const d = new Date();
    const newOrder: DeliveryOrder = {
      id: crypto.randomUUID(),
      amount: orderAmount,
      description: note.trim() || `Pedido ${(todayOrders.length + 1).toString().padStart(2, '0')}`,
      timestamp: d.toISOString(),
      date: d.toISOString().slice(0, 10),
      time: d.toISOString().slice(11, 16),
      location: gpsCoords ? { ...gpsCoords } : undefined,
      syncedToTransactions: false,
    };
    addOrder(newOrder);
    setManualAmount('');
    setNote('');
    setGpsCoords(null);
    setGpsStatus('idle');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // Haptic feedback if supported
    if (navigator.vibrate) navigator.vibrate(40);
    showToast(`✅ Pedido +$${orderAmount} registrado`);
  }, [gpsCoords, note, addOrder, showToast]);

  const handleQuickAdd = useCallback((amount: number) => {
    registerOrder(amount);
  }, [registerOrder]);

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualAmount);
    if (!val || val <= 0) {
      showToast('⚠️ Ingresa un monto válido');
      return;
    }
    registerOrder(val);
  }, [manualAmount, registerOrder, showToast]);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      saveDeliveries(updated);
      return updated;
    });
    showToast('🗑️ Pedido eliminado');
  }, [showToast]);

  const bulkDelete = useCallback(() => {
    setOrders((prev) => {
      const updated = prev.filter((o) => !confirmIds.includes(o.id));
      saveDeliveries(updated);
      return updated;
    });
    setShowConfirm(false);
    setConfirmIds([]);
    showToast(`🗑️ ${confirmIds.length} pedido(s) eliminados`);
  }, [confirmIds, showToast]);

  const syncOrders = useCallback((ordersToSync: DeliveryOrder[]) => {
    const toSync = ordersToSync.filter((o) => !o.syncedToTransactions);
    if (toSync.length === 0) {
      showToast('ℹ️ Sin pedidos pendientes');
      return;
    }
    onSyncToTransactions(toSync);
    setOrders((prev) => {
      const updated = prev.map((o) => ({ ...o, syncedToTransactions: true }));
      saveDeliveries(updated);
      return updated;
    });
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    showToast(`💰 ${toSync.length} pedido(s) sumados a Ingresos`);
  }, [onSyncToTransactions, showToast]);

  const addCustomButton = useCallback(() => {
    const val = parseFloat(newButtonValue);
    if (!val || val <= 0) {
      showToast('⚠️ Monto no válido');
      return;
    }
    if (customButtons.includes(val)) {
      showToast('⚠️ Ese botón ya existe');
      return;
    }
    if (customButtons.length >= 12) {
      showToast('⚠️ Máximo 12 botones');
      return;
    }
    setCustomButtons((prev) => [...prev, val].sort((a, b) => a - b));
    setNewButtonValue('');
  }, [newButtonValue, customButtons, showToast]);

  const removeCustomButton = useCallback((val: number) => {
    setCustomButtons((prev) => prev.filter((v) => v !== val));
  }, []);

  // Shift summaries
  const shiftSummaries = useMemo((): ShiftSummary[] => {
    const map: Record<string, DeliveryOrder[]> = {};
    for (const o of orders) {
      if (!map[o.date]) map[o.date] = [];
      map[o.date].push(o);
    }
    return Object.entries(map)
      .map(([date, os]) => {
        const total = os.reduce((s, o) => s + o.amount, 0);
        return {
          date,
          orders: os.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
          totalEarnings: total,
          orderCount: os.length,
          averagePerOrder: os.length > 0 ? total / os.length : 0,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [orders]);

  const todayOrders = useMemo(
    () => orders.filter((o) => o.date === today && !o.syncedToTransactions),
    [orders, today]
  );
  const todayTotal = useMemo(
    () => todayOrders.reduce((s, o) => s + o.amount, 0),
    [todayOrders]
  );

  const selectedSummary = shiftSummaries.find((s) => s.date === selectedDate);
  const selectedOrders = useMemo(
    () => orders.filter((o) => o.date === selectedDate).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [orders, selectedDate]
  );

  // Month stats for header
  const monthStats = useMemo(() => {
    const monthKey = today.slice(0, 7);
    const monthTxs = orders.filter((o) => o.date.startsWith(monthKey));
    const total = monthTxs.reduce((s, o) => s + o.amount, 0);
    const days = new Set(monthTxs.map((o) => o.date)).size;
    return { total, count: monthTxs.length, days };
  }, [orders, today]);

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  const formatDuration = (ts: string) => {
    const created = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(created / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };
  const locationLabel = (loc?: { lat: number; lng: number }) => {
    if (!loc) return '';
    return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
  };
  const openMaps = (loc?: { lat: number; lng: number }) => {
    if (!loc) return;
    window.open(`https://www.google.com/maps?q=${loc.lat},${loc.lng}`, '_blank');
  };

  // Current shift performance (used in history view)

  return (
    <div className="space-y-3 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 rounded-2xl p-4 border border-orange-700/30">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-orange-200">{vehicle} Repartidor</h2>
          <button
            onClick={() => {
              const idx = VEHICLE_OPTIONS.findIndex((v) => v.id === vehicle);
              const next = VEHICLE_OPTIONS[(idx + 1) % VEHICLE_OPTIONS.length];
              setVehicle(next.id);
              showToast(`Vehículo: ${next.label}`);
            }}
            className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg text-slate-300 transition-all"
          >
            Cambiar
          </button>
        </div>

        {/* Date & Day */}
        <div className="flex items-center gap-2 mt-2 mb-3 bg-white/5 rounded-xl px-3 py-2">
          <span className="text-base">📅</span>
          <div>
            <p className="text-xs font-semibold text-slate-200 capitalize leading-tight">
              {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              {now.toLocaleDateString('es-ES', { year: 'numeric' })} · Turno activo
            </p>
          </div>
        </div>

        {/* Today stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-500/10 rounded-xl p-2 text-center border border-emerald-500/20">
            <p className="text-[9px] text-emerald-500/60 uppercase tracking-wider">Hoy</p>
            <p className="text-base font-bold text-emerald-400">${todayTotal.toLocaleString()}</p>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-2 text-center border border-blue-500/20">
            <p className="text-[9px] text-blue-500/60 uppercase tracking-wider">Pedidos</p>
            <p className="text-base font-bold text-blue-400">{todayOrders.length}</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-2 text-center border border-amber-500/20">
            <p className="text-[9px] text-amber-500/60 uppercase tracking-wider">Promedio</p>
            <p className="text-base font-bold text-amber-400">
              ${todayOrders.length > 0 ? (todayTotal / todayOrders.length).toFixed(0) : '0'}
            </p>
          </div>
        </div>

        {/* Monthly indicator */}
        {monthStats.count > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-orange-700/20 text-center">
            <p className="text-[10px] text-slate-500">
              Este mes: <span className="text-emerald-400 font-semibold">${monthStats.total.toLocaleString()}</span> en {monthStats.count} pedidos
            </p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/30">
        {[
          { id: 'active' as const, label: `📝 Activo (${todayOrders.length})` },
          { id: 'history' as const, label: '📋 Historial' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === mode.id
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* ===== ACTIVE SHIFT ===== */}
      {viewMode === 'active' && (
        <div className="space-y-3">
          {/* Quick Add Buttons */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-200">💨 Registrar Pedido</h3>
              <button
                onClick={() => setShowManageButtons(!showManageButtons)}
                className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg hover:bg-orange-500/20 transition-all"
              >
                {showManageButtons ? '✓ Listo' : '✏️ Editar'}
              </button>
            </div>

            {/* GPS */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={requestGPS}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all flex-1 ${
                  gpsStatus === 'got'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : gpsStatus === 'getting'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : gpsStatus === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-slate-700/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span>📍</span>
                <span className="truncate">
                  {gpsStatus === 'got'
                    ? `${gpsCoords?.lat.toFixed(4)}, ${gpsCoords?.lng.toFixed(4)}`
                    : gpsStatus === 'getting'
                    ? 'Obteniendo GPS...'
                    : gpsStatus === 'error'
                    ? 'Reintentar GPS'
                    : 'Activar GPS'}
                </span>
              </button>
              {gpsCoords && (
                <button
                  onClick={() => openMaps(gpsCoords)}
                  className="px-2 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs"
                  title="Ver en mapa"
                >
                  🗺️
                </button>
              )}
            </div>

            {/* Manage Buttons */}
            {showManageButtons && (
              <div className="mb-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <p className="text-[11px] text-slate-300 mb-2 font-medium">⚙️ Personaliza tus montos rápidos</p>
                <div className="flex gap-2 mb-2.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={newButtonValue}
                      onChange={(e) => setNewButtonValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomButton(); } }}
                      placeholder="Ej: 175"
                      className="w-full bg-slate-800 border border-slate-700/50 rounded-xl py-2 pl-6 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                  <button
                    onClick={addCustomButton}
                    className="px-3 py-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-semibold hover:bg-orange-500/30 transition-all"
                  >
                    + Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {customButtons.map((val) => (
                    <div
                      key={val}
                      className="flex items-center gap-1 bg-slate-800 rounded-lg pl-2.5 pr-1 py-1"
                    >
                      <span className="text-xs text-slate-300 font-medium">${val}</span>
                      <button
                        onClick={() => removeCustomButton(val)}
                        className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 text-[10px] hover:bg-red-500/40 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {customButtons.length === 0 && (
                  <p className="text-[10px] text-red-400/70 mt-2">⚠️ Agrega al menos un botón para registrar pedidos rápidos</p>
                )}
              </div>
            )}

            {/* Quick Buttons */}
            {customButtons.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {customButtons.map((val) => (
                  <button
                    key={val}
                    onClick={() => handleQuickAdd(val)}
                    className="py-3.5 rounded-xl text-sm font-bold transition-all active:scale-90 bg-gradient-to-br from-slate-700/60 to-slate-800/60 border border-slate-600/40 text-slate-100 hover:from-orange-500/30 hover:to-red-500/30 hover:border-orange-500/50 hover:text-orange-100"
                  >
                    ${val}
                  </button>
                ))}
              </div>
            )}

            {/* Manual Amount */}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="Monto exacto"
                  className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl py-3 pl-7 pr-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-base font-bold active:scale-95 transition-all shadow-lg shadow-orange-500/20"
              >
                + Agregar
              </button>
            </form>

            {/* Note */}
            <div className="mt-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="📝 Nota (ej: Pedido Rappi, Zona Centro...)"
                className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>

          {/* Today's Orders */}
          {todayOrders.length > 0 && (
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-200">
                  📋 Pedidos de hoy ({todayOrders.length})
                </h3>
                <span className="text-xs text-emerald-400 font-bold">
                  ${todayTotal.toLocaleString()}
                </span>
              </div>
              <div className="space-y-1.5">
                {todayOrders.map((order, idx) => (
                  <PedidoItem
                    key={order.id}
                    order={order}
                    index={todayOrders.length - idx}
                    onDelete={deleteOrder}
                    onOpenMap={() => order.location && openMaps(order.location)}
                    formatTime={formatTime}
                    formatDuration={formatDuration}
                    locationLabel={locationLabel}
                  />
                ))}
              </div>
            </div>
          )}

          {todayOrders.length === 0 && (
            <div className="text-center py-10 bg-slate-800/20 rounded-2xl border border-slate-700/20">
              <p className="text-5xl mb-2">{vehicle}</p>
              <p className="text-slate-400 text-sm font-medium">Aún sin pedidos hoy</p>
              <p className="text-slate-600 text-xs mt-1">Tocá un botón arriba para registrar el primero</p>
            </div>
          )}
        </div>
      )}

      {/* ===== HISTORY ===== */}
      {viewMode === 'history' && (
        <div className="space-y-3">
          {/* Date selector */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 bg-slate-800/70 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500/50 [color-scheme:dark]"
            />
            <button
              onClick={() => setSelectedDate(today)}
              className="px-3 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-medium hover:bg-orange-500/25 transition-all"
            >
              Hoy
            </button>
          </div>

          {/* Date Summary */}
          {selectedSummary && (
            <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-4 border border-orange-700/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-orange-200 capitalize">
                  📅 {new Date(selectedSummary.date + 'T12:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </h3>
                {selectedSummary.orders.some((o) => !o.syncedToTransactions) && (
                  <button
                    onClick={() => syncOrders(selectedSummary.orders.filter(o => !o.syncedToTransactions))}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/25 transition-all"
                  >
                    ✅ Cerrar turno
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-emerald-500/5 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-emerald-500/60 uppercase">Total</p>
                  <p className="text-base font-bold text-emerald-400">${selectedSummary.totalEarnings.toLocaleString()}</p>
                </div>
                <div className="bg-blue-500/5 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-blue-500/60 uppercase">Pedidos</p>
                  <p className="text-base font-bold text-blue-400">{selectedSummary.orderCount}</p>
                </div>
                <div className="bg-purple-500/5 rounded-xl p-2 text-center">
                  <p className="text-[9px] text-purple-500/60 uppercase">Promedio</p>
                  <p className="text-base font-bold text-purple-400">${selectedSummary.averagePerOrder.toFixed(0)}</p>
                </div>
              </div>
              
              {/* Stats del día */}
              {selectedSummary.orders.length > 0 && (() => {
                const firstOrder = selectedSummary.orders[selectedSummary.orders.length - 1];
                const lastOrder = selectedSummary.orders[0];
                const hours = (new Date(lastOrder.timestamp).getTime() - new Date(firstOrder.timestamp).getTime()) / 3600000;
                const earningsPerHour = hours > 0 ? selectedSummary.totalEarnings / hours : 0;
                const hourMap: Record<number, number> = {};
                for (const o of selectedSummary.orders) {
                  const h = parseInt(o.time.split(':')[0]);
                  hourMap[h] = (hourMap[h] || 0) + o.amount;
                }
                const bestHour = Object.keys(hourMap).length > 0 ? Math.max(...Object.values(hourMap)) : 0;
                return (
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-orange-700/20">
                    <div className="bg-slate-800/40 rounded-lg p-1.5 text-center">
                      <p className="text-[8px] text-slate-500 uppercase">$/Hora</p>
                      <p className="text-xs font-semibold text-orange-300">${earningsPerHour.toFixed(0)}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-1.5 text-center">
                      <p className="text-[8px] text-slate-500 uppercase">Horas</p>
                      <p className="text-xs font-semibold text-slate-300">{hours.toFixed(1)}h</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-1.5 text-center">
                      <p className="text-[8px] text-slate-500 uppercase">Mejor Hora</p>
                      <p className="text-xs font-semibold text-yellow-300">${bestHour}</p>
                    </div>
                  </div>
                );
              })()}
              {selectedSummary.orders.every((o) => o.syncedToTransactions) && (
                <div className="mt-2 py-1.5 text-center bg-emerald-500/10 rounded-lg">
                  <p className="text-[10px] text-emerald-400 font-medium">✅ Turno cerrado, sumado a Ingresos</p>
                </div>
              )}
            </div>
          )}

          {/* Orders for selected date */}
          {selectedOrders.length > 0 && (
            <div className="space-y-1.5">
              {selectedOrders.map((order, idx) => (
                <PedidoItem
                  key={order.id}
                  order={order}
                  index={selectedOrders.length - idx}
                  onDelete={deleteOrder}
                  onOpenMap={() => order.location && openMaps(order.location)}
                  formatTime={formatTime}
                  formatDuration={formatDuration}
                  locationLabel={locationLabel}
                />
              ))}
            </div>
          )}

          {selectedOrders.length === 0 && selectedSummary && (
            <div className="text-center py-8 bg-slate-800/20 rounded-2xl border border-slate-700/20">
              <p className="text-2xl mb-1">📋</p>
              <p className="text-slate-400 text-sm">Sin pedidos este día</p>
            </div>
          )}

          {/* Previous Days */}
          {shiftSummaries.filter(s => s.date !== selectedDate).length > 0 && (
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
              <h3 className="text-sm font-medium text-slate-200 mb-3">📅 Turnos anteriores</h3>
              <div className="space-y-1.5">
                {shiftSummaries
                  .filter(s => s.date !== selectedDate)
                  .slice(0, 20)
                  .map(s => {
                    const pending = s.orders.filter(o => !o.syncedToTransactions).length;
                    return (
                      <button
                        key={s.date}
                        onClick={() => setSelectedDate(s.date)}
                        className="w-full flex items-center justify-between bg-slate-800/60 rounded-xl px-3 py-2.5 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${pending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {pending > 0 ? '⏳' : '✅'}
                          </span>
                          <span className="text-sm text-slate-300 capitalize">
                            {new Date(s.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-[10px] text-slate-500">{s.orderCount}p</span>
                          {pending > 0 && (
                            <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                              {pending} pend.
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                          ${s.totalEarnings.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {shiftSummaries.length === 0 && (
            <div className="text-center py-10 bg-slate-800/20 rounded-2xl border border-slate-700/20">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-slate-400 text-sm">Sin turnos aún</p>
            </div>
          )}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-slate-800 rounded-2xl p-5 border border-red-700/40 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-red-200 mb-2">🗑️ ¿Eliminar?</h3>
            <p className="text-xs text-slate-400 mb-4">
              Se borrarán {confirmIds.length} pedido(s) permanentemente.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={bulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Sub-component: Pedido Item ---- */
function PedidoItem({
  order,
  index,
  onDelete,
  onOpenMap,
  formatTime,
  formatDuration,
  locationLabel,
}: {
  order: DeliveryOrder;
  index: number;
  onDelete: (id: string) => void;
  onOpenMap: () => void;
  formatTime: (t: string) => string;
  formatDuration: (ts: string) => string;
  locationLabel: (loc?: { lat: number; lng: number }) => string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${
      order.syncedToTransactions
        ? 'bg-slate-800/40 border-slate-700/20 opacity-70'
        : 'bg-slate-800/70 border-slate-700/30'
    }`}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-sm font-bold text-orange-400 shrink-0">
          #{index}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-200 truncate font-medium">{order.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] text-orange-400 font-semibold">🕐 {formatTime(order.time)}</span>
            <span className="text-[9px] text-slate-600">·</span>
            <span className="text-[9px] text-slate-500">{formatDuration(order.timestamp)}</span>
            {order.syncedToTransactions && (
              <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">✓ Ingreso</span>
            )}
          </div>
          {order.location && (
            <button
              onClick={onOpenMap}
              className="text-[9px] text-blue-400/80 hover:text-blue-400 mt-0.5 truncate block max-w-full"
            >
              📍 {locationLabel(order.location)} · ver mapa
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-sm font-bold text-emerald-400 tabular-nums">
          +${order.amount.toLocaleString()}
        </span>
        <button
          onClick={() => onDelete(order.id)}
          className="text-slate-600 hover:text-red-400 transition-colors p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
