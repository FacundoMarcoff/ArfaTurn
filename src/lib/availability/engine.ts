import {
  Branch,
  Service,
  Professional,
  WorkingHour,
  Appointment,
} from '../../types/database.types';

export interface TimeSlot {
  time: string;           // "10:30"
  startsAt: string;       // ISO 8601 string
  endsAt: string;         // ISO 8601 string
  professionalId: string;
  professionalName: string;
  serviceId: string;
  durationMinutes: number;
}

export interface AvailabilityParams {
  branch: Branch;
  service: Service;
  selectedDate: Date;
  professionals: Professional[];
  workingHours: WorkingHour[];
  appointments: Appointment[];
  selectedProfessionalId?: string | 'any'; // 'any' means any available
}

export function computeAvailableSlots(params: AvailabilityParams): TimeSlot[] {
  const {
    branch,
    service,
    selectedDate,
    professionals,
    workingHours,
    appointments,
    selectedProfessionalId = 'any',
  } = params;

  const dayOfWeek = selectedDate.getDay(); // 0 is Sunday, 1 is Monday ...

  // Find eligible professionals for this service and branch
  const eligibleProfessionals = professionals.filter((prof) => {
    if (!prof.is_active || !prof.is_public) return false;
    // Check branch assignment
    if (prof.branch_ids && !prof.branch_ids.includes(branch.id)) return false;
    // Check service assignment
    if (service.assigned_professional_ids && !service.assigned_professional_ids.includes(prof.id)) {
      return false;
    }
    // Filter if user specifically selected one professional
    if (selectedProfessionalId !== 'any' && prof.id !== selectedProfessionalId) {
      return false;
    }
    return true;
  });

  if (eligibleProfessionals.length === 0) return [];

  // Find working hours for branch
  const branchHours = workingHours.find(
    (wh) => wh.branch_id === branch.id && wh.day_of_week === dayOfWeek && wh.is_enabled && !wh.professional_id
  );

  if (!branchHours) return [];

  const [openH, openM] = branchHours.open_time.split(':').map(Number);
  const [closeH, closeM] = branchHours.close_time.split(':').map(Number);

  const totalDuration = service.duration_minutes + (service.prep_buffer_minutes || 0) + (service.clean_buffer_minutes || 0);
  const stepMinutes = 30; // standard 30 min intervals

  const availableSlots: TimeSlot[] = [];
  const now = new Date();

  // Helper to parse "HH:MM" on selectedDate into a Date object
  const makeDate = (h: number, m: number): Date => {
    const d = new Date(selectedDate);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const openDate = makeDate(openH, openM);
  const closeDate = makeDate(closeH, closeM);

  // Check minimum advance minutes
  const minBookingTime = new Date(now.getTime() + (branch.min_advance_minutes || 60) * 60000);

  // Parse breaks if any
  let breakStartDate: Date | null = null;
  let breakEndDate: Date | null = null;
  if (branchHours.break_start && branchHours.break_end) {
    const [bsh, bsm] = branchHours.break_start.split(':').map(Number);
    const [beh, bem] = branchHours.break_end.split(':').map(Number);
    breakStartDate = makeDate(bsh, bsm);
    breakEndDate = makeDate(beh, bem);
  }

  // Iterate over step intervals
  let cursor = new Date(openDate);

  while (cursor.getTime() + totalDuration * 60000 <= closeDate.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + service.duration_minutes * 60000);
    const totalSlotEnd = new Date(cursor.getTime() + totalDuration * 60000);

    // Is it in the past or under min advance notice?
    if (slotStart.getTime() > minBookingTime.getTime()) {
      // Check break overlap
      let overlapsBreak = false;
      if (breakStartDate && breakEndDate) {
        if (slotStart < breakEndDate && totalSlotEnd > breakStartDate) {
          overlapsBreak = true;
        }
      }

      if (!overlapsBreak) {
        // Find if ANY eligible professional is free at this slot
        for (const prof of eligibleProfessionals) {
          // Check existing appointments for this professional
          const hasConflict = appointments.some((appt) => {
            if (appt.professional_id !== prof.id) return false;
            if (['cancelled', 'expired', 'no_show'].includes(appt.status)) return false;

            const apptStart = new Date(appt.starts_at);
            const apptEnd = new Date(appt.ends_at);

            // Overlap check [A, B) overlaps with [C, D) if A < D and B > C
            return slotStart < apptEnd && totalSlotEnd > apptStart;
          });

          if (!hasConflict) {
            const timeStr = `${String(slotStart.getHours()).padStart(2, '0')}:${String(
              slotStart.getMinutes()
            ).padStart(2, '0')}`;

            // Check if slot with this time is already added (if selecting "any", one slot per time is enough or track assigned)
            const alreadyHasSlot = availableSlots.some((s) => s.time === timeStr && s.professionalId === prof.id);

            if (!alreadyHasSlot) {
              availableSlots.push({
                time: timeStr,
                startsAt: slotStart.toISOString(),
                endsAt: slotEnd.toISOString(),
                professionalId: prof.id,
                professionalName: prof.display_name,
                serviceId: service.id,
                durationMinutes: service.duration_minutes,
              });
            }

            // If selected 'any', one professional match per time slot is sufficient
            if (selectedProfessionalId === 'any') {
              break;
            }
          }
        }
      }
    }

    // Advance cursor
    cursor = new Date(cursor.getTime() + stepMinutes * 60000);
  }

  return availableSlots;
}

// Generate standard RFC 5545 iCalendar (.ics) string for customer download
export function generateICS(appointment: {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
}): string {
  const formatDate = (dateString: string): string => {
    const d = new Date(dateString);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TurnoPro//NONSGML v1.0//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@turnopro.app`,
    `DTSTAMP:${formatDate(new Date().toISOString())}`,
    `DTSTART:${formatDate(appointment.startsAt)}`,
    `DTEND:${formatDate(appointment.endsAt)}`,
    `SUMMARY:${appointment.title}`,
    `DESCRIPTION:${appointment.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${appointment.location.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return icsLines.join('\r\n');
}
