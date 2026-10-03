import React from 'react';
import { Calendar, Apple, ExternalLink } from 'lucide-react';
import {
  CalendarEventData,
  getGoogleCalendarUrl,
  openAppleOrICS,
} from '../../lib/availability/calendar-sync';

interface AddToCalendarButtonsProps {
  event: CalendarEventData;
  filenamePrefix?: string;
  className?: string;
  buttonSize?: 'sm' | 'md';
}

export const AddToCalendarButtons: React.FC<AddToCalendarButtonsProps> = ({
  event,
  filenamePrefix = 'turno',
  className = '',
  buttonSize = 'md',
}) => {
  const googleUrl = getGoogleCalendarUrl(event);

  const handleAppleClick = () => {
    openAppleOrICS(event, filenamePrefix);
  };

  const isSmall = buttonSize === 'sm';

  return (
    <div className={`flex flex-col sm:flex-row gap-2.5 items-stretch ${className}`}>
      {/* Botón Google Calendar */}
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 font-semibold transition shadow-xs ${
          isSmall ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-xs sm:text-sm'
        }`}
        title="Abrir y guardar automáticamente en Google Calendar"
      >
        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
          G
        </span>
        <span>Google Calendar</span>
        <ExternalLink className="w-3 h-3 text-stone-400 ml-0.5" />
      </a>

      {/* Botón Apple / Outlook / Celular */}
      <button
        type="button"
        onClick={handleAppleClick}
        className={`flex items-center justify-center gap-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold transition shadow-xs cursor-pointer ${
          isSmall ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-xs sm:text-sm'
        }`}
        title="Guardar en Apple Calendar (iPhone/Mac) o descargar para Outlook"
      >
        <Apple className="w-4 h-4" />
        <span>Apple Calendar / Celular</span>
      </button>
    </div>
  );
};
