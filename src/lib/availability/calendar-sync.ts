import { generateICS } from './engine';

export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
}

/**
 * Formats a date string into UTC format required by Google Calendar URL: YYYYMMDDTHHmmssZ
 */
export function formatGoogleCalendarDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Returns a direct 1-click URL to add the appointment to Google Calendar.
 * When opened, Google Calendar launches immediately with the event ready to save.
 */
export function getGoogleCalendarUrl(event: CalendarEventData): string {
  const start = formatGoogleCalendarDate(event.startsAt);
  const end = formatGoogleCalendarDate(event.endsAt);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Downloads or triggers opening the .ics calendar file for Apple Calendar (iOS / macOS),
 * Outlook, or Android native calendar applications.
 */
export function openAppleOrICS(event: CalendarEventData, filenamePrefix: string = 'turno'): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanTitle = (filenamePrefix || 'turno').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.setAttribute('download', `${cleanTitle}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}
