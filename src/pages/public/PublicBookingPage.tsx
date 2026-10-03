import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  MapPin,
  CreditCard,
  CalendarCheck,
  Mail,
  Search,
  XCircle,
  AlertTriangle,
  ExternalLink,
  X,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { computeAvailableSlots, TimeSlot } from '../../lib/availability/engine';
import { Service, Professional, Branch, Appointment } from '../../types/database.types';
import { AddToCalendarButtons } from '../../components/calendar/AddToCalendarButtons';

export const PublicBookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    organizations,
    branches,
    services,
    professionals,
    workingHours,
    appointments,
    customers,
    createAppointment,
    cancelAppointment,
  } = useTenant();

  // Find organization by slug
  const org = organizations.find((o) => o.slug === slug) || organizations[0];
  const orgBranches = branches.filter((b) => b.organization_id === org.id && b.is_active);
  const orgServices = services.filter((s) => s.organization_id === org.id && s.is_active && s.is_public);
  const orgProfessionals = professionals.filter((p) => p.organization_id === org.id && p.is_active && p.is_public);

  // Flow steps
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Selections
  const [selectedBranchId, setSelectedBranchId] = useState<string>(orgBranches[0]?.id || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('any');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Customer form inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'onsite' | 'mercadopago'>('onsite');

  // Booking Result
  const [bookingResult, setBookingResult] = useState<{
    appointmentId: string;
    managementToken: string;
    startsAt: string;
    endsAt: string;
  } | null>(null);

  const [bookingError, setBookingError] = useState<string | null>(null);

  // View mode: 'booking' vs 'my-appointments'
  const [viewMode, setViewMode] = useState<'booking' | 'my-appointments'>('booking');
  const [searchEmail, setSearchEmail] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [cancellingApptId, setCancellingApptId] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Client appointments queried by email
  const clientAppointments = useMemo(() => {
    if (!searchEmail.trim()) return [];
    const cleanEmail = searchEmail.trim().toLowerCase();

    const matchingCustIds = new Set(
      customers
        .filter((c) => c.email && c.email.trim().toLowerCase() === cleanEmail)
        .map((c) => c.id)
    );

    return appointments
      .filter((a) => {
        if (a.organization_id !== org.id) return false;
        if (matchingCustIds.has(a.customer_id)) return true;
        const apptCustomer = customers.find((c) => c.id === a.customer_id);
        if (apptCustomer?.email && apptCustomer.email.trim().toLowerCase() === cleanEmail) return true;
        if (a.customer?.email && a.customer.email.trim().toLowerCase() === cleanEmail) return true;
        return false;
      })
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  }, [appointments, customers, org.id, searchEmail]);

  const handleClientCancel = (appointmentId: string) => {
    const res = cancelAppointment(appointmentId, 'Cancelado por el cliente desde el turnero web');
    if (res.success) {
      setCancelFeedback({
        type: 'success',
        message: 'Tu turno fue cancelado con éxito.',
      });
      setCancellingApptId(null);
    } else {
      setCancelFeedback({
        type: 'error',
        message: res.message || 'No se pudo cancelar el turno.',
      });
    }
  };

  const getApptDetails = (appt: Appointment) => {
    const s = appt.service || services.find((srv) => srv.id === (appt as any).service_id || srv.price === appt.total_amount);
    const p = professionals.find((prof) => prof.id === appt.professional_id);
    const b = branches.find((br) => br.id === appt.branch_id);
    const c = customers.find((cust) => cust.id === appt.customer_id);
    const start = new Date(appt.starts_at);
    const end = new Date(appt.ends_at);

    return {
      serviceName: s?.name || (appt.customer_notes?.slice(0, 30) ? `Servicio: ${appt.customer_notes.slice(0, 30)}` : 'Servicio Reservado'),
      profName: p?.display_name || 'Profesional Asignado',
      branchName: b?.name || org.name,
      branchAddress: b?.address || '',
      customerName: c?.full_name || '',
      start,
      end,
      totalAmount: appt.total_amount,
    };
  };

  // Derived objects
  const selectedBranch = orgBranches.find((b) => b.id === selectedBranchId) || orgBranches[0];
  const selectedService = orgServices.find((s) => s.id === selectedServiceId);
  const selectedProf = orgProfessionals.find((p) => p.id === selectedProfessionalId);

  // Group services by category
  const categorizedServices = useMemo(() => {
    const map: Record<string, Service[]> = {};
    for (const s of orgServices) {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    }
    return map;
  }, [orgServices]);

  // Compute available slots
  const availableSlots = useMemo(() => {
    if (!selectedBranch || !selectedService) return [];
    const dateObj = new Date(selectedDateStr + 'T00:00:00');
    return computeAvailableSlots({
      branch: selectedBranch,
      service: selectedService,
      selectedDate: dateObj,
      professionals: orgProfessionals,
      workingHours,
      appointments,
      selectedProfessionalId,
    });
  }, [selectedBranch, selectedService, selectedDateStr, orgProfessionals, workingHours, appointments, selectedProfessionalId]);

  // Submission handler
  const handleConfirmBooking = () => {
    if (!selectedBranch || !selectedService || !selectedSlot) return;
    setBookingError(null);

    const depositAmount = selectedService.deposit_amount || 0;
    const res = createAppointment({
      branchId: selectedBranch.id,
      professionalId: selectedSlot.professionalId,
      serviceId: selectedService.id,
      startsAt: selectedSlot.startsAt,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerNotes: customerNotes.trim() || undefined,
      depositPaid: paymentChoice === 'mercadopago' ? depositAmount : 0,
      paymentMethod: paymentChoice === 'mercadopago' ? 'mercadopago' : 'cash',
    });

    if (res.success && res.appointment) {
      setBookingResult({
        appointmentId: res.appointment.id,
        managementToken: res.appointment.management_token,
        startsAt: res.appointment.starts_at,
        endsAt: res.appointment.ends_at,
      });
      setStep(7);
    } else {
      setBookingError(res.message || 'Error al confirmar la reserva.');
    }
  };

  return (
    <PublicLayout orgName={org.name} industry={org.industry} logoUrl={org.logo_url}>
      {/* Top Switcher: Agendar Turno vs Mis Turnos */}
      <div className="flex items-center justify-center p-1 bg-[#F2ECE4] rounded-2xl max-w-xs sm:max-w-sm mx-auto mb-8 shadow-2xs border border-[#E8E2D8]">
        <button
          type="button"
          onClick={() => {
            setViewMode('booking');
            setCancelFeedback(null);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
            viewMode === 'booking'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Agendar Turno</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setViewMode('my-appointments');
            setCancelFeedback(null);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
            viewMode === 'my-appointments'
              ? 'bg-white text-[#5E836F] shadow-xs'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Mis Turnos</span>
        </button>
      </div>

      {viewMode === 'my-appointments' ? (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Card de Búsqueda por Email */}
          <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-7 shadow-xs space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#5E836F]" />
                <span>Mis Turnos en {org.name}</span>
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Ingresá el correo electrónico con el que agendaste para ver tus turnos pendientes, guardarlos en tu calendario o cancelarlos si lo necesitás.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchEmail.trim()) {
                  setHasSearched(true);
                  setCancellingApptId(null);
                }
              }}
              className="flex flex-col sm:flex-row gap-2.5 pt-1"
            >
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ej: tuemail@gmail.com"
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value);
                    setHasSearched(false);
                    setCancelFeedback(null);
                  }}
                  className="w-full bg-[#FAF7F2] border border-[#E4DDD2] rounded-xl pl-10 pr-3 py-2.5 text-xs text-stone-900 focus:outline-[#5E836F]"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Consultar Turnos</span>
              </button>
            </form>
          </div>

          {/* Feedback de Cancelación */}
          {cancelFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 border ${
                cancelFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {cancelFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{cancelFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelFeedback(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Resultados de Búsqueda */}
          {hasSearched && (
            <>
              {clientAppointments.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E8E2D8] p-8 text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-stone-900">
                      No encontramos turnos registrados
                    </h3>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      No hay ningún turno asociado a <strong className="text-stone-700">{searchEmail}</strong> en {org.name}. Verificá que el email esté escrito exactamente como cuando agendaste.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('booking');
                      setStep(1);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                  >
                    <span>Agendar un Turno Ahora</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Turnos Próximos / Pendientes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                        <span>Turnos Próximos</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#EBF2EE] text-[#3B6652] text-[10px] font-black">
                          {clientAppointments.filter((a) => a.status === 'confirmed' || a.status === 'in_progress').length}
                        </span>
                      </h3>
                    </div>

                    {clientAppointments.filter((a) => a.status === 'confirmed' || a.status === 'in_progress').length === 0 ? (
                      <div className="p-5 rounded-2xl bg-white border border-[#E8E2D8] text-center text-xs text-stone-500">
                        No tenés turnos activos o pendientes en este momento.
                      </div>
                    ) : (
                      clientAppointments
                        .filter((a) => a.status === 'confirmed' || a.status === 'in_progress')
                        .map((appt) => {
                          const details = getApptDetails(appt);
                          const isCancelling = cancellingApptId === appt.id;

                          return (
                            <div
                              key={appt.id}
                              className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-xs space-y-4 hover:border-stone-300 transition"
                            >
                              {/* Header Card */}
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-base text-stone-900">
                                      {details.serviceName}
                                    </h4>
                                    <span
                                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                        appt.status === 'confirmed'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                                      }`}
                                    >
                                      {appt.status === 'confirmed' ? 'Confirmado' : 'En Atención'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-500 mt-0.5">
                                    Con: <span className="font-medium text-stone-800">{details.profName}</span>
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="text-sm font-bold text-stone-900 tabular-nums">
                                    ${details.totalAmount.toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Horario y Lugar */}
                              <div className="grid sm:grid-cols-2 gap-2 text-xs bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EFE9DF]">
                                <div className="flex items-center gap-2 text-stone-700">
                                  <CalendarIcon className="w-4 h-4 text-[#5E836F] shrink-0" />
                                  <span className="capitalize font-medium">
                                    {details.start.toLocaleDateString('es-AR', {
                                      weekday: 'long',
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                    {' '}·{' '}
                                    {details.start.toLocaleTimeString('es-AR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })} hs
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-stone-700">
                                  <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                                  <span className="truncate">
                                    {details.branchName}
                                    {details.branchAddress && ` (${details.branchAddress})`}
                                  </span>
                                </div>
                              </div>

                              {/* Calendario 1-clic */}
                              <div className="pt-1">
                                <span className="text-[11px] font-semibold text-stone-500 block mb-2">
                                  Guardar en tu calendario:
                                </span>
                                <AddToCalendarButtons
                                  buttonSize="sm"
                                  event={{
                                    title: `${details.serviceName} · ${org.name}`,
                                    description: `Turno con ${details.profName} en ${details.branchName}. ${details.branchAddress}`,
                                    location: `${details.branchName}, ${details.branchAddress}`,
                                    startsAt: appt.starts_at,
                                    endsAt: appt.ends_at,
                                  }}
                                  filenamePrefix={`turno-${details.serviceName}`}
                                />
                              </div>

                              {/* Acciones del Turno / Cancelación */}
                              <div className="pt-3 border-t border-[#EFE9DF] flex flex-wrap items-center justify-between gap-2.5">
                                <Link
                                  to={`/mi-turno/${appt.management_token}`}
                                  className="text-xs text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 font-medium underline"
                                >
                                  <span>Enlace privado de gestión</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>

                                {!isCancelling ? (
                                  <button
                                    type="button"
                                    onClick={() => setCancellingApptId(appt.id)}
                                    className="px-3.5 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Cancelar Turno</span>
                                  </button>
                                ) : (
                                  <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in">
                                    <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                      <span>¿Confirmás que querés cancelar este turno?</span>
                                    </div>
                                    <p className="text-[11px] text-red-700">
                                      El horario quedará liberado para que otro cliente pueda reservarlo.
                                    </p>
                                    <div className="flex items-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleClientCancel(appt.id)}
                                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                                      >
                                        Sí, Cancelar Turno
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCancellingApptId(null)}
                                        className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition cursor-pointer"
                                      >
                                        Volver
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Historial de Turnos Cancelados o Pasados */}
                  {clientAppointments.some((a) => a.status === 'cancelled' || a.status === 'completed') && (
                    <div className="space-y-3 pt-4 border-t border-[#E8E2D8]">
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                        Turnos Anteriores o Cancelados
                      </h3>
                      {clientAppointments
                        .filter((a) => a.status === 'cancelled' || a.status === 'completed')
                        .map((appt) => {
                          const details = getApptDetails(appt);
                          return (
                            <div
                              key={appt.id}
                              className="bg-white/60 rounded-2xl border border-stone-200 p-4 flex items-center justify-between gap-3 text-xs opacity-75"
                            >
                              <div>
                                <span className="font-bold text-stone-800">
                                  {details.serviceName}
                                </span>
                                <div className="text-[11px] text-stone-500 capitalize">
                                  {details.start.toLocaleDateString('es-AR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}{' '}
                                  · {details.profName}
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  appt.status === 'cancelled'
                                    ? 'bg-stone-100 text-stone-600'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {appt.status === 'cancelled' ? 'Cancelado' : 'Completado'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Step Indicator */}
          {step < 7 && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-2.5">
            <span>Paso {step} de 6</span>
            <span className="font-semibold text-stone-800">
              {step === 1 && 'Sucursal'}
              {step === 2 && 'Servicio'}
              {step === 3 && 'Profesional'}
              {step === 4 && 'Día y Horario'}
              {step === 5 && 'Tus Datos'}
              {step === 6 && 'Confirmación'}
            </span>
          </div>
          <div className="w-full bg-[#E8E2D8] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#6B8F7D] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 1: BRANCH SELECTION */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Elegí la sucursal</h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">Seleccioná el local donde deseás atenderte:</p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 mt-4">
            {orgBranches.map((branch) => (
              <div
                key={branch.id}
                onClick={() => {
                  setSelectedBranchId(branch.id);
                  setStep(2);
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  selectedBranchId === branch.id
                    ? 'border-[#6B8F7D] bg-[#F2F7F4] shadow-xs'
                    : 'border-[#E4DDD2] bg-white hover:border-[#6B8F7D]/60 hover:bg-[#FAF7F2]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-stone-900 text-base">{branch.name}</h3>
                    <ChevronRight className="w-4 h-4 text-[#6B8F7D]" />
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6B8F7D] shrink-0" />
                    <span>{branch.address || branch.city || 'Buenos Aires'}</span>
                  </p>
                </div>
                {branch.deposit_required_pct > 0 && (
                  <div className="mt-4 inline-block text-[11px] font-semibold text-[#8C5D45] bg-[#F8EFEA] border border-[#ECD9CE] px-2.5 py-1 rounded-lg self-start">
                    Seña requerida: {branch.deposit_required_pct}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: SERVICE SELECTION */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Elegí tu servicio</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">En {selectedBranch?.name}</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cambiar sucursal</span>
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(categorizedServices).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">{category}</h3>
                <div className="grid gap-3">
                  {items.map((svc) => (
                    <div
                      key={svc.id}
                      onClick={() => {
                        setSelectedServiceId(svc.id);
                        setStep(3);
                      }}
                      className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                        selectedServiceId === svc.id
                          ? 'border-[#6B8F7D] bg-[#F2F7F4] shadow-xs'
                          : 'border-[#E4DDD2] bg-white hover:border-[#6B8F7D]/50 hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900 text-base">{svc.name}</h4>
                          {svc.deposit_amount > 0 && (
                            <span className="text-[10px] font-semibold text-[#8C5D45] bg-[#F8EFEA] border border-[#ECD9CE] px-2 py-0.5 rounded-md">
                              Seña ${svc.deposit_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {svc.description && (
                          <p className="text-xs text-stone-500 leading-relaxed max-w-xl">
                            {svc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-stone-500 pt-0.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#6B8F7D]" />
                            <span>{svc.duration_minutes} min</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-stone-100 sm:border-0">
                        <div className="text-lg font-bold text-stone-900 tabular-nums">
                          ${svc.price.toLocaleString()}
                        </div>
                        <button className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-[#6B8F7D] hover:bg-[#597868] text-white transition shadow-xs">
                          Elegir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: PROFESSIONAL SELECTION */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Elegí tu profesional</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{selectedService?.name}</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cambiar servicio</span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            {/* Any Available Option */}
            <div
              onClick={() => {
                setSelectedProfessionalId('any');
                setStep(4);
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                selectedProfessionalId === 'any'
                  ? 'border-[#6B8F7D] bg-[#F2F7F4] shadow-xs'
                  : 'border-[#E4DDD2] bg-white hover:border-[#6B8F7D]/50 hover:bg-[#FAF7F2]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#EBF2EE] text-[#335946] flex items-center justify-center font-bold text-sm">
                  ★
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Cualquier profesional</h4>
                  <p className="text-xs text-stone-500">Ver todos los horarios disponibles</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6B8F7D]" />
            </div>

            {/* Individual Professionals */}
            {orgProfessionals
              .filter(
                (p) =>
                  (!selectedService?.assigned_professional_ids ||
                    selectedService.assigned_professional_ids.includes(p.id)) &&
                  (!p.branch_ids || p.branch_ids.includes(selectedBranch?.id || ''))
              )
              .map((prof) => (
                <div
                  key={prof.id}
                  onClick={() => {
                    setSelectedProfessionalId(prof.id);
                    setStep(4);
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    selectedProfessionalId === prof.id
                      ? 'border-[#6B8F7D] bg-[#F2F7F4] shadow-xs'
                      : 'border-[#E4DDD2] bg-white hover:border-[#6B8F7D]/50 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-xs"
                      style={{ backgroundColor: prof.color_tag }}
                    >
                      {prof.display_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{prof.display_name}</h4>
                      <p className="text-xs text-stone-500">{prof.specialty || 'Especialista'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6B8F7D]" />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* STEP 4: DATE & TIME SLOT SELECTION */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Elegí fecha y horario</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                {selectedService?.name} · {selectedProf?.display_name || 'Cualquiera disponible'}
              </p>
            </div>
            <button
              onClick={() => setStep(3)}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
          </div>

          {/* Date Picker (Horizontal slider) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const dateStr = d.toISOString().split('T')[0];
              const isSelected = selectedDateStr === dateStr;
              const dayName = d.toLocaleDateString('es-AR', { weekday: 'short' });
              const dayNum = d.getDate();
              const monthName = d.toLocaleDateString('es-AR', { month: 'short' });

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedDateStr(dateStr);
                    setSelectedSlot(null);
                  }}
                  className={`flex flex-col items-center justify-center px-4 py-3 rounded-2xl border min-w-[76px] transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#6B8F7D] border-[#6B8F7D] text-white font-bold shadow-[0_2px_8px_rgba(107,143,125,0.3)]'
                      : 'bg-white border-[#E4DDD2] text-stone-600 hover:border-[#6B8F7D]/50 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider">{dayName}</span>
                  <span className="text-lg font-bold my-0.5 tabular-nums">{dayNum}</span>
                  <span className="text-[10px] capitalize">{monthName}</span>
                </button>
              );
            })}
          </div>

          {/* Slots Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#6B8F7D]" />
              <span>Horarios disponibles ({availableSlots.length})</span>
            </h3>

            {availableSlots.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8E2D8] p-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-[#C5A572] mx-auto" />
                <p className="font-semibold text-stone-800">No hay turnos disponibles para esta fecha</p>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Probá seleccionando otro día o eligiendo "Cualquier profesional" para ampliar la disponibilidad.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSlotSelected = selectedSlot?.startsAt === slot.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-2 rounded-xl text-center border font-bold text-sm transition cursor-pointer ${
                        isSlotSelected
                          ? 'bg-[#4A725D] border-[#4A725D] text-white shadow-sm'
                          : 'bg-white border-[#E4DDD2] text-stone-700 hover:border-[#6B8F7D] hover:bg-[#F2F7F4]'
                      }`}
                    >
                      <div className="tabular-nums">{slot.time} hs</div>
                      {selectedProfessionalId === 'any' && (
                        <div className="text-[10px] text-stone-400 truncate mt-0.5 font-normal">
                          {slot.professionalName.split(' ')[0]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedSlot && (
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(5)}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#6B8F7D] hover:bg-[#587969] text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Continuar con mis datos</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: CUSTOMER INFORMATION */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Tus datos de contacto</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Para enviarte la confirmación y el recordatorio de tu turno.
              </p>
            </div>
            <button
              onClick={() => setStep(4)}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cambiar horario</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 space-y-4 shadow-xs">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Martín García"
                className="w-full bg-[#FAF7F2] border border-[#E4DDD2] rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-[#6B8F7D]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej. +54 11 9876-5432"
                  className="w-full bg-[#FAF7F2] border border-[#E4DDD2] rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-[#6B8F7D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-[#FAF7F2] border border-[#E4DDD2] rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-[#6B8F7D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Observaciones o aclaraciones (Opcional)
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Ej. Preferencia de peinado, alergias, consulta previa..."
                className="w-full bg-[#FAF7F2] border border-[#E4DDD2] rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-[#6B8F7D]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={!customerName.trim() || !customerPhone.trim()}
              onClick={() => setStep(6)}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#6B8F7D] hover:bg-[#587969] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Revisar y Confirmar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: SUMMARY & DEPOSIT / PAYMENT */}
      {step === 6 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Resumen de tu reserva</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">Verificá los detalles antes de confirmar.</p>
            </div>
            <button
              onClick={() => setStep(5)}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Editar datos</span>
            </button>
          </div>

          {bookingError && (
            <div className="p-4 rounded-xl bg-[#FAF0ED] border border-[#ECD9D0] text-[#9A4B3D] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 divide-y divide-[#EFE9DF] space-y-4 shadow-xs">
            <div className="grid gap-3.5 sm:grid-cols-2 pb-4">
              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold">Servicio</span>
                <p className="font-bold text-stone-900 text-base">{selectedService?.name}</p>
                <p className="text-xs text-stone-500">{selectedService?.duration_minutes} min</p>
              </div>

              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold">Profesional</span>
                <p className="font-bold text-stone-900 text-base">{selectedSlot?.professionalName}</p>
                <p className="text-xs text-stone-500">En {selectedBranch?.name}</p>
              </div>

              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold">Fecha y Hora</span>
                <p className="font-bold text-[#4A725D] text-base tabular-nums">
                  {selectedDateStr} a las {selectedSlot?.time} hs
                </p>
              </div>

              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold">Cliente</span>
                <p className="font-bold text-stone-900 text-base">{customerName}</p>
                <p className="text-xs text-stone-500">{customerPhone}</p>
              </div>
            </div>

            {/* Pricing & Deposit */}
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Precio del servicio</span>
                <span className="text-stone-900 font-bold tabular-nums">${selectedService?.price.toLocaleString()}</span>
              </div>

              {selectedService && selectedService.deposit_amount > 0 ? (
                <div className="flex justify-between text-sm text-[#8C5D45] font-semibold">
                  <span>Seña requerida online</span>
                  <span className="tabular-nums">${selectedService.deposit_amount.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Pago</span>
                  <span className="text-[#4A725D] font-medium">Se abona al momento de la atención</span>
                </div>
              )}
            </div>

            {/* Payment Method Selector if Deposit is needed */}
            {selectedService && selectedService.deposit_amount > 0 && (
              <div className="pt-4 space-y-3">
                <span className="text-xs font-bold text-stone-700">Modalidad de Seña</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('mercadopago')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                      paymentChoice === 'mercadopago'
                        ? 'border-[#6B8F7D] bg-[#F2F7F4] text-stone-900 font-bold'
                        : 'border-[#E4DDD2] bg-[#FAF7F2] text-stone-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#6B8F7D]" />
                      <span className="text-xs">Pagar Seña con Mercado Pago</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('onsite')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition ${
                      paymentChoice === 'onsite'
                        ? 'border-[#6B8F7D] bg-[#F2F7F4] text-stone-900 font-bold'
                        : 'border-[#E4DDD2] bg-[#FAF7F2] text-stone-600'
                    }`}
                  >
                    <span className="text-xs">Abonar en el local al llegar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirmBooking}
            className="w-full py-3.5 rounded-xl bg-[#6B8F7D] hover:bg-[#587969] text-white font-bold text-base transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirmar Reserva</span>
          </button>
        </div>
      )}

      {/* STEP 7: SUCCESS CONFIRMATION & CALENDAR DOWNLOAD */}
      {step === 7 && bookingResult && (
        <div className="max-w-xl mx-auto space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#EBF2EE] text-[#4A725D] flex items-center justify-center mx-auto border border-[#D5E3DB]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">¡Turno Reservado con Éxito!</h2>
            <p className="text-sm text-stone-500">
              Te esperamos en {selectedBranch?.name}.
            </p>
          </div>

          {/* Ticket Card */}
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 text-left shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF]">
              <span className="text-xs text-stone-400">Código de Turno:</span>
              <span className="font-mono text-xs font-bold text-[#4A725D] bg-[#EBF2EE] px-2.5 py-0.5 rounded-md border border-[#D5E3DB]">
                #{bookingResult.appointmentId.slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-400">Servicio:</span>
                <span className="font-bold text-stone-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Profesional:</span>
                <span className="font-bold text-stone-900">{selectedSlot?.professionalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Fecha y Hora:</span>
                <span className="font-bold text-[#4A725D] tabular-nums">
                  {selectedDateStr} · {selectedSlot?.time} hs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Lugar:</span>
                <span className="text-stone-700 text-right max-w-xs">{selectedBranch?.address}</span>
              </div>
            </div>

            {/* Management Link Box */}
            <div className="pt-4 border-t border-[#EFE9DF]">
              <span className="text-xs text-stone-500 block mb-1 font-semibold">Enlace de gestión de tu turno:</span>
              <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E4DDD2] flex items-center justify-between gap-2">
                <span className="text-[11px] text-stone-600 font-mono truncate">
                  {window.location.origin}/mi-turno/{bookingResult.managementToken}
                </span>
                <Link
                  to={`/mi-turno/${bookingResult.managementToken}`}
                  className="shrink-0 px-3 py-1 rounded-lg bg-[#E0D8CC] hover:bg-[#D5CCBE] text-xs font-semibold text-stone-800 transition"
                >
                  Ver Turno
                </Link>
              </div>
              <p className="text-[11px] text-stone-400 mt-1.5">
                Con este enlace privado podés cancelar o reprogramar según las políticas de cancelación.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8E2D8] text-center space-y-3">
              <span className="text-xs font-bold text-stone-800 block">
                Agendá este turno a tu calendario con 1 solo toque:
              </span>
              <AddToCalendarButtons
                className="justify-center"
                event={{
                  title: `${selectedService?.name || 'Turno'} · ${org.name}`,
                  description: `Turno confirmado en ${selectedBranch?.name || ''}. Profesional: ${selectedSlot?.professionalName || 'Asignado'}. Notas: ${customerNotes}`,
                  location: `${selectedBranch?.name || ''}, ${selectedBranch?.address || ''}`,
                  startsAt: bookingResult.startsAt,
                  endsAt: bookingResult.endsAt,
                }}
                filenamePrefix={`turno-${selectedService?.name || 'reserva'}`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedSlot(null);
                  setBookingResult(null);
                  setViewMode('booking');
                }}
                className="px-5 py-3 rounded-xl bg-[#F2ECE4] hover:bg-[#EAE2D8] text-stone-700 font-semibold text-xs transition cursor-pointer"
              >
                Hacer otra reserva
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchEmail(customerEmail);
                  setHasSearched(true);
                  setViewMode('my-appointments');
                }}
                className="px-5 py-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-semibold text-xs transition cursor-pointer"
              >
                Ver todos mis turnos
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </PublicLayout>
  );
};
