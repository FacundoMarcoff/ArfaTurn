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
  const [expanded, setExpanded] = useState(false);

  const indInfo = getIndustryInfo(currentOrg.industry);
  const config = currentOrg.account_config;
  const isMonoRole = config?.delegation_mode === 'single';
  const orgBranches = branches.filter((b) => b.organization_id === currentOrg.id);
  const maxBranches = config?.max_branches ?? 1;

  const hasMultipleAccounts = userOrganizations.length > 1 || currentUser?.is_superadmin;

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-3 sm:px-4 sm:py-3 shadow-xs transition">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Essential context only */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0 p-1 bg-[#FAF8F2] rounded-xl border border-[#E8E2D8]">
              {indInfo.emoji}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-[#24352C] truncate">
                  {currentOrg.name}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F7EFE4] text-[#28634C] border border-[#E8CDA8]/60">
                  {indInfo.name}
                </span>
                <span className="text-xs text-[#5E7166] hidden md:inline">
                  · Sucursal: <strong className="text-[#24352C]">{currentBranch.name}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions & Toggle */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            {hasMultipleAccounts && (
              <button
                type="button"
                onClick={() => setShowSwitchModal(true)}
                className="py-1.5 px-3 rounded-xl bg-[#FAF8F2] hover:bg-[#F2ECE4] text-[#24352C] border border-[#E8E2D8] flex items-center gap-1.5 font-medium transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#28634C]" />
                <span className="hidden sm:inline">Cambiar Comercio</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="py-1.5 px-2.5 rounded-xl text-[#5E7166] hover:text-[#24352C] hover:bg-[#FAF8F2] transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{expanded ? 'Menos info' : 'Detalles de cuenta'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Secondary Info (Progressive Disclosure) */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-4 flex-wrap text-xs text-[#5E7166]">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="px-2.5 py-1 rounded-md bg-[#FAF8F2] border border-[#E8E2D8] text-[#24352C] font-medium">
                {orgBranches.length} {orgBranches.length === 1 ? 'sucursal activa' : 'sucursales activas'}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#F7EFE4] text-[#28634C] border border-[#E8CDA8]/60 font-semibold">
                Estado: {config?.subscription_type === 'vitalicio' ? 'Licencia Vitalicia' : config?.subscription_label || 'Activa'}
              </span>
            </div>

            <span className="text-[11px] text-[#5E7166]">
              TurnoPro para Negocios
            </span>
          </div>
        )}
      </div>

      {/* Account & Rubro Switcher Modal */}
      <AccountRubroModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
      />
    </>
  );
};
