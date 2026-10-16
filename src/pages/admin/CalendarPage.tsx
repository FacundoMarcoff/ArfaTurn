import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { AppointmentStatus, Appointment } from '../../types/database.types';
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
                              <span className="font-bold text-xs text-[#24352C] flex items-center gap-1.5 tabular-nums">
                                <Clock className="w-3.5 h-3.5 text-[#28634C]" />
                                {startTime} - {endTime} hs
                              </span>
                              {renderStatusBadge(appt.status)}
                            </div>

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
                              {appt.status === 'confirmed' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'checked_in')}
                                  className="flex-1 py-1.5 px-2 rounded-xl bg-[#F7EFE4] text-[#28634C] hover:bg-[#E8CDA8]/40 border border-[#E8CDA8]/60 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>En Sala</span>
                                </button>
                              )}

                              {appt.status === 'checked_in' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'in_progress')}
                                  className="flex-1 py-1.5 px-2 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <PlayCircle className="w-3 h-3" />
                                  <span>Atender</span>
                                </button>
                              )}

                              {appt.status === 'in_progress' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'completed')}
                                  className="flex-1 py-1.5 px-2 rounded-xl bg-[#28634C] text-white hover:bg-[#1E4E3B] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <CheckCircle className="w-3 h-3 text-[#E8CDA8]" />
                                  <span>Cobrar / Finalizar</span>
                                </button>
                              )}

                              {/* Reschedule Button */}
                              {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    setActiveAppointment(appt);
                                    setRescheduleDateStr(appt.starts_at.split('T')[0]);
                                    setShowRescheduleModal(true);
                                  }}
                                  className="py-1.5 px-2.5 rounded-xl border border-[#E8E2D8] text-[#5E7166] hover:text-[#24352C] hover:bg-[#FAF8F2] text-[10px] font-medium transition cursor-pointer"
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
                      <td className="px-4 py-3">{renderStatusBadge(appt.status)}</td>
                      <td className="px-4 py-3 font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                        ${appt.total_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setActiveAppointment(appt);
                            setRescheduleDateStr(appt.starts_at.split('T')[0]);
                            setShowRescheduleModal(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#E4DDD2] dark:border-[#352F2B] hover:bg-[#F7F3EC] dark:hover:bg-[#282421] text-stone-700 dark:text-stone-200 transition"
                        >
                          Reprogramar
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
    </div>
  );
};
