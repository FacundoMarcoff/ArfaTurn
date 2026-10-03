import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Building2,
  ShieldCheck,
  Shield,
  Sliders,
  Sparkles,
  ArrowRight,
  Package,
  ReceiptText,
  Clock,
  RefreshCw,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { getIndustryInfo } from '../../lib/constants/industries';
import { AccountRubroModal } from '../auth/AccountRubroModal';

export const RubroAccountBanner: React.FC = () => {
  const { currentOrg, currentBranch, currentRole, branches, userOrganizations, currentUser } = useTenant();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const indInfo = getIndustryInfo(currentOrg.industry);
  const config = currentOrg.account_config;
  const isMonoRole = config?.delegation_mode === 'single';
  const orgBranches = branches.filter((b) => b.organization_id === currentOrg.id);
  const maxBranches = config?.max_branches ?? 1;

  const hasMultipleAccounts = userOrganizations.length > 1 || currentUser?.is_superadmin;

  return (
    <>
      <div className="bg-gradient-to-r from-white via-[#FCFAF7] to-white dark:from-[#201D1B] dark:via-[#24201E] dark:to-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] p-4 sm:p-5 shadow-xs transition">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Rubro & Account Info */}
          <div className="flex items-start gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs border border-[#E4DDD2] dark:border-[#352F2B] bg-[#FAF7F2] dark:bg-[#1A1817]"
            >
              {indInfo.emoji}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${indInfo.badgeBg} ${indInfo.badgeText}`}
                >
                  <span>Rubro:</span>
                  <span>{indInfo.name}</span>
                </span>

                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#FAF7F2] dark:bg-[#282421] text-stone-600 dark:text-stone-300 border border-[#E8E2D8] dark:border-[#38322E]">
                  {isMonoRole ? '⚡ Modo Mono-Rol (1 Titular)' : '👥 6 Roles de Delegación'}
                </span>

                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#FAF7F2] dark:bg-[#282421] text-stone-600 dark:text-stone-300 border border-[#E8E2D8] dark:border-[#38322E]">
                  🏢 {orgBranches.length} de {maxBranches} sucursal(es)
                </span>

                {config?.subscription_type === 'vitalicio' ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <span>⭐</span>
                    <span>Socio Vitalicio</span>
                  </span>
                ) : config?.subscription_type === 'demo_7d' ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                    <span>⏱️</span>
                    <span>Demo 1 Semana</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <span>📅</span>
                    <span>{config?.subscription_label || 'Plan Activo'}</span>
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight">
                  {currentOrg.name}
                </h2>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  Sucursal actual: <strong className="text-stone-800 dark:text-stone-200">{currentBranch.name}</strong>
                </span>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs font-medium text-stone-500 capitalize">
                  Rol activo: <span className="font-semibold text-[#5E836F] dark:text-[#A7C8B5]">{currentRole}</span>
                </span>
              </div>

              {/* Modules & Feature Badges */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-stone-500 dark:text-stone-400">
                <span className="font-medium text-stone-400">Módulos habilitados:</span>
                <span className={`px-1.5 py-0.2 rounded font-medium ${config?.enabled_modules?.inventory ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'bg-stone-100 text-stone-400 line-through'}`}>
                  Stock
                </span>
                <span className={`px-1.5 py-0.2 rounded font-medium ${config?.enabled_modules?.sales_pos ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'bg-stone-100 text-stone-400 line-through'}`}>
                  Caja POS
                </span>
                <span className={`px-1.5 py-0.2 rounded font-medium ${config?.enabled_modules?.audit ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'bg-stone-100 text-stone-400 line-through'}`}>
                  Auditoría
                </span>
                <span className={`px-1.5 py-0.2 rounded font-medium ${config?.enabled_modules?.deposits ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'bg-stone-100 text-stone-400 line-through'}`}>
                  Señas Online
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            {hasMultipleAccounts && (
              <button
                onClick={() => setShowSwitchModal(true)}
                className="py-2 px-3 rounded-xl bg-white dark:bg-[#1E1C1A] hover:bg-[#FAF7F2] dark:hover:bg-[#282421] text-xs font-semibold text-stone-700 dark:text-stone-200 border border-[#E8E2D8] dark:border-[#352F2B] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Cambiar de comercio o rubro asignado"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#5E836F]" />
                <span>Cambiar Rubro / Comercio</span>
              </button>
            )}

            <Link
              to={`/admin/accounts?org=${currentOrg.id}`}
              className="py-2 px-3 rounded-xl bg-[#FAF7F2] dark:bg-[#282421] hover:bg-[#F2ECE4] dark:hover:bg-[#302B27] text-xs font-semibold text-stone-700 dark:text-stone-200 border border-[#E0D8CC] dark:border-[#3D3530] flex items-center gap-1.5 transition shadow-2xs"
              title="Configurar delegación de roles, sucursales y permisos de este comercio"
            >
              <Sliders className="w-3.5 h-3.5 text-[#5E836F]" />
              <span className="hidden sm:inline">Configurar Cuenta & Roles</span>
              <span className="sm:hidden">Configurar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Account & Rubro Switcher Modal */}
      <AccountRubroModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
      />
    </>
  );
};
