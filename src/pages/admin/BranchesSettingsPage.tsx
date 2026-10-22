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
  ChevronDown,
  ShieldAlert,
  Coffee,
  Info
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
    updateBranch,
    updateWorkingHour,
  } = useTenant();

  const orgBranches = branches.filter((b) => b.organization_id === currentOrg.id);
  const maxBranches = currentOrg.account_config?.max_branches ?? 1;

  // Local state for editable branch properties
  const [branchName, setBranchName] = useState(currentBranch.name || '');
  const [address, setAddress] = useState(currentBranch.address || '');
  const [phone, setPhone] = useState(currentBranch.phone || '');
  const [timezone, setTimezone] = useState(currentBranch.timezone || 'America/Argentina/Buenos_Aires (GMT-3)');
  const [currency, setCurrency] = useState(currentBranch.currency || 'ARS ($)');
  const [minAdvance, setMinAdvance] = useState(currentBranch.min_advance_minutes || 60);
  const [cancelWindow, setCancelWindow] = useState(currentBranch.cancel_window_hours || 12);
  const [depositPct, setDepositPct] = useState(currentBranch.deposit_required_pct || 0);
  const [savedAlert, setSavedAlert] = useState(false);
  const [showSpecialDates, setShowSpecialDates] = useState(false);

  // New branch modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Keep local fields in sync when currentBranch switches
  React.useEffect(() => {
    setBranchName(currentBranch.name || '');
    setAddress(currentBranch.address || '');
    setPhone(currentBranch.phone || '');
    setTimezone(currentBranch.timezone || 'America/Argentina/Buenos_Aires (GMT-3)');
    setCurrency(currentBranch.currency || 'ARS ($)');
    setMinAdvance(currentBranch.min_advance_minutes || 60);
    setCancelWindow(currentBranch.cancel_window_hours || 12);
    setDepositPct(currentBranch.deposit_required_pct || 0);
  }, [currentBranch]);

  const daysLabels: { [key: number]: string } = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    0: 'Domingo',
  };

  const branchHours = workingHours.filter((wh) => wh.branch_id === currentBranch.id && !wh.professional_id);

  // Local state for hours to allow instant toggle / edit
  const [localHours, setLocalHours] = useState<{ [day: number]: { enabled: boolean; open: string; close: string; breakStart?: string; breakEnd?: string } }>({
    1: { enabled: true, open: '09:00', close: '20:00' },
    2: { enabled: true, open: '09:00', close: '20:00' },
    3: { enabled: true, open: '09:00', close: '20:00' },
    4: { enabled: true, open: '09:00', close: '20:00' },
    5: { enabled: true, open: '09:00', close: '20:00' },
    6: { enabled: true, open: '09:00', close: '18:00' },
    0: { enabled: false, open: '10:00', close: '14:00' },
  });

  React.useEffect(() => {
    if (branchHours.length > 0) {
      const mapped: { [day: number]: { enabled: boolean; open: string; close: string; breakStart?: string; breakEnd?: string } } = {};
      [1, 2, 3, 4, 5, 6, 0].forEach((day) => {
        const found = branchHours.find((h) => h.day_of_week === day);
        if (found) {
          mapped[day] = {
            enabled: Boolean(found.is_enabled),
            open: found.open_time || '09:00',
            close: found.close_time || '20:00',
            breakStart: found.break_start,
            breakEnd: found.break_end,
          };
        } else {
          mapped[day] = {
            enabled: day !== 0,
            open: '09:00',
            close: day === 6 ? '18:00' : '20:00',
          };
        }
      });
      setLocalHours(mapped);
    }
  }, [currentBranch.id, workingHours]);

  const toggleDay = (day: number) => {
    setLocalHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day]?.enabled,
      },
    }));
  };

  const updateDayTime = (day: number, field: 'open' | 'close', value: string) => {
    setLocalHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (updateBranch) {
      updateBranch(currentBranch.id, {
        name: branchName,
        address,
        phone,
        min_advance_minutes: minAdvance,
        cancel_window_hours: cancelWindow,
        deposit_required_pct: depositPct,
      });
    }

    if (updateWorkingHour) {
      [1, 2, 3, 4, 5, 6, 0].forEach((day) => {
        const wh = branchHours.find((h) => h.day_of_week === day);
        const dayConfig = localHours[day];
        if (wh && dayConfig) {
          updateWorkingHour(wh.id, {
            is_enabled: dayConfig.enabled,
            open_time: dayConfig.open,
            close_time: dayConfig.close,
          });
        }
      });
    }

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
      {/* Top Header matching Desktop Mockup Screen 07 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
                Local y horarios
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF2EE] dark:bg-[#1C2C23] text-[#2F4F3E] dark:text-[#A1CEB5] border border-[#D5E3DB] dark:border-[#2A4736]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5E836F] dark:bg-[#A1CEB5]" />
                {orgBranches.length} {orgBranches.length === 1 ? 'sucursal activa' : 'sucursales activas'}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Configuración de datos del negocio, horarios semanales y reglas para el turnero web.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {orgBranches.length < maxBranches && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D8] dark:border-[#352F2B] bg-[#FAF7F2] dark:bg-[#2A2624] text-stone-700 dark:text-stone-200 font-semibold text-xs hover:bg-[#F2ECE4] transition"
            >
              <Plus className="w-3.5 h-3.5 text-[#5E836F]" />
              <span>Nueva Sucursal</span>
            </button>
          )}

          <button
            onClick={() => handleSave()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Guardar cambios</span>
          </button>
        </div>
      </div>

      {/* Multi-Branch Selector if org has more than 1 branch */}
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

      {/* Notification Toast */}
      {savedAlert && (
        <div className="p-3.5 rounded-xl bg-[#EBF2EE] dark:bg-[#203026] border border-[#D5E3DB] dark:border-[#2E4738] text-[#2F4F3E] dark:text-[#A1CEB5] text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Configuración del local, horarios y políticas guardadas correctamente.</span>
        </div>
      )}

      {/* 3-Card Grid Matching Screen 07 Desktop Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CARD 1: DATOS DEL LOCAL */}
        <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-5 space-y-4">
          <div className="border-b border-[#E8E2D8] dark:border-[#2D2825] pb-3">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#5E836F]" />
              Datos del local
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Información visible para los clientes en el turnero y comprobantes.
            </p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nombre de la sucursal
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Ej. Casa Central"
                className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Gurruchaga 1824, Palermo"
                className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. +54 9 11 4567-8900"
                className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Zona horaria
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
              >
                <option value="America/Argentina/Buenos_Aires (GMT-3)">America/Argentina/Buenos_Aires (GMT-3)</option>
                <option value="America/Santiago (GMT-4)">America/Santiago (GMT-4)</option>
                <option value="America/Montevideo (GMT-3)">America/Montevideo (GMT-3)</option>
                <option value="America/Sao_Paulo (GMT-3)">America/Sao_Paulo (GMT-3)</option>
                <option value="America/Bogota (GMT-5)">America/Bogota (GMT-5)</option>
                <option value="America/Mexico_City (GMT-6)">America/Mexico_City (GMT-6)</option>
                <option value="Europe/Madrid (GMT+1)">Europe/Madrid (GMT+1)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
              >
                <option value="ARS ($)">ARS ($) - Peso argentino</option>
                <option value="USD ($)">USD ($) - Dólar estadounidense</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="CLP ($)">CLP ($) - Peso chileno</option>
                <option value="UYU ($)">UYU ($) - Peso uruguayo</option>
                <option value="COP ($)">COP ($) - Peso colombiano</option>
                <option value="MXN ($)">MXN ($) - Peso mexicano</option>
              </select>
            </div>
          </div>
        </div>

        {/* CARD 2: HORARIO SEMANAL */}
        <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-5 space-y-4">
          <div className="border-b border-[#E8E2D8] dark:border-[#2D2825] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5E836F]" />
                Horario semanal
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Días y franjas de apertura general del local.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
              const dayConfig = localHours[dayIdx] || { enabled: false, open: '09:00', close: '20:00' };

              return (
                <div
                  key={dayIdx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                    dayConfig.enabled
                      ? 'bg-[#FAF7F2] dark:bg-[#1A1817] border-[#E8E2D8] dark:border-[#2D2825]'
                      : 'bg-stone-50/50 dark:bg-stone-900/30 border-dashed border-[#E8E2D8] dark:border-[#2D2825] opacity-65'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-[90px]">
                    {/* Toggle switch */}
                    <button
                      type="button"
                      onClick={() => toggleDay(dayIdx)}
                      className={`w-8 h-4.5 rounded-full transition-colors relative focus:outline-hidden ${
                        dayConfig.enabled ? 'bg-[#5E836F]' : 'bg-stone-300 dark:bg-stone-700'
                      }`}
                    >
                      <span
                        className={`block w-3.5 h-3.5 rounded-full bg-white shadow-xs transform transition-transform ${
                          dayConfig.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {daysLabels[dayIdx]}
                    </span>
                  </div>

                  {dayConfig.enabled ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <input
                        type="time"
                        value={dayConfig.open}
                        onChange={(e) => updateDayTime(dayIdx, 'open', e.target.value)}
                        className="bg-white dark:bg-[#201D1B] border border-[#E4DDD2] dark:border-[#352F2B] rounded-lg px-2 py-1 text-xs text-stone-900 dark:text-white font-mono"
                      />
                      <span className="text-stone-400 text-[11px]">-</span>
                      <input
                        type="time"
                        value={dayConfig.close}
                        onChange={(e) => updateDayTime(dayIdx, 'close', e.target.value)}
                        className="bg-white dark:bg-[#201D1B] border border-[#E4DDD2] dark:border-[#352F2B] rounded-lg px-2 py-1 text-xs text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-stone-400 italic pr-2">
                      Cerrado
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="w-full py-2 px-3 border border-dashed border-[#E8E2D8] dark:border-[#352F2B] rounded-xl text-stone-600 dark:text-stone-300 text-xs font-semibold hover:bg-[#FAF7F2] dark:hover:bg-[#2A2624] flex items-center justify-center gap-1.5 transition"
          >
            <Coffee className="w-3.5 h-3.5 text-[#5E836F]" />
            <span>+ Agregar descanso / pausa diaria</span>
          </button>
        </div>

        {/* CARD 3: POLÍTICAS DE RESERVA */}
        <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-5 space-y-4">
          <div className="border-b border-[#E8E2D8] dark:border-[#2D2825] pb-3">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#5E836F]" />
              Políticas de reserva
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Reglas aplicadas al turnero público de clientes.
            </p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Anticipación mínima
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={minAdvance}
                  onChange={(e) => setMinAdvance(Number(e.target.value))}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F] pr-12"
                />
                <span className="absolute right-3 top-2 text-[11px] text-stone-400">min</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                El cliente debe reservar con al menos {minAdvance} min de antelación.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Cancelación gratuita
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={cancelWindow}
                  onChange={(e) => setCancelWindow(Number(e.target.value))}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F] pr-12"
                />
                <span className="absolute right-3 top-2 text-[11px] text-stone-400">hs</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Hasta cuántas horas antes puede cancelar el cliente sin costo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Seña obligatoria (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={depositPct}
                  onChange={(e) => setDepositPct(Number(e.target.value))}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F] pr-8"
                />
                <span className="absolute right-3 top-2 text-[11px] text-stone-400">%</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                {depositPct === 0 ? '0% = No se requiere seña previa para confirmar.' : `Se solicitará el ${depositPct}% por adelantado para confirmar el turno.`}
              </p>
            </div>

            {/* Special Dates Accordion */}
            <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825]">
              <button
                type="button"
                onClick={() => setShowSpecialDates(!showSpecialDates)}
                className="w-full flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 py-1.5 hover:text-[#5E836F] transition"
              >
                <span>Fechas especiales y feriados</span>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showSpecialDates ? 'rotate-180' : ''}`} />
              </button>

              {showSpecialDates && (
                <div className="mt-2 space-y-2 text-[11px] animate-in fade-in">
                  <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E8E2D8] dark:border-[#2D2825] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-stone-800 dark:text-stone-200">25 de Mayo</div>
                      <div className="text-stone-400 text-[10px]">Día de la Revolución de Mayo</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      Cerrado
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E8E2D8] dark:border-[#2D2825] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-stone-800 dark:text-stone-200">9 de Julio</div>
                      <div className="text-stone-400 text-[10px]">Día de la Independencia</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      Cerrado
                    </span>
                  </div>

                  <button
                    type="button"
                    className="w-full py-1.5 rounded-lg border border-[#E8E2D8] dark:border-[#352F2B] text-stone-600 dark:text-stone-400 hover:bg-[#FAF7F2] dark:hover:bg-[#2A2624] text-[11px] font-medium"
                  >
                    + Agregar fecha especial
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: ALTA NUEVA SUCURSAL */}
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
