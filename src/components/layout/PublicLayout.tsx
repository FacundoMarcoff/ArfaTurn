import React from 'react';
import { ShieldCheck, Store } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FAF8F2] text-[#24352C] flex flex-col font-sans selection:bg-[#E8CDA8]/40 selection:text-[#24352C]">
      {/* Top Header for Client */}
      <header className="border-b border-[#E8E2D8] bg-white/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#28634C] flex items-center justify-center font-bold text-[#FAF8F2] shadow-xs">
              <Store className="w-4 h-4 text-[#E8CDA8]" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-[#24352C] tracking-tight leading-tight">
                {orgName}
              </h1>
              <p className="text-[11px] text-[#5E7166] capitalize flex items-center gap-1.5">
                <span>{industry}</span>
                <span>·</span>
                <span className="text-[#28634C] font-semibold">Reserva Online</span>
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#5E7166] font-medium bg-[#F7EFE4] px-3 py-1.5 rounded-full border border-[#E8CDA8]/60">
            <ShieldCheck className="w-3.5 h-3.5 text-[#28634C]" />
            <span>Turnos en tiempo real</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E2D8] py-8 text-center text-xs text-[#5E7166]">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <ShieldCheck className="w-4 h-4 text-[#28634C]" />
          <span className="text-[#24352C] font-medium">Reserva confirmada al instante</span>
        </div>
        <p className="text-[#5E7166]/80 text-[11px]">Potenciado por TurnoPro · {orgName}</p>
      </footer>

      <OfflineIndicator />
    </div>
  );
};
