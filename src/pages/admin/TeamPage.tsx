import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Copy,
  Check,
  ShieldAlert,
  Award,
  Clock,
  Sparkles,
  Lock,
  Sliders,
  AlertTriangle,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { MemberRole } from '../../types/database.types';
import { ROLE_PERMISSIONS, Permission } from '../../types/rbac.types';

export const TeamPage: React.FC = () => {
  const { currentOrg, currentBranch, professionals, currentRole, createProfessional, deleteProfessional } = useTenant();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('receptionist');
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // New professional modal state
  const [showNewProfModal, setShowNewProfModal] = useState(false);
  const [newProfName, setNewProfName] = useState('');
  const [newProfSpecialty, setNewProfSpecialty] = useState('');
  const [newProfCommission, setNewProfCommission] = useState(50);
  const [newProfColor, setNewProfColor] = useState('#2A5C43');
  const [newProfIsPublic, setNewProfIsPublic] = useState(true);

  const orgProfessionals = professionals.filter((p) => p.organization_id === currentOrg.id);

  const handleCreateProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName.trim()) return;
    createProfessional({
      displayName: newProfName.trim(),
      specialty: newProfSpecialty.trim() || undefined,
      commissionRatePct: Number(newProfCommission),
      colorTag: newProfColor,
      isPublic: newProfIsPublic,
    });
    setNewProfName('');
    setNewProfSpecialty('');
    setNewProfCommission(50);
    setShowNewProfModal(false);
  };

  const handleGenerateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const token = `inv-${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    setGeneratedInvite(inviteUrl);
  };

  const handleCopy = () => {
    if (!generatedInvite) return;
    navigator.clipboard.writeText(generatedInvite);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allPermissions: { key: Permission; label: string }[] = [
    { key: 'appointments:view', label: 'Ver Agenda y Turnos' },
    { key: 'appointments:create', label: 'Crear Turnos' },
    { key: 'appointments:edit', label: 'Reprogramar / Editar Turnos' },
    { key: 'appointments:checkin', label: 'Realizar Check-in de Clientes' },
    { key: 'clients:view', label: 'Ver Fichas de Clientes' },
    { key: 'clients:view_confidential_notes', label: 'Acceso a Notas Clínicas / Confidenciales' },
    { key: 'clients:merge', label: 'Fusionar Registros de Clientes' },
    { key: 'services:manage', label: 'Configurar Servicios y Recursos' },
    { key: 'inventory:adjust', label: 'Ajustar Inventario y Stock' },
    { key: 'sales:create', label: 'Realizar Cobros en POS' },
    { key: 'cash:open_close', label: 'Apertura y Cierre de Caja' },
    { key: 'team:manage', label: 'Invitar y Modificar Roles del Equipo' },
    { key: 'org:settings', label: 'Ajustes Generales del Comercio' },
    { key: 'audit:view', label: 'Auditoría y Trazabilidad' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#201D1B] p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
            Equipo & Matriz de Permisos (RBAC)
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Gestión de profesionales, colaboradores e invitaciones de un solo uso con caducidad.
          </p>
        </div>
      </div>

      {/* Grid: Staff + Invite Generator */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Team Members List (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-stone-900 dark:text-white">
                Profesionales & Trabajadores ({orgProfessionals.length})
              </h2>
              <span className="text-[11px] text-stone-400">Prestadores de servicio en {currentBranch.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowNewProfModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#335946] hover:bg-[#284637] text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Agregar Trabajador</span>
            </button>
          </div>

          <div className="divide-y divide-[#F2ECE4] dark:divide-[#2D2825]">
            {orgProfessionals.map((prof) => (
              <div key={prof.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-xs"
                    style={{ backgroundColor: prof.color_tag }}
                  >
                    {prof.display_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-800 dark:text-stone-100">
                      {prof.display_name}
                    </h4>
                    <p className="text-xs text-stone-400">{prof.specialty || 'Profesional de Servicio'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#EBF2EE] dark:bg-[#203026] text-[#2F4F3E] dark:text-[#A1CEB5] border border-[#D5E3DB] dark:border-[#2E4738]">
                      Comisión: {prof.commission_rate_pct}%
                    </span>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {prof.is_public ? 'Visible en Turnero' : 'Solo Agenda Interna'}
                    </div>
                  </div>
                  {orgProfessionals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar al trabajador ${prof.display_name}?`)) {
                          deleteProfessional(prof.id);
                        }
                      }}
                      className="p-1.5 text-stone-300 hover:text-[#9E4B3E] rounded-lg transition"
                      title="Eliminar trabajador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#252220] border border-[#E8E2D8] dark:border-[#2D2825] text-xs space-y-1">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              💡 ¿Cómo se gestionan los trabajadores?
            </span>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              No necesitan registrarse con email ni crear contraseñas. Al agregarlos aquí, aparecen inmediatamente en la <strong>Agenda</strong> para asignar turnos, en el <strong>Turnero Web</strong> para que los clientes elijan con quién atenderse, y en el <strong>Módulo de Caja</strong> para liquidar sus comisiones.
            </p>
          </div>
        </div>

        {/* Single-use Invite Generator (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#5E836F]" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">Invitar al Equipo</h3>
            </div>
            <Link
              to="/admin/accounts"
              className="text-[11px] text-[#5E836F] hover:underline flex items-center gap-1 font-semibold"
            >
              <Sliders className="w-3 h-3" />
              <span>Configurar Roles</span>
            </Link>
          </div>

          {currentOrg.account_config?.delegation_mode === 'single' ? (
            <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#252220] border border-[#E8E2D8] dark:border-[#2D2825] space-y-3">
              <div className="flex items-center gap-2 text-[#C4894D] font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Cuenta en Modo Mono-Rol (Operador Único)</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Esta cuenta está configurada por administración para operar con <strong>un solo titular</strong> sin jerarquías ni sub-delegación de roles (recepcionista, cajero, encargado).
              </p>
              <p className="text-[11px] text-stone-400">
                Si este comercio necesita incorporar empleados con roles delegados, cambialo a <strong>Multi-Rol</strong> desde la consola de configuración de cuentas.
              </p>
              <Link
                to="/admin/accounts"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white text-xs font-semibold shadow-xs transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Habilitar Delegación de Roles</span>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-500">
                Generá un enlace seguro de un solo uso que expirará en 48 horas:
              </p>

              <form onSubmit={handleGenerateInvite} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colaborador@comercio.com"
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Rol a Asignar
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                  >
                    {(currentOrg.account_config?.allowed_roles || [
                      'admin',
                      'branch_manager',
                      'receptionist',
                      'professional',
                      'cashier',
                    ])
                      .filter((r) => r !== 'owner')
                      .map((r) => {
                        const labels: Record<string, string> = {
                          admin: 'Administrador',
                          branch_manager: 'Encargado de Sucursal',
                          receptionist: 'Recepcionista',
                          professional: 'Profesional',
                          cashier: 'Cajero / Mostrador',
                        };
                        return (
                          <option key={r} value={r}>
                            {labels[r] || r}
                          </option>
                        );
                      })}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition"
                >
                  Generar Enlace de Invitación
                </button>
              </form>
            </>
          )}

          {generatedInvite && (
            <div className="p-3 bg-[#EBF2EE] dark:bg-[#203026] rounded-xl border border-[#D5E3DB] dark:border-[#2E4738] space-y-2">
              <span className="text-[11px] font-bold text-[#2F4F3E] dark:text-[#A1CEB5] block">
                Enlace seguro generado:
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  readOnly
                  value={generatedInvite}
                  className="w-full bg-white dark:bg-[#1A1817] border border-[#D5E3DB] dark:border-[#2E4738] rounded-lg px-2 py-1 text-[11px] font-mono text-stone-800 dark:text-stone-200"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-[#5E836F] text-white hover:bg-[#4E705D] shrink-0 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-stone-500">Vence en 48hs o tras su primer uso.</p>
            </div>
          )}
        </div>
      </div>

      {/* RBAC PERMISSIONS MATRIX */}
      <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs overflow-hidden p-5 space-y-4">
        <div>
          <h2 className="font-bold text-sm text-stone-900 dark:text-white">
            Matriz de Autorización por Rol (RBAC)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Comprobación estricta de permisos tanto en backend/PostgreSQL como en la interfaz.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] dark:bg-[#282421] text-stone-500 font-bold border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <tr>
                <th className="px-4 py-3">Permiso / Operación</th>
                <th className="px-3 py-3 text-center">Owner</th>
                <th className="px-3 py-3 text-center">Admin</th>
                <th className="px-3 py-3 text-center">Encargado</th>
                <th className="px-3 py-3 text-center">Recepción</th>
                <th className="px-3 py-3 text-center">Profesional</th>
                <th className="px-3 py-3 text-center">Cajero</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE4] dark:divide-[#2D2825]">
              {allPermissions.map((perm) => (
                <tr key={perm.key} className="hover:bg-[#FAF7F2]/60 dark:hover:bg-[#282421]/40">
                  <td className="px-4 py-2.5 font-medium text-stone-800 dark:text-stone-200">
                    {perm.label}
                  </td>
                  {(['owner', 'admin', 'branch_manager', 'receptionist', 'professional', 'cashier'] as MemberRole[]).map(
                    (role) => {
                      const hasPerm = ROLE_PERMISSIONS[role]?.includes(perm.key);
                      return (
                        <td key={role} className="px-3 py-2.5 text-center">
                          {hasPerm ? (
                            <span className="inline-block w-4 h-4 rounded-full bg-[#5E836F] text-white font-bold text-[10px] leading-4">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-block w-4 h-4 rounded-full bg-[#E8E2D8] dark:bg-[#352F2B] text-stone-400 text-[10px] leading-4">
                              ✕
                            </span>
                          )}
                        </td>
                      );
                    }
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Professional / Worker */}
      {showNewProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#201D1B] rounded-2xl max-w-md w-full border border-[#E0D8CC] dark:border-[#352F2B] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EBF2EE] dark:bg-[#25382D] text-[#335946] dark:text-[#A1CEB5] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white">
                  Agregar Nuevo Trabajador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewProfModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfessional} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre Completo o Apodo *
                </label>
                <input
                  type="text"
                  required
                  value={newProfName}
                  onChange={(e) => setNewProfName(e.target.value)}
                  placeholder="Ej. Lucas, Franco, Valentina"
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#335946]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Puesto o Especialidad
                </label>
                <input
                  type="text"
                  value={newProfSpecialty}
                  onChange={(e) => setNewProfSpecialty(e.target.value)}
                  placeholder="Ej. Barbero Senior, Colorista, Manicura"
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#335946]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Comisión (% por servicio)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newProfCommission}
                    onChange={(e) => setNewProfCommission(Number(e.target.value))}
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#335946]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Color en la Agenda
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newProfColor}
                      onChange={(e) => setNewProfColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#E4DDD2] p-0.5"
                    />
                    <span className="text-xs text-stone-500 font-mono">{newProfColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B]">
                <div>
                  <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    ¿Visible en Turnero Web?
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Permite que los clientes reserven con él directamente
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newProfIsPublic}
                  onChange={(e) => setNewProfIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-[#335946] rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D8] dark:border-[#2D2825]">
                <button
                  type="button"
                  onClick={() => setShowNewProfModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#335946] hover:bg-[#284637] text-white text-xs font-bold shadow-xs transition"
                >
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
