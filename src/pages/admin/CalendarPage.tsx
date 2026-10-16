import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Filter,
  CheckCircle,
  PlayCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CalendarDays,
  List,
  Sparkles,
  ArrowRight,
  Shield,
  Scissors,
  ExternalLink,
  Globe,
  Copy,
  Check,
  Play,
  Timer,
  CheckCircle2,
  DollarSign,
  PlusCircle,
  MessageCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Phone,
  Minimize2,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { AppointmentStatus, Appointment, PaymentMethod } from '../../types/database.types';
import { RubroAccountBanner } from '../../components/common/RubroAccountBanner';
import { CustomerSearchSelect } from '../../components/common/CustomerSearchSelect';

export const CalendarPage: React.FC = () => {
  const {
    currentOrg,
    currentBranch,
    currentRole,
    professionals,
    services,
    customers,
    appointments,
    createAppointment,
    updateAppointmentStatus,
    rescheduleAppointment,
    cancelAppointment,
    createSale,
  } = useTenant();

  // Filters & Views
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('day');
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Modal states
  const [showNewModal, setShowNewModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [rescheduleDateStr, setRescheduleDateStr] = useState<string>('');
  const [rescheduleTimeStr, setRescheduleTimeStr] = useState<string>('10:00');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // New appointment form state
  const [selectedExistingCustId, setSelectedExistingCustId] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newServiceId, setNewServiceId] = useState(services[0]?.id || '');
  const [newProfId, setNewProfId] = useState(professionals[0]?.id || '');
  const [newTimeStr, setNewTimeStr] = useState('11:00');
  const [newNotes, setNewNotes] = useState('');

  // Professionals for this branch
  const branchProfessionals = professionals.filter(
    (p) => p.organization_id === currentOrg.id
  );

  // Helper to extract YYYY-MM-DD in local time (prevents UTC timezone shift)
  const getLocalDateKey = (d: Date | string): string => {
    const date = typeof d === 'string' ? new Date(d) : d;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = getLocalDateKey(selectedDate);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => {
        if (appt.organization_id !== currentOrg.id) return false;
        if (appt.branch_id !== currentBranch.id) return false;
        if (selectedProfFilter !== 'all' && appt.professional_id !== selectedProfFilter) return false;

        // Filter by current date in day view
        if (viewMode === 'day') {
          const apptDateStr = getLocalDateKey(appt.starts_at);
          return apptDateStr === selectedDateStr;
        }
        return true;
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [appointments, currentOrg.id, currentBranch.id, selectedProfFilter, viewMode, selectedDateStr]);

  const otherDateAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (appt.organization_id !== currentOrg.id) return false;
      if (appt.branch_id !== currentBranch.id) return false;
      if (selectedProfFilter !== 'all' && appt.professional_id !== selectedProfFilter) return false;
      const apptDateStr = getLocalDateKey(appt.starts_at);
      return apptDateStr !== selectedDateStr && appt.status !== 'cancelled';
    });
  }, [appointments, currentOrg.id, currentBranch.id, selectedProfFilter, selectedDateStr]);

  // Date Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Submit manual appointment
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    const fullStartDate = new Date(`${selectedDateStr}T${newTimeStr}:00`);

    const res = createAppointment({
      branchId: currentBranch.id,
      professionalId: newProfId,
      serviceId: newServiceId,
      startsAt: fullStartDate.toISOString(),
      customerName: newCustName,
      customerPhone: newCustPhone,
      customerNotes: newNotes,
    });

    if (res.success) {
      setActionMessage({ type: 'success', text: 'Turno agendado correctamente.' });
      setShowNewModal(false);
      setSelectedExistingCustId('');
      setNewCustName('');
      setNewCustPhone('');
      setNewNotes('');
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Error al agendar turno.' });
    }
  };

  // Submit rescheduling
  const handleConfirmReschedule = () => {
    if (!activeAppointment) return;
    const newDateTime = new Date(`${rescheduleDateStr}T${rescheduleTimeStr}:00`);
    const res = rescheduleAppointment(activeAppointment.id, newDateTime.toISOString());
    if (res.success) {
      setActionMessage({ type: 'success', text: 'Turno reprogramado exitosamente.' });
      setShowRescheduleModal(false);
      setActiveAppointment(null);
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Error al reprogramar.' });
    }
  };

  // Real-time ticker for in-progress turnos
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Focus Pop-up Modal state (Mobile & Full-screen active turno view)
  const [activeFocusAppt, setActiveFocusAppt] = useState<Appointment | null>(null);

  // Finish & Checkout Modal state
  const [finishModalAppt, setFinishModalAppt] = useState<Appointment | null>(null);
  const [finishPaymentMethod, setFinishPaymentMethod] = useState<PaymentMethod>('cash');

  const inProgressAppointments = useMemo(() => {
    return appointments.filter(
      (a) =>
        a.organization_id === currentOrg.id &&
        a.branch_id === currentBranch.id &&
        a.status === 'in_progress'
    );
  }, [appointments, currentOrg.id, currentBranch.id]);

  // Statistics: Average duration of completed appointments
  const durationStats = useMemo(() => {
    const completed = appointments.filter(
      (a) =>
        a.organization_id === currentOrg.id &&
        a.branch_id === currentBranch.id &&
        a.status === 'completed' &&
        a.actual_duration_minutes
    );
    if (completed.length === 0) return null;
    const totalMinutes = completed.reduce((acc, c) => acc + (c.actual_duration_minutes || 0), 0);
    const avg = Math.round(totalMinutes / completed.length);
    return {
      count: completed.length,
      avgMinutes: avg,
      totalMinutes,
    };
  }, [appointments, currentOrg.id, currentBranch.id]);

  const getSessionStartTime = (appointmentId: string): number => {
    const saved = localStorage.getItem(`tp_session_start_${appointmentId}`);
    if (saved) return Number(saved);
    return Date.now();
  };

  const getSessionExtraMinutes = (appointmentId: string): number => {
    const saved = localStorage.getItem(`tp_session_extra_${appointmentId}`);
    if (saved) return Number(saved);
    return 0;
  };

  const handleStartTurno = (appt: Appointment) => {
    const nowIso = new Date().toISOString();
    localStorage.setItem(`tp_session_start_${appt.id}`, String(Date.now()));
    localStorage.setItem(`tp_session_extra_${appt.id}`, '0');
    updateAppointmentStatus(appt.id, 'in_progress', {
      started_at: nowIso,
    });
    // Open focus pop-up modal directly for mobile attention
    setActiveFocusAppt({ ...appt, status: 'in_progress', started_at: nowIso });
    setActionMessage({
      type: 'success',
      text: `▶ Turno de ${appt.customer?.full_name || 'cliente'} iniciado. Cronómetro en marcha.`,
    });
  };

  const handleAddMinutes = (appointmentId: string, minutes: number = 5) => {
    const current = getSessionExtraMinutes(appointmentId);
    localStorage.setItem(`tp_session_extra_${appointmentId}`, String(current + minutes));
    setCurrentTime(Date.now());
  };

  const getTurnoTiming = (appt: Appointment) => {
    const startTime = getSessionStartTime(appt.id);
    const extraMinutes = getSessionExtraMinutes(appt.id);
    const durationMinutes = (appt.service_duration_minutes || 30) + extraMinutes;
    const totalSeconds = durationMinutes * 60;
    const elapsedSeconds = Math.max(0, Math.floor((currentTime - startTime) / 1000));
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    const isOverTime = elapsedSeconds > totalSeconds;
    const overSeconds = isOverTime ? elapsedSeconds - totalSeconds : 0;

    const formatTime = (secs: number) => {
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const pct = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

    return {
      durationMinutes,
      elapsedMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      formattedRemaining: formatTime(remainingSeconds),
      formattedOvertime: formatTime(overSeconds),
      isOverTime,
      pct,
      remainingSeconds,
    };
  };

  const handleOpenFinishModal = (appt: Appointment) => {
    setActiveFocusAppt(null); // Close focus pop-up if open
    setFinishModalAppt(appt);
    setFinishPaymentMethod('cash');
  };

  const handleConfirmFinishAndPay = (appt: Appointment) => {
    const srv = services.find((s) => s.duration_minutes === appt.service_duration_minutes) || appt.service;
    const timing = getTurnoTiming(appt);
    const pendingAmount = Math.max(0, appt.total_amount - (appt.deposit_amount || 0));
    const actualMinutes = timing.elapsedMinutes;

    createSale({
      branchId: currentBranch.id,
      customerId: appt.customer_id,
      appointmentId: appt.id,
      professionalId: appt.professional_id,
      items: [
        {
          serviceId: srv?.id,
          description: srv?.name || 'Servicio de Atención',
          quantity: 1,
          unitPrice: appt.total_amount,
        },
      ],
      paymentMethod: finishPaymentMethod,
      depositCreditApplied: appt.deposit_amount || 0,
      notes: `Turno atendido (${actualMinutes} min reales). Cobrado en mostrador vía ${finishPaymentMethod}.`,
    });

    updateAppointmentStatus(appt.id, 'completed', {
      actual_duration_minutes: actualMinutes,
      completed_at: new Date().toISOString(),
      internal_notes: `Duración real de atención: ${actualMinutes} min (Estimado: ${timing.durationMinutes} min).`,
    });

    localStorage.removeItem(`tp_session_start_${appt.id}`);
    localStorage.removeItem(`tp_session_extra_${appt.id}`);

    setActiveFocusAppt(null);
    setFinishModalAppt(null);
    setActionMessage({
      type: 'success',
      text: `✓ ¡Turno finalizado! Duración registrada: ${actualMinutes} min. Cobro de $${pendingAmount.toLocaleString()} asentado en caja.`,
    });
  };

  const handleFinishWithoutPay = (appt: Appointment) => {
    const timing = getTurnoTiming(appt);
    const actualMinutes = timing.elapsedMinutes;

    updateAppointmentStatus(appt.id, 'completed', {
      actual_duration_minutes: actualMinutes,
      completed_at: new Date().toISOString(),
      internal_notes: `Duración real: ${actualMinutes} min.`,
    });

    localStorage.removeItem(`tp_session_start_${appt.id}`);
    localStorage.removeItem(`tp_session_extra_${appt.id}`);

    setActiveFocusAppt(null);
    setFinishModalAppt(null);
    setActionMessage({
      type: 'success',
      text: `Turno marcado como finalizado. Duración real: ${actualMinutes} min.`,
    });
  };

  // Helper for status badge
  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7EFE4] text-[#28634C] border border-[#E8CDA8]/60">Confirmado</span>;
      case 'checked_in':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">En Sala</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">En Atención</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">Completado</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">Cancelado</span>;
      case 'pending_payment':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7EFE4] text-[#8C6B32] border border-[#E8CDA8]/60">Seña Pendiente</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF8F2] text-stone-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Rubro & Account Identification Banner (Minimal & Sleek) */}
      <RubroAccountBanner />

      {/* Active In-Progress Turno Sticky Widget */}
      {inProgressAppointments.length > 0 && (
        <div className="space-y-3">
          {inProgressAppointments.map((inProgAppt) => {
            const cust = customers.find((c) => c.id === inProgAppt.customer_id);
            const prof = professionals.find((p) => p.id === inProgAppt.professional_id);
            const srv =
              services.find((s) => s.duration_minutes === inProgAppt.service_duration_minutes) ||
              inProgAppt.service;
            const timing = getTurnoTiming(inProgAppt);

            return (
              <div
                key={inProgAppt.id}
                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#28634C] to-[#1E4535] text-white shadow-md border border-[#E8CDA8]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                    <Scissors className="w-6 h-6 text-[#E8CDA8] animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-[#E8CDA8]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Turno en curso
                      </span>
                      <span className="text-xs text-white/80">
                        {prof?.display_name ? `Atiende ${prof.display_name}` : 'En atención'}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-white tracking-tight mt-0.5">
                      {cust?.full_name || 'Cliente'} — {srv?.name || 'Servicio'}
                    </h3>
                    <p className="text-xs text-white/70">
                      Duración estimada: {timing.durationMinutes} min • {cust?.phone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  {/* Digital Timer */}
                  <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/15 flex items-center gap-3">
                    <Timer className="w-5 h-5 text-[#E8CDA8]" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-white/70 tracking-wider">
                        {timing.isOverTime ? 'Tiempo excedido' : 'Tiempo restante'}
                      </div>
                      <div className="text-xl font-bold font-mono tracking-wider tabular-nums text-white">
                        {timing.isOverTime ? `+${timing.formattedOvertime}` : timing.formattedRemaining}
                      </div>
                    </div>
                    {/* Progress pill */}
                    <div className="w-14 bg-white/20 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          timing.isOverTime ? 'bg-amber-400' : 'bg-[#E8CDA8]'
                        }`}
                        style={{ width: `${timing.pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveFocusAppt(inProgAppt)}
                      className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/25 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Abrir vista exclusiva para celular"
                    >
                      <span>📱 Pantalla de atención</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddMinutes(inProgAppt.id, 5)}
                      className="px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition cursor-pointer"
                      title="Extender 5 minutos más"
                    >
                      +5 min
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenFinishModal(inProgAppt)}
                      className="px-5 py-2.5 rounded-xl bg-[#E8CDA8] hover:bg-[#dfc097] text-[#24352C] font-bold text-xs shadow-sm transition hover:shadow active:scale-98 cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#28634C]" />
                      <span>Ya terminé</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Toolbar: Date, Filters & Actions in a Single Clear Layout */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Left: View Mode Toggle & Date Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#FAF8F2] p-1 rounded-xl border border-[#E8E2D8] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'day'
                  ? 'bg-white text-[#28634C] shadow-2xs font-bold'
                  : 'text-[#5E7166] hover:text-[#24352C]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Día</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-[#28634C] shadow-2xs font-bold'
                  : 'text-[#5E7166] hover:text-[#24352C]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Todos ({appointments.filter((a) => a.organization_id === currentOrg.id && a.branch_id === currentBranch.id && a.status !== 'cancelled').length})</span>
            </button>
          </div>

          {viewMode === 'day' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF8F2] transition cursor-pointer text-[#24352C]"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1.5 rounded-xl border border-[#E8E2D8] text-xs font-semibold hover:bg-[#FAF8F2] transition cursor-pointer text-[#24352C]"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF8F2] transition cursor-pointer text-[#24352C]"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDateStr}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    setSelectedDate(new Date(y, m - 1, d, 12, 0, 0));
                  }
                }}
                className="text-xs bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-2.5 py-1.5 text-[#24352C] cursor-pointer font-medium ml-1"
              />
            </div>
          )}
        </div>

        {/* Right: Professional Filter + Link + New Appointment */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedProfFilter}
            onChange={(e) => setSelectedProfFilter(e.target.value)}
            className="bg-[#FAF8F2] border border-[#E8E2D8] text-xs font-medium rounded-xl px-3 py-2 text-[#24352C] focus:outline-[#28634C]"
          >
            <option value="all">Todos los profesionales ({branchProfessionals.length})</option>
            {branchProfessionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>

          {/* Quick Copy Turnero */}
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/reservar/${currentOrg.slug}`;
              navigator.clipboard.writeText(url);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2500);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D8] bg-[#FAF8F2] hover:bg-[#F2ECE4] text-xs font-semibold text-[#24352C] transition cursor-pointer"
            title="Copiar link para enviar a clientes"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#5E7166]" />
                <span>Link Turnero</span>
              </>
            )}
          </button>

          <a
            href={`/reservar/${currentOrg.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl border border-[#E8E2D8] bg-[#FAF8F2] hover:bg-[#F2ECE4] text-[#5E7166] hover:text-[#28634C] transition"
            title="Abrir turnero web público"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E8CDA8]" />
            <span>Nuevo Turno</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold underline text-xs cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Gentle notice for appointments on other dates */}
      {otherDateAppointments.length > 0 && viewMode === 'day' && (
        <div className="p-3 bg-[#F7EFE4] border border-[#E8CDA8]/60 rounded-2xl text-xs text-[#24352C] flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#28634C] shrink-0" />
            <span>
              Tenés <strong>{otherDateAppointments.length} {otherDateAppointments.length === 1 ? 'turno agendado' : 'turnos agendados'}</strong> para otros días.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="text-xs font-bold text-[#28634C] underline hover:opacity-80 cursor-pointer"
          >
            Ver todos los turnos →
          </button>
        </div>
      )}

      {/* Main Agenda View: Columns by Professional */}
      {viewMode === 'day' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(selectedProfFilter === 'all'
            ? branchProfessionals
            : branchProfessionals.filter((p) => p.id === selectedProfFilter)
          ).map((prof) => {
            const profAppointments = filteredAppointments.filter((a) => a.professional_id === prof.id);

            return (
              <div
                key={prof.id}
                className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs flex flex-col overflow-hidden"
              >
                {/* Column Header */}
                <div
                  className="p-4 border-b border-[#EFE9DF] dark:border-[#2D2825] flex items-center justify-between"
                  style={{ borderTop: `4px solid ${prof.color_tag}` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                      style={{ backgroundColor: prof.color_tag }}
                    >
                      {prof.display_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
                        {prof.display_name}
                      </h3>
                      <p className="text-[10px] text-stone-400 truncate max-w-[140px]">{prof.specialty}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#4A725D] dark:text-[#A1CEB5] bg-[#EBF2EE] dark:bg-[#25382D] px-2.5 py-0.5 rounded-lg border border-[#D5E3DB] dark:border-[#314A3B]">
                    {profAppointments.length} turnos
                  </span>
                </div>

                {/* Appointments List for this professional */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px] bg-[#FAF7F2]/60 dark:bg-[#1A1817]/60">
                  {profAppointments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-stone-400">
                      Sin turnos agendados para este día.
                    </div>
                  ) : (
                    profAppointments
                      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
                      .map((appt) => {
                        const cust = customers.find((c) => c.id === appt.customer_id);
                        const srv = services.find((s) => s.duration_minutes === appt.service_duration_minutes);
                        const startTime = new Date(appt.starts_at).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const endTime = new Date(appt.ends_at).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={appt.id}
                            className={`p-4 rounded-2xl border bg-white shadow-xs transition hover:shadow-sm space-y-3 ${
                              appt.status === 'in_progress'
                                ? 'border-[#28634C] ring-2 ring-[#28634C]/20'
                                : appt.status === 'cancelled'
                                ? 'border-[#E8E2D8] opacity-60'
                                : 'border-[#E8E2D8]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-xs text-[#24352C] flex items-center gap-1.5 tabular-nums">
                                  <Clock className="w-3.5 h-3.5 text-[#28634C]" />
                                  {startTime} - {endTime} hs
                                </span>
                                <span className="text-[10px] text-[#5E7166] mt-0.5 block">
                                  Duración: {appt.service_duration_minutes || 30} min aprox
                                </span>
                              </div>
                              {renderStatusBadge(appt.status)}
                            </div>

                            {/* Active In-Progress Timer Inside Card */}
                            {appt.status === 'in_progress' && (() => {
                              const timing = getTurnoTiming(appt);
                              return (
                                <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#28634C]/30 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-[#28634C] flex items-center gap-1">
                                      <Timer className="w-3.5 h-3.5" />
                                      {timing.isOverTime ? 'Excedido:' : 'Restante:'}
                                    </span>
                                    <span className="text-sm font-bold font-mono tabular-nums text-[#24352C]">
                                      {timing.isOverTime ? `+${timing.formattedOvertime}` : timing.formattedRemaining}
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#E8E2D8] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-1000 ${
                                        timing.isOverTime ? 'bg-amber-500' : 'bg-[#28634C]'
                                      }`}
                                      style={{ width: `${timing.pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}

                            <div>
                              <div className="font-semibold text-xs text-[#24352C] flex items-center justify-between">
                                <span className="font-bold">{cust?.full_name || 'Cliente'}</span>
                                <span className="text-xs font-bold text-[#28634C] tabular-nums">
                                  ${appt.total_amount.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5E7166] mt-0.5">
                                {cust?.phone}
                              </p>
                              {appt.customer_notes && (
                                <p className="text-[11px] text-[#24352C] bg-[#F7EFE4] p-2 rounded-xl mt-1.5 italic border border-[#E8CDA8]/60">
                                  "{appt.customer_notes}"
                                </p>
                              )}
                            </div>

                            {/* Action progression bar */}
                            <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between gap-1.5">
                              {/* Iniciar turno button */}
                              {(appt.status === 'confirmed' || appt.status === 'checked_in') && (
                                <button
                                  onClick={() => handleStartTurno(appt)}
                                  className="flex-1 py-2 px-3 rounded-xl bg-[#28634C] hover:bg-[#1E4D3B] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current text-[#E8CDA8]" />
                                  <span>Iniciar turno</span>
                                </button>
                              )}

                              {/* In-progress actions: Pop-up, +5min & Ya terminé */}
                              {appt.status === 'in_progress' && (
                                <>
                                  <button
                                    onClick={() => setActiveFocusAppt(appt)}
                                    className="py-2 px-2.5 rounded-xl border border-[#28634C]/40 bg-[#28634C]/10 hover:bg-[#28634C]/20 text-[11px] font-bold text-[#28634C] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title="Abrir pantalla completa para celular"
                                  >
                                    <span>📱 Pop-up</span>
                                  </button>
                                  <button
                                    onClick={() => handleAddMinutes(appt.id, 5)}
                                    className="py-2 px-2 rounded-xl border border-[#E8E2D8] bg-white hover:bg-[#FAF8F2] text-[11px] font-bold text-[#24352C] transition cursor-pointer"
                                    title="Extender 5 minutos más"
                                  >
                                    +5m
                                  </button>
                                  <button
                                    onClick={() => handleOpenFinishModal(appt)}
                                    className="flex-1 py-2 px-3 rounded-xl bg-[#28634C] hover:bg-[#1E4D3B] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E8CDA8]" />
                                    <span>Ya terminé</span>
                                  </button>
                                </>
                              )}

                              {appt.status === 'completed' && (
                                <div className="flex-1 py-1.5 px-2 text-center text-xs font-semibold text-[#28634C] bg-[#FAF8F2] rounded-xl border border-[#E8E2D8] flex items-center justify-center gap-1.5 flex-wrap">
                                  <span>✓ Atendido y cobrado</span>
                                  {appt.actual_duration_minutes && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-[#28634C]/10 text-[#28634C] text-[10px] font-bold">
                                      ⏱️ {appt.actual_duration_minutes} min reales
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Reschedule Button */}
                              {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    setActiveAppointment(appt);
                                    setRescheduleDateStr(appt.starts_at.split('T')[0]);
                                    setShowRescheduleModal(true);
                                  }}
                                  className="py-1.5 px-2 rounded-xl border border-[#E8E2D8] text-[#5E7166] hover:text-[#24352C] hover:bg-[#FAF8F2] text-[10px] font-medium transition cursor-pointer"
                                >
                                  Reprogramar
                                </button>
                              )}

                              {/* Cancel action */}
                              {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                <button
                                  onClick={() => {
                                    if (confirm('¿Cancelar este turno?')) {
                                      cancelAppointment(appt.id, 'Cancelado desde panel de agenda');
                                    }
                                  }}
                                  className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                  title="Cancelar turno"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] dark:bg-[#282421] text-stone-500 uppercase tracking-wider font-bold border-b border-[#E8E2D8] dark:border-[#2D2825]">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Profesional</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4] dark:divide-[#2D2825]">
                {filteredAppointments.map((appt) => {
                  const cust = customers.find((c) => c.id === appt.customer_id);
                  const prof = professionals.find((p) => p.id === appt.professional_id);
                  const d = new Date(appt.starts_at);

                  return (
                    <tr key={appt.id} className="hover:bg-[#FAF7F2]/80 dark:hover:bg-[#282421]/60 transition">
                      <td className="px-4 py-3 font-semibold text-stone-800 dark:text-stone-100 tabular-nums">
                        {d.toLocaleDateString('es-AR')} •{' '}
                        {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-stone-900 dark:text-stone-100">{cust?.full_name}</div>
                        <div className="text-[11px] text-stone-400">{cust?.phone}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-700 dark:text-stone-300">
                        {prof?.display_name}
                      </td>
                      <td className="px-4 py-3">
                        {renderStatusBadge(appt.status)}
                        {appt.actual_duration_minutes && (
                          <span className="text-[10px] text-[#28634C] font-semibold block mt-1">
                            ⏱️ {appt.actual_duration_minutes} min reales
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                        ${appt.total_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(appt.status === 'confirmed' || appt.status === 'checked_in') && (
                            <button
                              onClick={() => handleStartTurno(appt)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#28634C] hover:bg-[#1E4D3B] text-white transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current text-[#E8CDA8]" />
                              <span>Iniciar</span>
                            </button>
                          )}
                          {appt.status === 'in_progress' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setActiveFocusAppt(appt)}
                                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white border border-[#28634C]/40 text-[#28634C] transition flex items-center gap-1 cursor-pointer"
                                title="Abrir pop-up completo para celular"
                              >
                                <span>📱 Pop-up</span>
                              </button>
                              <button
                                onClick={() => handleOpenFinishModal(appt)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#E8CDA8] hover:bg-[#dfc097] text-[#24352C] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3 text-[#28634C]" />
                                <span>Ya terminé</span>
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setActiveAppointment(appt);
                              setRescheduleDateStr(appt.starts_at.split('T')[0]);
                              setShowRescheduleModal(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#E4DDD2] hover:bg-[#F7F3EC] text-stone-700 transition cursor-pointer"
                          >
                            Reprogramar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL NEW APPOINTMENT */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 shadow-2xl space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <h3 className="font-bold text-lg text-stone-900 dark:text-white">Nuevo Turno Manual</h3>
              <button onClick={() => setShowNewModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Buscar Cliente Registrado (Opcional)
                </label>
                <CustomerSearchSelect
                  customers={customers.filter((c) => c.organization_id === currentOrg.id)}
                  selectedCustomerId={selectedExistingCustId}
                  onSelectCustomerId={(id) => {
                    setSelectedExistingCustId(id);
                    if (id) {
                      const c = customers.find((cust) => cust.id === id);
                      if (c) {
                        setNewCustName(c.full_name);
                        setNewCustPhone(c.phone || '');
                      }
                    }
                  }}
                  allowOccasional={true}
                  occasionalLabel="Nuevo cliente (ingreso manual)"
                  placeholder="Buscar por nombre, teléfono o email..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="Ej. Lucas Rossi"
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+54 11 ..."
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Servicio *
                  </label>
                  <select
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                  >
                    {services
                      .filter((s) => s.organization_id === currentOrg.id && s.is_active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (${s.price.toLocaleString()})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Profesional Asignado *
                  </label>
                  <select
                    value={newProfId}
                    onChange={(e) => setNewProfId(e.target.value)}
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                  >
                    {branchProfessionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    disabled
                    value={selectedDateStr}
                    className="w-full bg-[#F2ECE4] dark:bg-[#282421] border border-[#E0D8CC] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-600 dark:text-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    required
                    value={newTimeStr}
                    onChange={(e) => setNewTimeStr(e.target.value)}
                    className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24352C] mb-1">
                  Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detalles sobre el turno o preferencias del cliente..."
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-[#5E7166] hover:bg-[#FAF8F2] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  Guardar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESCHEDULING */}
      {showRescheduleModal && activeAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h3 className="font-bold text-base text-[#24352C]">Reprogramar Turno</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#5E7166]">
                Seleccioná el nuevo día y horario para reprogramar el turno de forma inmediata:
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#24352C] mb-1">
                  Nueva Fecha
                </label>
                <input
                  type="date"
                  value={rescheduleDateStr}
                  onChange={(e) => setRescheduleDateStr(e.target.value)}
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24352C] mb-1">
                  Nuevo Horario
                </label>
                <input
                  type="time"
                  value={rescheduleTimeStr}
                  onChange={(e) => setRescheduleTimeStr(e.target.value)}
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8]">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-[#5E7166] hover:bg-[#FAF8F2] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-5 py-2 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                Confirmar Reprogramación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / POP-UP EXCLUSIVO DE ATENCIÓN EN CELULAR & PANTALLA COMPLETA */}
      {activeFocusAppt && (() => {
        const cust = customers.find((c) => c.id === activeFocusAppt.customer_id);
        const prof = professionals.find((p) => p.id === activeFocusAppt.professional_id);
        const srv =
          services.find((s) => s.duration_minutes === activeFocusAppt.service_duration_minutes) ||
          activeFocusAppt.service;
        const timing = getTurnoTiming(activeFocusAppt);
        const deposit = activeFocusAppt.deposit_amount || 0;
        const pendingAmount = Math.max(0, activeFocusAppt.total_amount - deposit);
        const cleanPhone = cust?.phone?.replace(/\D/g, '') || '';
        const startTime = new Date(activeFocusAppt.starts_at).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const endTime = new Date(activeFocusAppt.ends_at).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div className="fixed inset-0 z-50 bg-[#16221C]/85 backdrop-blur-md flex flex-col justify-between sm:justify-center items-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-[#E8CDA8] shadow-2xl p-5 sm:p-7 flex flex-col justify-between gap-5 my-auto animate-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#28634C] bg-[#28634C]/10 px-2.5 py-0.5 rounded-full">
                    Atención en Curso
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveFocusAppt(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-[#5E7166] hover:bg-[#FAF8F2] transition cursor-pointer"
                  title="Minimizar pop-up para ver la agenda"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Minimizar</span>
                </button>
              </div>

              {/* Giant Digital Clock */}
              <div className="bg-gradient-to-b from-[#FAF8F2] to-[#F7EFE4] p-5 sm:p-6 rounded-2xl border border-[#E8CDA8]/80 text-center space-y-3 shadow-inner">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E7166] block">
                  {timing.isOverTime ? '⚠️ Tiempo estimado superado' : 'Tiempo restante del turno'}
                </span>

                <div
                  className={`text-5xl sm:text-6xl font-black font-mono tracking-tight tabular-nums ${
                    timing.isOverTime ? 'text-amber-600' : 'text-[#28634C]'
                  }`}
                >
                  {timing.isOverTime ? `+${timing.formattedOvertime}` : timing.formattedRemaining}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#E8E2D8] h-3 rounded-full overflow-hidden shadow-xs">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timing.isOverTime ? 'bg-amber-500' : 'bg-[#28634C]'
                    }`}
                    style={{ width: `${timing.pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#5E7166] pt-1">
                  <span>
                    ⏱️ Transcurrido: <strong>{timing.elapsedMinutes} min</strong>
                  </span>
                  <span>
                    Estimado: <strong>{timing.durationMinutes} min</strong> ({startTime} - {endTime} hs)
                  </span>
                </div>

                {/* Quick Add Minutes Pills */}
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#E8CDA8]/40">
                  <span className="text-[11px] font-semibold text-[#5E7166]">Extender tiempo:</span>
                  <button
                    type="button"
                    onClick={() => handleAddMinutes(activeFocusAppt.id, 5)}
                    className="px-3 py-1 rounded-lg bg-white border border-[#E8E2D8] hover:border-[#28634C] text-xs font-bold text-[#24352C] transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    +5 min
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMinutes(activeFocusAppt.id, 10)}
                    className="px-3 py-1 rounded-lg bg-white border border-[#E8E2D8] hover:border-[#28634C] text-xs font-bold text-[#24352C] transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    +10 min
                  </button>
                </div>
              </div>

              {/* Customer & Turn Details */}
              <div className="space-y-3">
                {/* Cliente */}
                <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E8E2D8] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E7166] block">
                      Cliente
                    </span>
                    <h4 className="font-bold text-base text-[#24352C]">{cust?.full_name || 'Cliente'}</h4>
                    <p className="text-xs text-[#5E7166] mt-0.5">{cust?.phone || 'Sin teléfono registrado'}</p>
                  </div>
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Servicio y Cobro */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E8E2D8]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E7166] block">
                      Servicio
                    </span>
                    <div className="font-bold text-xs text-[#24352C] mt-0.5 line-clamp-1">
                      {srv?.name || 'Servicio'}
                    </div>
                    <span className="text-[11px] text-[#28634C] font-semibold mt-0.5 block">
                      {prof?.display_name ? `Atiende ${prof.display_name}` : 'Profesional'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E8E2D8]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E7166] block">
                      Total a Cobrar
                    </span>
                    <div className="font-extrabold text-base text-[#28634C] mt-0.5 tabular-nums">
                      ${pendingAmount.toLocaleString()}
                    </div>
                    {deposit > 0 && (
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        (Seña previa: -${deposit.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Notes */}
                {activeFocusAppt.customer_notes && (
                  <div className="p-3 rounded-2xl bg-[#F7EFE4] border border-[#E8CDA8]/80 text-xs text-[#24352C] space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6B32] block">
                      Pedido / Nota del cliente:
                    </span>
                    <p className="italic font-medium">"{activeFocusAppt.customer_notes}"</p>
                  </div>
                )}
              </div>

              {/* Giant "Ya terminé" Primary Action Button */}
              <div className="pt-2 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => handleOpenFinishModal(activeFocusAppt)}
                  className="w-full py-4 rounded-2xl bg-[#28634C] hover:bg-[#1E4D3B] text-[#FAF8F2] font-bold text-base shadow-lg transition hover:shadow-xl active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#E8CDA8]" />
                  <span>✓ Ya terminé (Ir a Cobro)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: RESUMEN DE ATENCIÓN & COBRO */}
      {finishModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#28634C] text-[#E8CDA8] flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#24352C]">¡Turno Finalizado!</h3>
                  <p className="text-xs text-[#5E7166]">Resumen del servicio, estadísticas y cobro</p>
                </div>
              </div>
              <button
                onClick={() => setFinishModalAppt(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-xl transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const cust = customers.find((c) => c.id === finishModalAppt.customer_id);
              const prof = professionals.find((p) => p.id === finishModalAppt.professional_id);
              const srv =
                services.find((s) => s.duration_minutes === finishModalAppt.service_duration_minutes) ||
                finishModalAppt.service;
              const timing = getTurnoTiming(finishModalAppt);
              const deposit = finishModalAppt.deposit_amount || 0;
              const pendingAmount = Math.max(0, finishModalAppt.total_amount - deposit);
              const cleanPhone = cust?.phone?.replace(/\D/g, '') || '';

              return (
                <div className="space-y-4">
                  {/* Card 1: Cliente Info */}
                  <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E8E2D8] space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5E7166]">
                      Datos del Cliente
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-[#24352C]">{cust?.full_name || 'Cliente'}</div>
                        <div className="text-xs text-[#5E7166] mt-0.5">{cust?.phone || 'Sin teléfono registrado'}</div>
                      </div>
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                    {finishModalAppt.customer_notes && (
                      <p className="text-xs text-[#24352C] bg-white p-2.5 rounded-xl border border-[#E8E2D8] italic">
                        "{finishModalAppt.customer_notes}"
                      </p>
                    )}
                  </div>

                  {/* Card 2: Lo que se realizó y Estadística de Tiempo */}
                  <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E8E2D8] space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5E7166]">
                      Servicio Realizado & Estadística
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#24352C]">{srv?.name || 'Servicio de Atención'}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#28634C]/10 text-[#28634C]">
                        {prof?.display_name || 'Profesional'}
                      </span>
                    </div>
                    <div className="text-xs text-[#5E7166] flex items-center justify-between pt-1 border-t border-[#E8E2D8]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#28634C]" />
                        <span>
                          Duración real: <strong>{timing.elapsedMinutes} min registrados</strong>
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#28634C] bg-[#28634C]/10 px-2 py-0.5 rounded-md">
                        {timing.elapsedMinutes <= timing.durationMinutes
                          ? `✓ A tiempo (est: ${timing.durationMinutes} min)`
                          : `⚠️ +${timing.elapsedMinutes - timing.durationMinutes} min extra`}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Monto a Cobrar */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF8F2] to-[#F7EFE4] border-2 border-[#E8CDA8] space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5E7166]">
                      Liquidación & Cobro
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-[#5E7166]">
                        <span>Precio del Servicio:</span>
                        <span className="font-semibold text-[#24352C]">${finishModalAppt.total_amount.toLocaleString()}</span>
                      </div>
                      {deposit > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Seña abonada previamente:</span>
                          <span>-${deposit.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-[#E8CDA8] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#5E7166] block">TOTAL A COBRAR:</span>
                        <span className="text-[11px] text-[#5E7166]">Saldo a percibir en mostrador</span>
                      </div>
                      <span className="text-3xl font-extrabold text-[#28634C] tabular-nums tracking-tight">
                        ${pendingAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Método de Pago */}
                  <div>
                    <label className="block text-xs font-bold text-[#24352C] mb-2">
                      ¿Cómo paga el cliente?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFinishPaymentMethod('cash')}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          finishPaymentMethod === 'cash'
                            ? 'border-[#28634C] bg-[#28634C] text-white shadow-xs font-bold'
                            : 'border-[#E8E2D8] bg-[#FAF8F2] text-[#5E7166] hover:bg-white'
                        }`}
                      >
                        <Banknote className="w-5 h-5" />
                        <span className="text-xs">Efectivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFinishPaymentMethod('transfer')}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          finishPaymentMethod === 'transfer'
                            ? 'border-[#28634C] bg-[#28634C] text-white shadow-xs font-bold'
                            : 'border-[#E8E2D8] bg-[#FAF8F2] text-[#5E7166] hover:bg-white'
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="text-xs">Transferencia</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFinishPaymentMethod('card')}
                        className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          finishPaymentMethod === 'card'
                            ? 'border-[#28634C] bg-[#28634C] text-white shadow-xs font-bold'
                            : 'border-[#E8E2D8] bg-[#FAF8F2] text-[#5E7166] hover:bg-white'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-xs">Tarjeta / POS</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#E8E2D8] space-y-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmFinishAndPay(finishModalAppt)}
                      className="w-full py-3 rounded-xl bg-[#28634C] hover:bg-[#1E4D3B] text-white font-bold text-sm shadow-md transition hover:shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#E8CDA8]" />
                      <span>Confirmar Cobro de ${pendingAmount.toLocaleString()} y Cerrar Turno</span>
                    </button>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleFinishWithoutPay(finishModalAppt)}
                        className="text-xs text-[#5E7166] hover:text-[#24352C] underline transition cursor-pointer"
                      >
                        Cerrar sin cobrar ahora (pendiente)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinishModalAppt(null)}
                        className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-[#5E7166] hover:bg-[#FAF8F2] transition cursor-pointer"
                      >
                        Volver al timer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
