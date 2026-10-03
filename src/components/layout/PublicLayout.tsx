import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Store } from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { OfflineIndicator } from '../pwa/OfflineIndicator';

interface PublicLayoutProps {
  children: React.ReactNode;
  orgName?: string;
  industry?: string;
  logoUrl?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  orgName = 'TurnoPro',
  industry = 'Servicios',
}) => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 flex flex-col font-sans selection:bg-[#EBF2EE] selection:text-[#2F4F3E]">
      {/* Top Header for Client */}
      <header className="border-b border-[#E8E2D8] bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6B8F7D] flex items-center justify-center font-bold text-white shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-stone-900 tracking-tight leading-tight">
                {orgName}
              </h1>
              <p className="text-[11px] text-stone-500 capitalize flex items-center gap-1.5">
                <span>{industry}</span>
                <span>·</span>
                <span className="text-[#4A725D] font-medium">Reservas Online</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton />
            <Link
              to="/admin/calendar"
              className="text-xs text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-xl border border-[#E0D8CC] hover:bg-[#F2ECE4] transition font-medium"
              title="Acceso para el personal del comercio"
            >
              Panel Comercio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E2D8] py-8 text-center text-xs text-stone-500">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <ShieldCheck className="w-4 h-4 text-[#6B8F7D]" />
          <span className="text-stone-600 font-medium">Reserva confirmada en tiempo real</span>
        </div>
        <p className="text-stone-400">Potenciado por TurnoPro · Plataforma para comercios y profesionales independientes</p>
      </footer>

      <OfflineIndicator />
    </div>
  );
};
