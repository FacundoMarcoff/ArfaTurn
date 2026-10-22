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
  Share2,
  ChevronDown,
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

  // 7-day strip for mobile (Screen 1 mockup)
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(current.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const formattedSelectedDate = useMemo(() => {
    const s = selectedDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [selectedDate]);

  const isToday = useMemo(() => {
    return getLocalDateKey(selectedDate) === getLocalDateKey(new Date());
  }, [selectedDate]);

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

  const renderMobileStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            Finalizado
          </span>
        );
      case 'confirmed':
      case 'checked_in':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Confirmado
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 animate-pulse">
            En atención
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF6E7] text-[#96680C] border border-[#E8CDA8]/60">
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* MOBILE-ONLY VIEW (SCREEN 1 MOCKUP) */}
      <div className="md:hidden space-y-3.5">
        {/* Title & Share link */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#24352C] tracking-tight">Agenda</h1>
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/reserva/${currentOrg.slug}`;
              navigator.clipboard.writeText(url);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2500);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D8] bg-white text-xs font-semibold text-[#24352C] shadow-2xs hover:bg-[#FAF8F2] transition cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#28634C]" />
                <span>Compartir link</span>
              </>
            )}
          </button>
        </div>

        {/* Date Navigation Header */}
        <div className="flex items-center justify-between py-1">
          <button
            type="button"
            onClick={handlePrevDay}
            className="w-8 h-8 rounded-full border border-[#E8E2D8] bg-white hover:bg-[#FAF8F2] flex items-center justify-center text-[#24352C] shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm text-[#24352C]">
            {formattedSelectedDate}
          </span>
          <button
            type="button"
            onClick={handleNextDay}
            className="w-8 h-8 rounded-full border border-[#E8E2D8] bg-white hover:bg-[#FAF8F2] flex items-center justify-center text-[#24352C] shadow-2xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 7-day strip */}
        <div className="grid grid-cols-7 gap-1 bg-white p-1 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          {weekDays.map((d) => {
            const isSelected = getLocalDateKey(d) === selectedDateStr;
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const name = dayNames[d.getDay()];
            const num = d.getDate();

            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#28634C] text-white shadow-xs font-bold'
                    : 'text-[#5E7166] hover:bg-[#FAF8F2]'
                }`}
              >
                <span className={`text-[10px] uppercase font-medium ${isSelected ? 'text-white/80' : 'text-[#5E7166]'}`}>
                  {name}
                </span>
                <span className={`text-sm mt-0.5 font-bold ${isSelected ? 'text-white' : 'text-[#24352C]'}`}>
                  {num}
                </span>
              </button>
            );
          })}
        </div>

        {/* Professional Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedProfFilter}
            onChange={(e) => setSelectedProfFilter(e.target.value)}
            className="w-full bg-white border border-[#E8E2D8] rounded-xl px-4 py-3 text-xs font-semibold text-[#24352C] appearance-none focus:outline-[#28634C] shadow-2xs cursor-pointer"
          >
            <option value="all">Todos los profesionales</option>
            {branchProfessionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-[#5E7166] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Counter */}
        <div className="text-xs text-[#5E7166] font-medium pt-1">
          {filteredAppointments.length} {filteredAppointments.length === 1 ? 'turno' : 'turnos'} · {isToday ? 'Hoy' : 'Día seleccionado'}
        </div>

        {/* Appointment Cards */}
        <div className="space-y-2.5 pb-24">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E2D8] p-8 text-center text-xs text-[#5E7166] space-y-2">
              <CalendarIcon className="w-8 h-8 text-[#5E7166]/40 mx-auto" />
              <p className="font-semibold text-sm text-[#24352C]">Sin turnos para este día</p>
              <p className="text-xs">Podés agendar uno tocando en &quot;+ Nuevo turno&quot;.</p>
            </div>
          ) : (
            filteredAppointments.map((appt) => {
              const cust = customers.find((c) => c.id === appt.customer_id);
              const prof = professionals.find((p) => p.id === appt.professional_id);
              const srv = services.find((s) => s.duration_minutes === appt.service_duration_minutes) || appt.service;
              const startTime = new Date(appt.starts_at).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={appt.id}
                  onClick={() => setActiveAppointment(appt)}
                  className="bg-white rounded-2xl p-3.5 border border-[#E8E2D8] flex items-center justify-between gap-3 shadow-2xs hover:border-[#28634C]/40 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-bold text-sm text-[#24352C] shrink-0 font-mono">
                      {startTime}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#24352C] truncate">
                        {cust?.full_name || 'Cliente'}
                      </h4>
                      <p className="text-xs text-[#5E7166] truncate mt-0.5">
                        {srv?.name || 'Servicio'}
                      </p>
                      <p className="text-[11px] text-[#5E7166]/80 truncate">
                        {prof?.display_name || 'Profesional'} · {appt.service_duration_minutes || 30} min
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {renderMobileStatusBadge(appt.status)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating + Nuevo Turno button */}
        <div className="fixed bottom-18 left-0 right-0 px-4 z-30 pointer-events-none">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 pointer-events-auto transition cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 text-[#E8CDA8]" />
            <span>+ Nuevo turno</span>
          </button>
        </div>
      </div>

      {/* DESKTOP-ONLY VIEW: SCREEN 01 (Agenda - Versión escritorio) */}
      <div className="hidden md:block space-y-4">
        {/* Row 1: Header (Title + Actions) */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#24352C] tracking-tight">
            Agenda
          </h1>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/reservar/${currentOrg.slug}`;
                navigator.clipboard.writeText(url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#CCD6D0] bg-white hover:bg-[#FAF8F2] text-xs font-semibold text-[#24352C] transition shadow-2xs cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#28634C]" />
                  <span>Compartir link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E8CDA8]" />
              <span>+ Nuevo turno</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Toolbar (Date navigator + Hoy + View Mode + Professional Select) */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          {/* Left: Date navigator & Hoy button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-[#E8E2D8] rounded-xl px-2 py-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 rounded-lg hover:bg-[#FAF8F2] text-[#5E7166] transition cursor-pointer"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-xs sm:text-sm text-[#24352C] px-3 select-none">
                {selectedDate.toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).replace(/^./, (str) => str.toUpperCase())}
              </span>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1 rounded-lg hover:bg-[#FAF8F2] text-[#5E7166] transition cursor-pointer"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] bg-white text-xs font-semibold text-[#24352C] hover:bg-[#FAF8F2] shadow-2xs transition cursor-pointer"
            >
              Hoy
            </button>

            {/* View Mode Pills */}
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-[#E8E2D8] shadow-2xs ml-1">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'day'
                    ? 'bg-[#EAF2EC] text-[#28634C] font-bold'
                    : 'text-[#5E7166] hover:text-[#24352C]'
                }`}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className="px-3 py-1 rounded-lg text-xs text-[#5E7166] hover:text-[#24352C] transition cursor-pointer"
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#EAF2EC] text-[#28634C] font-bold'
                    : 'text-[#5E7166] hover:text-[#24352C]'
                }`}
              >
                Lista
              </button>
            </div>
          </div>

          {/* Right: Professional Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedProfFilter}
              onChange={(e) => setSelectedProfFilter(e.target.value)}
              className="bg-white border border-[#CCD6D0] text-xs font-semibold rounded-xl pl-3 pr-8 py-2 text-[#24352C] appearance-none focus:outline-[#28634C] shadow-2xs cursor-pointer"
            >
              <option value="all">Todos los profesionales</option>
              {branchProfessionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#5E7166] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Schedule Grid: Columns by Professional (Screen 01 Mockup) */}
        {viewMode === 'day' ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
            {/* Table Header: Professional columns */}
            <div
              className="grid border-b border-[#E8E2D8] bg-[#FAF8F2]/60"
              style={{
                gridTemplateColumns: `70px repeat(${Math.max(
                  1,
                  (selectedProfFilter === 'all'
                    ? branchProfessionals
                    : branchProfessionals.filter((p) => p.id === selectedProfFilter)
                  ).length
                )}, minmax(0, 1fr))`,
              }}
            >
              <div className="p-3 text-[11px] font-bold text-[#5E7166] text-center border-r border-[#E8E2D8]" />
              {(selectedProfFilter === 'all'
                ? branchProfessionals
                : branchProfessionals.filter((p) => p.id === selectedProfFilter)
              ).map((prof) => (
                <div
                  key={prof.id}
                  className="p-3 flex items-center justify-center gap-2 border-r last:border-r-0 border-[#E8E2D8]"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                    style={{ backgroundColor: prof.color_tag || '#28634C' }}
                  >
                    {prof.display_name.charAt(0)}
                  </div>
                  <span className="font-bold text-xs text-[#24352C]">
                    {prof.display_name}
                  </span>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="divide-y divide-[#E8E2D8]/60">
              {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((hourStr) => {
                const hourNum = parseInt(hourStr.split(':')[0], 10);
                const activeProfs =
                  selectedProfFilter === 'all'
                    ? branchProfessionals
                    : branchProfessionals.filter((p) => p.id === selectedProfFilter);

                return (
                  <div
                    key={hourStr}
                    className="grid min-h-[76px]"
                    style={{
                      gridTemplateColumns: `70px repeat(${Math.max(
                        1,
                        activeProfs.length
                      )}, minmax(0, 1fr))`,
                    }}
                  >
                    {/* Hour Column */}
                    <div className="p-2 text-xs font-medium text-[#5E7166] text-center border-r border-[#E8E2D8]/70 select-none pt-2.5">
                      {hourStr}
                    </div>

                    {/* Slots per professional */}
                    {activeProfs.map((prof) => {
                      const apptsInSlot = filteredAppointments.filter((a) => {
                        if (a.professional_id !== prof.id) return false;
                        const aHour = new Date(a.starts_at).getHours();
                        return aHour === hourNum;
                      });

                      return (
                        <div
                          key={prof.id}
                          onClick={() => {
                            if (apptsInSlot.length === 0) {
                              setShowNewModal(true);
                            }
                          }}
                          className="p-1.5 border-r last:border-r-0 border-[#E8E2D8]/60 hover:bg-[#FAFDFB]/60 transition relative cursor-pointer group flex flex-col gap-1.5"
                        >
                          {apptsInSlot.map((appt) => {
                            const cust = customers.find((c) => c.id === appt.customer_id);
                            const srv =
                              services.find((s) => s.duration_minutes === appt.service_duration_minutes) ||
                              appt.service;
                            const startTime = new Date(appt.starts_at).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            const endTime = new Date(appt.ends_at).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                            const isFinished = appt.status === 'completed';
                            const isPending = appt.status === 'pending_payment';

                            return (
                              <div
                                key={appt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAppointment(appt);
                                }}
                                className={`p-2.5 rounded-xl border bg-white shadow-2xs hover:shadow-xs transition flex flex-col justify-between ${
                                  isFinished
                                    ? 'border-l-4 border-l-stone-400 border-stone-200 bg-stone-50/40'
                                    : isPending
                                    ? 'border-l-4 border-l-amber-500 border-amber-200 bg-[#FFFDF5]'
                                    : 'border-l-4 border-l-[#28634C] border-[#CCD6D0]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-xs text-[#24352C] truncate">
                                      {cust?.full_name || 'Cliente'}
                                    </h4>
                                    <p className="text-[11px] text-[#5E7166] truncate">
                                      {srv?.name || 'Servicio'} · {appt.service_duration_minutes || 45} min
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                      isFinished
                                        ? 'bg-stone-100 text-stone-600'
                                        : isPending
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-[#EAF2EC] text-[#28634C]'
                                    }`}
                                  >
                                    {isFinished
                                      ? 'Finalizado'
                                      : isPending
                                      ? 'Pendiente'
                                      : 'Confirmado'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#5E7166] text-right mt-1 font-mono">
                                  {startTime} - {endTime}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List Mode View */
          <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F2] text-[#5E7166] font-bold border-b border-[#E8E2D8]">
                  <tr>
                    <th className="px-4 py-3">Fecha y Hora</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Profesional</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {filteredAppointments.map((appt) => {
                    const cust = customers.find((c) => c.id === appt.customer_id);
                    const prof = professionals.find((p) => p.id === appt.professional_id);
                    const d = new Date(appt.starts_at);

                    return (
                      <tr
                        key={appt.id}
                        onClick={() => setActiveAppointment(appt)}
                        className="hover:bg-[#FAF8F2]/60 transition cursor-pointer"
                      >
                        <td className="px-4 py-3 font-mono font-medium">
                          {d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}{' '}
                          {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                        </td>
                        <td className="px-4 py-3 font-bold text-[#24352C]">
                          {cust?.full_name || 'Cliente'}
                        </td>
                        <td className="px-4 py-3">{prof?.display_name || 'Profesional'}</td>
                        <td className="px-4 py-3">{renderMobileStatusBadge(appt.status)}</td>
                        <td className="px-4 py-3 font-bold text-[#28634C]">
                          ${appt.total_amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAppointment(appt);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FAF8F2] hover:bg-[#F2ECE4] border border-[#E8E2D8] text-[#28634C]"
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
