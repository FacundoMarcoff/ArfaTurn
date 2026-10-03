import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Store,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Sliders,
  Scissors,
  Check,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { getIndustryInfo } from '../../lib/constants/industries';

interface AccountRubroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountRubroModal: React.FC<AccountRubroModalProps> = ({ isOpen, onClose }) => {
  const {
    currentOrg,
    userOrganizations,
    organizations,
    currentUser,
    branches,
    switchOrganization,
    switchRole,
  } = useTenant();

  if (!isOpen) return null;

  // If user is superadmin or has memberships, get the list
  const availableAccounts = userOrganizations.length > 0
    ? userOrganizations
    : organizations.map((org) => ({
        organization: org,
        membership: {
          id: `mem-${org.id}`,
          organization_id: org.id,
          user_id: currentUser?.id || 'anon',
          role: 'owner' as const,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF2EE] dark:bg-[#203026] text-[11px] font-bold text-[#3B6652] dark:text-[#A1CEB5] border border-[#D5E3DB] dark:border-[#2D4537]">
              <Store className="w-3 h-3" />
              <span>Acceso Multi-Cuenta & Multi-Rubro</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">
              Tus Comercios y Rubros Asignados
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Seleccioná a qué comercio querés ingresar para visualizar su rubro, turnero y configuración específica.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-[#FAF7F2] dark:hover:bg-[#2A2624] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accounts / Rubros Grid */}
        <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1">
          {availableAccounts.map(({ organization, membership }) => {
            const indInfo = getIndustryInfo(organization.industry);
            const isCurrent = organization.id === currentOrg.id;
            const orgBranches = branches.filter((b) => b.organization_id === organization.id);
            const mode = organization.account_config?.delegation_mode || 'full';
            const maxBranches = organization.account_config?.max_branches ?? 1;

            return (
              <div
                key={organization.id}
                onClick={() => {
                  switchOrganization(organization.id);
                  switchRole(membership.role);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between space-y-3 group ${
                  isCurrent
                    ? 'border-[#5E836F] bg-[#FAF7F2] dark:bg-[#24211F] ring-2 ring-[#5E836F]/20'
                    : 'border-[#E8E2D8] dark:border-[#2D2825] bg-white dark:bg-[#1C1A18] hover:border-[#5E836F] hover:bg-[#FAF7F2] dark:hover:bg-[#24211F]'
                }`}
              >
                <div className="space-y-2">
                  {/* Rubro badge & current indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${indInfo.badgeBg} ${indInfo.badgeText}`}
                    >
                      <span>{indInfo.emoji}</span>
                      <span>{indInfo.name.split(' ')[0]}</span>
                    </span>

                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3B6652] dark:text-[#A1CEB5] bg-[#EBF2EE] dark:bg-[#203026] px-2 py-0.5 rounded-full border border-[#D5E3DB] dark:border-[#2D4537]">
                        <Check className="w-3 h-3" />
                        <span>Activo</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 capitalize">
                        Rol: {membership.role}
                      </span>
                    )}
                  </div>

                  {/* Business Name */}
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white group-hover:text-[#5E836F] transition">
                      {organization.name}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                      {indInfo.name}
                    </p>
                  </div>

                  {/* Delegation & Branches details */}
                  <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825] grid grid-cols-2 gap-2 text-[10px] text-stone-500 dark:text-stone-400">
                    <div>
                      <span className="block text-stone-400 font-semibold">Delegación:</span>
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {mode === 'single' ? 'Mono-Rol (1 Rol)' : '6 Roles de delegación'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-stone-400 font-semibold">Sucursales:</span>
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {orgBranches.length} de {maxBranches} habilitada(s)
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-[#252220] border border-[#E8E2D8] dark:border-[#38322E] text-stone-600 dark:text-stone-300 font-medium">
                    Vigencia: {organization.account_config?.subscription_label || 'Plan Activo'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-stone-400">
                    Moneda: {organization.currency}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#5E836F] group-hover:translate-x-0.5 transition">
                    <span>{isCurrent ? 'Permanecer aquí' : 'Ingresar a este Rubro'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#2D2825] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <Link
            to="/admin/accounts"
            onClick={onClose}
            className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white inline-flex items-center gap-1.5 font-semibold"
          >
            <Sliders className="w-3.5 h-3.5 text-[#5E836F]" />
            <span>Configurar estructura de cuentas y delegación</span>
          </Link>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-100 dark:bg-[#2A2624] text-stone-700 dark:text-stone-300 font-semibold hover:bg-stone-200 dark:hover:bg-[#332E2B] transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
