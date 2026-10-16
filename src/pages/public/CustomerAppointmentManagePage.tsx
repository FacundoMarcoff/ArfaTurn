import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Download,
  XCircle,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { generateICS } from '../../lib/availability/engine';
import { AddToCalendarButtons } from '../../components/calendar/AddToCalendarButtons';

export const CustomerAppointmentManagePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const {
    appointments,
    services,
    professionals,
    branches,
    organizations,
    customers,
    cancelAppointment,
  } = useTenant();

  const [message, setMessage] = useState<string | null>(null);

  // Find appointment by secure token
  const appointment = appointments.find((a) => a.management_token === token);

  if (!appointment) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-[#C5A572] mx-auto" />
          <h2 className="text-xl font-bold text-stone-900">Enlace de Turno Inválido o Expirado</h2>
          <p className="text-xs text-stone-500">
            No encontramos una reserva activa asociada a este enlace seguro. Verificá el enlace o realizá una nueva reserva.
          </p>
          <Link
            to="/"
            className="inline-block mt-4 px-4 py-2.5 rounded-xl bg-[#6B8F7D] hover:bg-[#587969] text-white font-semibold text-xs shadow-xs"
          >
            Ir al inicio
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const org = organizations.find((o) => o.id === appointment.organization_id);
  const branch = branches.find((b) => b.id === appointment.branch_id);
  const professional = professionals.find((p) => p.id === appointment.professional_id);
  const customer = customers.find((c) => c.id === appointment.customer_id);

  // Parse dates
  const startDate = new Date(appointment.starts_at);
  const now = new Date();
  const hoursUntilAppointment = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  const canCancel =
    appointment.status !== 'cancelled' &&
    appointment.status !== 'completed' &&
    hoursUntilAppointment > (branch?.cancel_window_hours || 12);

  const handleCancel = () => {
    if (confirm('¿Estás seguro de que deseás cancelar este turno?')) {
      const res = cancelAppointment(appointment.id, 'Cancelado por el cliente desde el portal público');
      if (res.success) {
        setMessage('Turno cancelado exitosamente.');
      }
    }
  };

  const handleDownloadICS = () => {
    const ics = generateICS({
      title: `Turno en ${org?.name || 'Comercio'}`,
      description: `Turno de servicio con ${professional?.display_name || 'Profesional'}`,
      location: `${branch?.name || ''}, ${branch?.address || ''}`,
      startsAt: appointment.starts_at,
      endsAt: appointment.ends_at,
    });

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mi-turno.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatus = () => {
    switch (appointment.status) {
      case 'confirmed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F7EFE4] text-[#28634C] border border-[#E8CDA8]/60">
            Confirmado
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Cancelado
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            En Atención
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            Completado
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F2] text-stone-700 border border-[#E8E2D8]">
            {appointment.status}
          </span>
        );
    }
  };

  return (
    <PublicLayout orgName={org?.name} industry={org?.industry}>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-[#24352C] tracking-tight">Gestión de tu Turno</h2>
          {renderStatus()}
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#E8E2D8]">
            <div className="w-12 h-12 rounded-2xl bg-[#F7EFE4] text-[#28634C] flex items-center justify-center font-bold border border-[#E8CDA8]/60">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-[#5E7166]">Fecha y Hora</p>
              <h3 className="text-base sm:text-lg font-bold text-[#24352C] tabular-nums">
                {startDate.toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                · {startDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
              </h3>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-[#5E7166]">Comercio:</span>
              <span className="font-semibold text-[#24352C]">{org?.name}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-[#5E7166]">Sucursal:</span>
              <span className="font-semibold text-[#24352C]">{branch?.name}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-[#5E7166]">Dirección:</span>
              <span className="text-[#24352C]">{branch?.address}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-[#5E7166]">Profesional:</span>
              <span className="font-semibold text-[#24352C]">{professional?.display_name}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-[#5E7166]">Cliente:</span>
              <span className="font-semibold text-[#24352C]">{customer?.full_name}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-[#5E7166]">Importe total:</span>
              <span className="font-bold text-[#28634C] tabular-nums">${appointment.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#E8E2D8] space-y-2 text-center">
            <span className="text-xs font-semibold text-[#24352C] block">
              Guardar en tu calendario personal:
            </span>
            <AddToCalendarButtons
              className="justify-center"
              event={{
                title: `Turno en ${org?.name || 'Comercio'}`,
                description: `Turno con ${professional?.display_name || 'Profesional'}. Lugar: ${branch?.name || ''}, ${branch?.address || ''}`,
                location: `${branch?.name || ''}, ${branch?.address || ''}`,
                startsAt: appointment.starts_at,
                endsAt: appointment.ends_at,
              }}
              filenamePrefix={`turno-${org?.name || 'reserva'}`}
            />
          </div>

          {canCancel ? (
            <button
              onClick={handleCancel}
              className="w-full py-3 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-700 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancelar mi Turno</span>
            </button>
          ) : (
            appointment.status !== 'cancelled' && (
              <p className="text-[11px] text-[#5E7166] text-center">
                La política de cancelación requiere al menos {branch?.cancel_window_hours || 12}hs de anticipación.
                Para reprogramaciones o dudas, por favor comunicate por WhatsApp al comercio.
              </p>
            )
          )}
        </div>
      </div>
    </PublicLayout>
  );
};
