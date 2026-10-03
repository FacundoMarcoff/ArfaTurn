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
    (p) => p.organization_id === currentOrg.id && (!p.branch_ids || p.branch_ids.includes(currentBranch.id))
  );

  // Appointments filtered by branch and date
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (appt.organization_id !== currentOrg.id) return false;
      if (appt.branch_id !== currentBranch.id) return false;
      if (selectedProfFilter !== 'all' && appt.professional_id !== selectedProfFilter) return false;

      // Filter by current date in day view
      if (viewMode === 'day') {
        const apptDateStr = appt.starts_at.split('T')[0];
        return apptDateStr === selectedDateStr;
      }
      return true;
    });
  }, [appointments, currentOrg.id, currentBranch.id, selectedProfFilter, viewMode, selectedDateStr]);

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
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EAF2ED] dark:bg-[#203026] text-[#2F4F3E] dark:text-[#A1CEB5] border border-[#D5E3DB] dark:border-[#2E4738]">Confirmado</span>;
      case 'checked_in':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EEF3F8] dark:bg-[#1E2A34] text-[#34536E] dark:text-[#9DC3E2] border border-[#D3E1EC] dark:border-[#2E4252]">Presente</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F4EFF8] dark:bg-[#2B2035] text-[#553E6E] dark:text-[#C7B2E2] border border-[#E0D5EB] dark:border-[#423252]">En Atención</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F2ECE4] dark:bg-[#2A2624] text-stone-600 dark:text-stone-300 border border-[#E0D8CC] dark:border-[#38332F]">Completado</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDF2F0] dark:bg-[#331E1B] text-[#9E4B3E] dark:text-[#EAA399] border border-[#ECD3CC] dark:border-[#4E2B25]">Cancelado</span>;
      case 'pending_payment':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FEF8ED] dark:bg-[#332A1C] text-[#8C6B32] dark:text-[#E8C78A] border border-[#F3E5CB] dark:border-[#4D3F28]">Seña Pendiente</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F2ECE4] dark:bg-[#2A2624] text-stone-600 dark:text-stone-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Rubro & Account Identification Banner */}
      <RubroAccountBanner />

      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#201D1B] p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">Agenda Operativa</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[#EBF2EE] dark:bg-[#25382D] text-[#335946] dark:text-[#A1CEB5] border border-[#D5E3DB] dark:border-[#314A3B]">
              {currentBranch.name}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Gestión en tiempo real de turnos, check-in, estados de atención y reprogramaciones.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center bg-[#F7F3EC] dark:bg-[#282421] p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-[#201D1B] text-[#335946] dark:text-[#A1CEB5] shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#201D1B] text-[#335946] dark:text-[#A1CEB5] shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Lista
            </button>
          </div>

          {/* Public booking link buttons */}
          <div className="flex items-center gap-1.5">
            <a
              href={`/reservar/${currentOrg.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] bg-[#FAF7F2] dark:bg-[#282421] hover:bg-[#F2ECE4] dark:hover:bg-[#352F2B] text-xs font-semibold text-stone-700 dark:text-stone-200 transition shadow-2xs"
              title="Abrir página pública donde los clientes reservan sus turnos"
            >
              <Globe className="w-3.5 h-3.5 text-[#335946] dark:text-[#A1CEB5]" />
              <span>Ver Turnero Web</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>

            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/reservar/${currentOrg.slug}`;
                navigator.clipboard.writeText(url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] bg-white dark:bg-[#201D1B] hover:bg-[#FAF7F2] dark:hover:bg-[#282421] text-xs font-semibold text-stone-600 dark:text-stone-300 transition cursor-pointer"
              title="Copiar link para enviar por WhatsApp o redes sociales"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] text-emerald-600 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-[11px]">Copiar Link</span>
                </>
              )}
            </button>
          </div>

          {/* New manual appointment */}
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6B8F7D] hover:bg-[#587969] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Turno</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Date Navigation & Professional Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#201D1B] p-4 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl border border-[#E8E2D8] dark:border-[#2D2825] hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
          >
            <ChevronLeft className="w-4 h-4 text-stone-600 dark:text-stone-300" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] dark:border-[#2D2825] text-xs font-semibold hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
          >
            Hoy
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl border border-[#E8E2D8] dark:border-[#2D2825] hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
          >
            <ChevronRight className="w-4 h-4 text-stone-600 dark:text-stone-300" />
          </button>

          <div className="text-sm font-semibold text-stone-800 dark:text-stone-100 ml-2">
            {selectedDate.toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Filter by Professional */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={selectedProfFilter}
            onChange={(e) => setSelectedProfFilter(e.target.value)}
            className="bg-[#FAF7F2] dark:bg-[#282421] border border-[#E4DDD2] dark:border-[#352F2B] text-xs font-medium rounded-xl px-3 py-2 text-stone-700 dark:text-stone-200 focus:outline-[#5E836F]"
          >
            <option value="all">Todos los profesionales ({branchProfessionals.length})</option>
            {branchProfessionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
                            className={`p-3.5 rounded-2xl border bg-white dark:bg-[#201D1B] shadow-xs transition hover:shadow-sm space-y-2.5 ${
                              appt.status === 'in_progress'
                                ? 'border-[#C4848F] ring-2 ring-[#C4848F]/20'
                                : appt.status === 'cancelled'
                                ? 'border-[#E8E2D8] dark:border-[#2D2825] opacity-60'
                                : 'border-[#E8E2D8] dark:border-[#2D2825]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-stone-900 dark:text-white flex items-center gap-1.5 tabular-nums">
                                <Clock className="w-3.5 h-3.5 text-[#6B8F7D]" />
                                {startTime} - {endTime} hs
                              </span>
                              {renderStatusBadge(appt.status)}
                            </div>

                            <div>
                              <div className="font-semibold text-xs text-stone-800 dark:text-stone-100 flex items-center justify-between">
                                <span>{cust?.full_name || 'Cliente'}</span>
                                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 tabular-nums">
                                  ${appt.total_amount.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-400 mt-0.5">
                                {cust?.phone}
                              </p>
                              {appt.customer_notes && (
                                <p className="text-[10px] text-[#8C5D45] dark:text-[#E2A688] bg-[#FAF2ED] dark:bg-[#2D211C] p-2 rounded-lg mt-1 italic border border-[#ECD9CE] dark:border-[#422F26]">
                                  "{appt.customer_notes}"
                                </p>
                              )}
                            </div>

                            {/* Action progression bar */}
                            <div className="pt-2 border-t border-[#EFE9DF] dark:border-[#2D2825] flex items-center justify-between gap-1.5">
                              {appt.status === 'confirmed' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'checked_in')}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#EBF2EE] dark:bg-[#25382D] text-[#335946] dark:text-[#A1CEB5] hover:bg-[#DFECE3] text-[10px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Check-in</span>
                                </button>
                              )}

                              {appt.status === 'checked_in' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'in_progress')}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#F4EFF8] dark:bg-[#2E203A] text-[#553E6E] dark:text-[#CBB5E8] hover:bg-[#E8DEF2] text-[10px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <PlayCircle className="w-3 h-3" />
                                  <span>Iniciar</span>
                                </button>
                              )}

                              {appt.status === 'in_progress' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'completed')}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#FAF0ED] dark:bg-[#341F1A] text-[#9A4B3D] dark:text-[#EBA196] hover:bg-[#F2DFD9] text-[10px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Finalizar</span>
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
                                  className="py-1.5 px-2.5 rounded-lg border border-[#E4DDD2] dark:border-[#352F2B] text-stone-600 dark:text-stone-300 hover:bg-[#F7F3EC] dark:hover:bg-[#282421] text-[10px] font-medium transition cursor-pointer"
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
                                  className="p-1 rounded-lg text-stone-400 hover:text-[#9A4B3D] hover:bg-[#FDF2F0] dark:hover:bg-[#341F1A] transition"
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
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detalles sobre el turno o preferencias del cliente..."
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <h3 className="font-bold text-base text-stone-900 dark:text-white">Reprogramar Turno</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-stone-600 dark:text-stone-300">
                Seleccioná el nuevo día y horario para reprogramar el turno de forma atómica:
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nueva Fecha
                </label>
                <input
                  type="date"
                  value={rescheduleDateStr}
                  onChange={(e) => setRescheduleDateStr(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nuevo Horario
                </label>
                <input
                  type="time"
                  value={rescheduleTimeStr}
                  onChange={(e) => setRescheduleTimeStr(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825]">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-5 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition"
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
