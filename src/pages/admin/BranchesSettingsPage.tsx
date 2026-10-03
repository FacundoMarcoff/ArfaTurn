import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  MapPin,
  Calendar,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Sliders,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';

export const BranchesSettingsPage: React.FC = () => {
  const {
    currentOrg,
    currentBranch,
    branches,
    workingHours,
    switchBranch,
    createBranch,
  } = useTenant();

  const orgBranches = branches.filter((b) => b.organization_id === currentOrg.id);
  const maxBranches = currentOrg.account_config?.max_branches ?? 1;

  const [address, setAddress] = useState(currentBranch.address || '');
  const [phone, setPhone] = useState(currentBranch.phone || '');
  const [minAdvance, setMinAdvance] = useState(currentBranch.min_advance_minutes);
  const [maxAdvance, setMaxAdvance] = useState(currentBranch.max_advance_days);
  const [cancelWindow, setCancelWindow] = useState(currentBranch.cancel_window_hours);
  const [depositPct, setDepositPct] = useState(currentBranch.deposit_required_pct);
  const [savedAlert, setSavedAlert] = useState(false);

  // New branch modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Keep local fields in sync when currentBranch switches
  React.useEffect(() => {
    setAddress(currentBranch.address || '');
    setPhone(currentBranch.phone || '');
    setMinAdvance(currentBranch.min_advance_minutes);
    setMaxAdvance(currentBranch.max_advance_days);
    setCancelWindow(currentBranch.cancel_window_hours);
    setDepositPct(currentBranch.deposit_required_pct);
  }, [currentBranch]);

  const daysLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const branchHours = workingHours.filter((wh) => wh.branch_id === currentBranch.id && !wh.professional_id);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleCreateBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newBranchName.trim()) {
      setModalError('El nombre es obligatorio');
      return;
    }

    const res = createBranch({
      name: newBranchName,
      address: newBranchAddress,
      phone: newBranchPhone,
    });

    if (!res.success) {
      setModalError(res.message || 'Error al crear la sucursal');
    } else {
      setShowAddModal(false);
      setNewBranchName('');
      setNewBranchAddress('');
      setNewBranchPhone('');
      if (res.branch) {
        switchBranch(res.branch.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#201D1B] p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#5E836F] dark:text-[#A7C8B5] text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Gestión de Sedes & Sucursales</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight mt-0.5">
            Sucursales & Políticas de Turnos
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Configuración de horarios de apertura, descansos y reglas de cancelación para {currentBranch.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/accounts"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D8] dark:border-[#352F2B] bg-[#FAF7F2] dark:bg-[#2A2624] text-stone-700 dark:text-stone-200 font-semibold text-xs hover:bg-[#F2ECE4] transition"
          >
            <Sliders className="w-3.5 h-3.5 text-[#5E836F]" />
            <span>Límite de Sucursales</span>
          </Link>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Quota Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#201D1B] border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EBF2EE] dark:bg-[#26382E] text-[#5E836F] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <span>Sucursales de la cuenta: {orgBranches.length} de {maxBranches >= 99 ? 'Ilimitadas' : `${maxBranches} permitida(s)`}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#252220] border border-[#E8E2D8] dark:border-[#352F2B] text-stone-600 dark:text-stone-300">
                {maxBranches === 1 ? 'Plan 1 Sucursal' : maxBranches === 2 ? 'Plan 2 Sucursales' : 'Plan Multi-Sede'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              {maxBranches === 1
                ? 'Esta cuenta está limitada por administración a 1 sola sucursal activa.'
                : maxBranches === 2
                ? 'Esta cuenta puede operar con hasta 2 sucursales simultáneas.'
                : 'Esta cuenta tiene habilitada la administración multi-sede.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {orgBranches.length < maxBranches ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar 2da Sucursal</span>
            </button>
          ) : (
            <span className="text-[11px] text-stone-400">
              Cupo máximo cubierto
            </span>
          )}
        </div>
      </div>

      {/* Branch Tabs if multiple branches */}
      {orgBranches.length > 1 && (
        <div className="flex items-center gap-2 border-b border-[#E8E2D8] dark:border-[#2D2825] pb-2 overflow-x-auto">
          {orgBranches.map((b) => {
            const isSelected = b.id === currentBranch.id;
            return (
              <button
                key={b.id}
                onClick={() => switchBranch(b.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#5E836F] text-white shadow-xs'
                    : 'bg-white dark:bg-[#201D1B] border border-[#E8E2D8] dark:border-[#2D2825] text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{b.name}</span>
                {!b.is_active && <span className="text-[10px] opacity-75">(Pausada)</span>}
              </button>
            );
          })}
        </div>
      )}

      {savedAlert && (
        <div className="p-4 rounded-xl bg-[#EBF2EE] dark:bg-[#203026] border border-[#D5E3DB] dark:border-[#2E4738] text-[#2F4F3E] dark:text-[#A1CEB5] text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>Políticas y horarios de sucursal actualizados exitosamente.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Branch Info & Booking Policies (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">Datos de Ubicación</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Teléfono / WhatsApp de Sucursal
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Zona Horaria
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentBranch.timezone}
                    className="w-full bg-[#F2ECE4] dark:bg-[#282421] rounded-xl px-3 py-2 text-stone-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Moneda
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentBranch.currency}
                    className="w-full bg-[#F2ECE4] dark:bg-[#282421] rounded-xl px-3 py-2 text-stone-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-stone-900 dark:text-white">Políticas del Turnero</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Anticipación Mínima para Reservar (minutos)
                </label>
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={minAdvance}
                  onChange={(e) => setMinAdvance(Number(e.target.value))}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">Ej. 60 minutos antes para evitar reservas instantáneas.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Ventana de Cancelación Gratuita (horas)
                </label>
                <input
                  type="number"
                  min={1}
                  value={cancelWindow}
                  onChange={(e) => setCancelWindow(Number(e.target.value))}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  El cliente solo puede cancelar sin penalidad hasta {cancelWindow} horas antes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Porcentaje de Seña Obligatoria (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={depositPct}
                  onChange={(e) => setDepositPct(Number(e.target.value))}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Operating Hours by Day (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] dark:border-[#2D2825]">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">Horarios Semanales</h3>
              <p className="text-xs text-stone-400">Días y franjas de atención al público</p>
            </div>
            <Clock className="w-5 h-5 text-[#5E836F]" />
          </div>

          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
              const wh = branchHours.find((h) => h.day_of_week === dayIdx);
              const isEnabled = Boolean(wh?.is_enabled);

              return (
                <div
                  key={dayIdx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                    isEnabled
                      ? 'bg-[#FAF7F2] dark:bg-[#1A1817] border-[#E8E2D8] dark:border-[#2D2825]'
                      : 'bg-[#F2ECE4]/50 dark:bg-[#201D1B]/40 border-[#E8E2D8] dark:border-[#2D2825] opacity-60'
                  }`}
                >
                  <div className="w-24 font-bold text-stone-800 dark:text-stone-200">
                    {daysLabels[dayIdx]}
                  </div>

                  {isEnabled && wh ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-stone-900 dark:text-white font-semibold">
                        {wh.open_time} - {wh.close_time}
                      </span>
                      {wh.break_start && wh.break_end && (
                        <span className="text-[10px] text-stone-400">
                          (Pausa: {wh.break_start} a {wh.break_end})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-stone-400 italic">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: AGREGAR SUCURSAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#5E836F]" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  Dar de Alta Nueva Sucursal
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateBranchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre de la Sucursal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sede Belgrano / Sucursal Norte"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Ej: Av. Cabildo 1500"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="+54 11..."
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#2D2825] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#E8E2D8] text-stone-600 hover:bg-[#FAF7F2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold shadow-xs"
                >
                  Guardar Sucursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
