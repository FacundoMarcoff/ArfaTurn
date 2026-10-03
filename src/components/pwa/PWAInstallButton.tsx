import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
        title="Instalar TurnoPro como App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-[#E0D8CC] dark:border-[#38322D] px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-[#F2ECE4] dark:hover:bg-[#282320] transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#5E836F]" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#201D1B] border border-[#E8E2D8] dark:border-[#332D29]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
                <h3 className="font-semibold text-stone-900 dark:text-white">Instalar en iPhone / iPad</h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                1. Tocá el botón <strong>Compartir</strong> en la barra inferior de Safari.<br />
                2. Deslizá hacia abajo y seleccioná <strong>Agregar a pantalla de inicio</strong>.<br />
                3. Abrí TurnoPro directamente como app nativa sin barra de navegación.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#5E836F] hover:bg-[#4E705D] py-2.5 text-sm font-semibold text-white transition shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
