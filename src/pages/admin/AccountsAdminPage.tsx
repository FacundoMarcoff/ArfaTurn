import React, { useState } from 'react';
import {
  Building2,
  Store,
  Plus,
  Key,
  Eye,
  EyeOff,
  Crown,
  CheckCircle2,
  X,
  Sparkles,
  Shield,
  Calendar,
  Layers,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { getIndustryInfo } from '../../lib/constants/industries';
import { Organization, Profile, SubscriptionType } from '../../types/database.types';

export const AccountsAdminPage: React.FC = () => {
  const {
    organizations,
    profiles,
    memberships,
    updateOrganizationSubscription,
    createOrganization,
    deleteOrganization,
    updateUserProfile,
    currentUser,
  } = useTenant();

  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);

  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Formulario de nueva cuenta
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgIndustry, setNewOrgIndustry] = useState<Organization['industry']>('salon');
  const [newOrgUsername, setNewOrgUsername] = useState('');
  const [newOrgPassword, setNewOrgPassword] = useState('password123');
  const [newOrgIsVitalicia, setNewOrgIsVitalicia] = useState(true);

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleToggleVitalicia = (org: Organization) => {
    const isCurrentlyVitalicia = org.account_config?.subscription_type === 'vitalicio';
    const newType: SubscriptionType = isCurrentlyVitalicia ? '6_months' : 'vitalicio';
    updateOrganizationSubscription(org.id, newType);
    showFeedback(
      `Suscripción de ${org.name} actualizada a: ${
        newType === 'vitalicio' ? 'Socio Vitalicio (Sin Vencimiento)' : 'Plan 6 Meses'
      }.`
    );
  };

  const handleCreateOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgUsername.trim()) return;

    createOrganization({
      name: newOrgName.trim(),
      industry: newOrgIndustry,
      username: newOrgUsername.trim().toLowerCase(),
      password: newOrgPassword || 'password123',
      ownerFullName: `Titular ${newOrgName}`,
      subscriptionType: newOrgIsVitalicia ? 'vitalicio' : '6_months',
      maxBranches: 1,
      delegationMode: 'full',
    });

    setShowNewOrgModal(false);
    setNewOrgName('');
    setNewOrgUsername('');
    setNewOrgPassword('password123');
    setNewOrgIsVitalicia(true);
    showFeedback(`Comercio ${newOrgName} creado exitosamente.`);
  };

  const adminProfile = profiles.find((p) => p.username === 'admin' || p.is_superadmin);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-[#201D1B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#5E836F] dark:text-[#A7C8B5] text-xs font-bold uppercase tracking-wider">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Panel de Administración SaaS (Nosotros)</span>
          </div>
          <h1 className="text-2xl font-serif font-black text-stone-900 dark:text-[#F3EFEA] mt-1">
            Gestión de Cuentas y Accesos
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Administración centralizada de usuarios, contraseñas y estado de suscripción vitalicia para los negocios de la plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewOrgModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Dar de Alta Nuevo Negocio</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-[#EBF2EE] dark:bg-[#203026] border border-[#D5E3DB] dark:border-[#2E4738] text-[#2F4F3E] dark:text-[#A1CEB5] text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5E836F]" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Tarjeta Cuenta Admin (Nosotros) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-[#5E836F] dark:border-[#7FA690] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#5E836F] text-amber-200 flex items-center justify-center font-bold text-xl shadow-xs">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-stone-900 dark:text-white">
                  Mi Cuenta de Administrador (Nosotros)
                </h2>
                <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                Acceso administrativo total para gestionar las cuentas y credenciales de TurnoPro.
              </p>
            </div>
          </div>

          {adminProfile && (
            <button
              type="button"
              onClick={() => {
                setEditingUserId(adminProfile.id);
                setNewPasswordVal(adminProfile.password || 'admin123');
              }}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#201D1B] border border-[#E8E2D8] dark:border-[#332D29] hover:border-[#5E836F] text-stone-800 dark:text-stone-200 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Key className="w-3.5 h-3.5 text-[#5E836F]" />
              <span>Modificar Mi Contraseña</span>
            </button>
          )}
        </div>

        {adminProfile && (
          <div className="grid sm:grid-cols-3 gap-3 bg-white/80 dark:bg-[#201D1B]/80 p-4 rounded-2xl border border-[#E8E2D8] dark:border-[#352F2B] text-xs">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase">Usuario</span>
              <div className="font-mono font-bold text-stone-900 dark:text-white mt-0.5">
                @{adminProfile.username}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase">Email</span>
              <div className="text-stone-600 dark:text-stone-300 mt-0.5">{adminProfile.email}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase">Contraseña</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-stone-900 dark:text-white">
                  {showPasswordMap[adminProfile.id] ? adminProfile.password || 'admin123' : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordMap((prev) => ({
                      ...prev,
                      [adminProfile.id]: !prev[adminProfile.id],
                    }))
                  }
                  className="text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPasswordMap[adminProfile.id] ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Cuentas de Negocios Clientes */}
      <div className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] dark:border-[#2D2825]">
          <div>
            <h2 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-[#5E836F]" />
              <span>Negocios Clientes Registrados ({organizations.length})</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Cada usuario tiene asignado únicamente su propio negocio. Podés ver o editar su usuario, contraseña y modalidad vitalicia.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {organizations.map((org) => {
            const indInfo = getIndustryInfo(org.industry);
            const isVitalicia = org.account_config?.subscription_type === 'vitalicio';
            const mem = memberships.find((m) => m.organization_id === org.id && m.role === 'owner');
            const userProfile = profiles.find((p) => p.id === mem?.user_id) || profiles.find((p) => p.username === org.account_config?.owner_username);
            const userPass = userProfile?.password || org.account_config?.owner_password || 'password123';
            const username = userProfile?.username || org.account_config?.owner_username || 'usuario';
            const isPassVisible = userProfile ? showPasswordMap[userProfile.id] : false;

            return (
              <div
                key={org.id}
                className="p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] bg-[#FAF7F2] dark:bg-[#1A1817] hover:border-[#5E836F] transition space-y-4 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#201D1B] border border-[#E8E2D8] dark:border-[#332D29] flex items-center justify-center text-lg shadow-2xs">
                      {indInfo.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                          {org.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-[#201D1B] border border-[#E8E2D8] dark:border-[#352F2B] text-stone-600 dark:text-stone-300 capitalize">
                          {indInfo.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {org.contact_email || 'Sin correo registrado'} · ID: <code className="font-mono">{org.id}</code>
                      </p>
                    </div>
                  </div>

                  {/* Estado de Suscripción Vitalicia */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleVitalicia(org)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        isVitalicia
                          ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                          : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                      title="Clic para cambiar entre Vitalicia y Temporal"
                    >
                      <span>{isVitalicia ? '⭐ Socio Vitalicio' : '⏱️ Plan 6 Meses'}</span>
                      <span className="text-[10px] underline font-normal">(Cambiar)</span>
                    </button>
                  </div>
                </div>

                {/* Fila de Datos de Acceso */}
                <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#2D2825] grid sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Usuario de Acceso</span>
                    <div className="font-mono font-bold text-stone-900 dark:text-white mt-0.5">
                      @{username}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Contraseña</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-stone-900 dark:text-white">
                        {isPassVisible ? userPass : '••••••••'}
                      </span>
                      {userProfile && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordMap((prev) => ({
                              ...prev,
                              [userProfile.id]: !prev[userProfile.id],
                            }))
                          }
                          className="text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {isPassVisible ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {userProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserId(userProfile.id);
                          setNewPasswordVal(userPass);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#201D1B] border border-[#E8E2D8] dark:border-[#352F2B] hover:border-[#5E836F] text-stone-700 dark:text-stone-300 font-semibold text-xs transition cursor-pointer shadow-2xs"
                      >
                        Modificar Contraseña
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingOrg(org)}
                      className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                      title="Eliminar esta cuenta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Cuenta</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: DAR DE ALTA NUEVO NEGOCIO */}
      {showNewOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#5E836F]" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  Dar de Alta Nuevo Negocio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewOrgModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrgSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre del Negocio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Peluquería Don Juan"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgUsername) {
                      setNewOrgUsername(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '')
                          .slice(0, 15)
                      );
                    }
                  }}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Rubro *
                </label>
                <select
                  value={newOrgIndustry}
                  onChange={(e) => setNewOrgIndustry(e.target.value as any)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-stone-900 dark:text-white focus:outline-[#5E836F]"
                >
                  <option value="salon">💇 Peluquería & Salón</option>
                  <option value="barbershop">💈 Barbería</option>
                  <option value="spa">🧖 Estética & Spa</option>
                  <option value="consultorio">🦷 Odontología / Salud</option>
                  <option value="general">✨ Servicios Generales</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Usuario de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="usuario"
                    value={newOrgUsername}
                    onChange={(e) => setNewOrgUsername(e.target.value)}
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-stone-900 dark:text-white font-mono focus:outline-[#5E836F]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="password123"
                    value={newOrgPassword}
                    onChange={(e) => setNewOrgPassword(e.target.value)}
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-stone-900 dark:text-white font-mono focus:outline-[#5E836F]"
                  />
                </div>
              </div>

              {/* ¿Es cuenta Vitalicia? */}
              <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825]">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E8E2D8] dark:border-[#352F2B]">
                  <input
                    type="checkbox"
                    checked={newOrgIsVitalicia}
                    onChange={(e) => setNewOrgIsVitalicia(e.target.checked)}
                    className="rounded text-[#5E836F] w-4 h-4 accent-[#5E836F]"
                  />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white block">
                      Cuenta Vitalicia (Sin Vencimiento)
                    </span>
                    <span className="text-[10px] text-stone-500">
                      Suscripción permanente sin fecha límite de expiración.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#2D2825] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrgModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#E8E2D8] text-stone-600 hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold cursor-pointer shadow-xs"
                >
                  Guardar Negocio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODIFICAR CONTRASEÑA */}
      {editingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#5E836F]" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  Modificar Contraseña
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUserId(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const target = profiles.find((p) => p.id === editingUserId);
              if (!target) return null;
              return (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPasswordVal.trim()) return;
                    updateUserProfile(target.id, { password: newPasswordVal.trim() });
                    showFeedback(`Contraseña para @${target.username} actualizada correctamente.`);
                    setEditingUserId(null);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block text-stone-500 text-[11px] mb-1">
                      Usuario: <strong>@{target.username}</strong> ({target.full_name})
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nueva contraseña"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-stone-900 dark:text-white font-mono text-sm focus:outline-[#5E836F]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="px-3 py-1.5 rounded-xl border border-[#E8E2D8] text-stone-600 hover:bg-[#FAF7F2] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold shadow-xs cursor-pointer"
                    >
                      Guardar Contraseña
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN DE CUENTA */}
      {deletingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#201D1B] rounded-3xl border border-red-200 dark:border-red-900 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white leading-tight">
                  ¿Eliminar cuenta de {deletingOrg.name}?
                </h3>
                <span className="text-[11px] text-red-500 font-medium">Esta acción no se puede deshacer</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-xs text-stone-600 dark:text-stone-300 space-y-2">
              <p>
                Estás a punto de borrar definitivamente este negocio de la plataforma:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-500 dark:text-stone-400">
                <li>Se eliminará el acceso del usuario titular.</li>
                <li>Se borrarán todos sus turnos, servicios y clientes asociados.</li>
                <li>Se cancelará cualquier suscripción registrada.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingOrg(null)}
                className="px-4 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const orgName = deletingOrg.name;
                  deleteOrganization(deletingOrg.id);
                  setDeletingOrg(null);
                  showFeedback(`Cuenta de "${orgName}" eliminada correctamente.`);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Cuenta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
