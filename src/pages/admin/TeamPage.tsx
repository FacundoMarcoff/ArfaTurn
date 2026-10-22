import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Trash2,
  X,
  Sparkles,
  Scissors,
  CheckCircle2,
  Info,
  Calendar,
  DollarSign,
  Globe,
  Lock,
  Search,
  Plus,
  Edit,
  ChevronDown,
  User,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { MemberRole } from '../../types/database.types';

export const TeamPage: React.FC = () => {
  const {
    currentOrg,
    currentBranch,
    professionals,
    profiles,
    memberships,
    createProfessional,
    deleteProfessional,
  } = useTenant();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'professional' | 'receptionist' | 'admin'>('professional');
  const [specialty, setSpecialty] = useState('');
  const [commission, setCommission] = useState(50);
  const [color, setColor] = useState('#28634C');
  const [isPublic, setIsPublic] = useState(true);

  // Access credentials (optional)
  const [enableLogin, setEnableLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Active filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'professional' | 'receptionist'>('all');
  const [teamSearch, setTeamSearch] = useState('');

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const orgProfessionals = professionals.filter((p) => p.organization_id === currentOrg.id);

  // Find linked profile if any for a professional
  const getLinkedProfile = (prof: typeof professionals[0]) => {
    if (prof.member_id) {
      const mem = memberships.find((m) => m.id === prof.member_id);
      if (mem) {
        return profiles.find((p) => p.id === mem.user_id);
      }
    }
    // Match by display name or username
    return profiles.find(
      (p) =>
        p.full_name?.toLowerCase() === prof.display_name.toLowerCase() ||
        p.username?.toLowerCase() === prof.display_name.toLowerCase()
    );
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createProfessional({
      displayName: name.trim(),
      specialty: specialty.trim() || (role === 'admin' ? 'Administrador' : role === 'receptionist' ? 'Recepción' : 'Profesional'),
      commissionRatePct: role === 'receptionist' ? 0 : Number(commission),
      colorTag: color,
      isPublic: role === 'receptionist' ? false : isPublic,
      role: role as MemberRole,
      username: enableLogin && username.trim() ? username.trim().toLowerCase() : undefined,
      password: enableLogin && password.trim() ? password.trim() : undefined,
    });

    // Reset & close
    setName('');
    setSpecialty('');
    setCommission(50);
    setColor('#28634C');
    setIsPublic(true);
    setEnableLogin(false);
    setUsername('');
    setPassword('');
    setShowModal(false);
  };

  // Filtered list
  const filteredList = orgProfessionals.filter((prof) => {
    if (activeTab === 'all') return true;
    const linked = getLinkedProfile(prof);
    const profRole = linked?.is_superadmin ? 'admin' : (prof.member_id ? 'professional' : 'professional');
    return profRole === activeTab || (activeTab === 'professional' && !linked);
  });

  // Role pill styling helper
  const renderRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'admin':
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF4ED] text-[#A6632B] border border-[#ECD9C6]">
            Administrador
          </span>
        );
      case 'receptionist':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF0F6] text-[#2F618F] border border-[#CBDCE9]">
            Recepción
          </span>
        );
      case 'professional':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF2EC] text-[#28634C] border border-[#CFDFD3]">
            Profesional
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#24352C] tracking-tight">
            Equipo
          </h1>
          <p className="text-xs text-[#5E7166] mt-0.5">
            {orgProfessionals.length} {orgProfessionals.length === 1 ? 'profesional' : 'profesionales'} · {currentBranch.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#CCD6D0] bg-white hover:bg-[#FAF8F2] text-xs font-bold text-[#24352C] transition shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#28634C]" />
          <span>Agregar miembro</span>
        </button>
      </div>

      {/* Toolbar: Pills on left, Search on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#EAF2EC] text-[#28634C] shadow-2xs'
                : 'bg-white text-[#5E7166] border border-[#CCD6D0] hover:bg-[#FAF8F2]'
            }`}
          >
            Todos ({orgProfessionals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('professional')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'professional'
                ? 'bg-[#EAF2EC] text-[#28634C] shadow-2xs'
                : 'bg-white text-[#5E7166] border border-[#CCD6D0] hover:bg-[#FAF8F2]'
            }`}
          >
            Profesionales ({orgProfessionals.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#5E7166] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
            placeholder="Buscar por nombre o puesto"
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#CCD6D0] rounded-xl text-xs text-[#24352C] placeholder-[#5E7166]/70 focus:outline-[#28634C] shadow-2xs"
          />
        </div>
      </div>

      {/* 2-Column Split: Table (7 cols) & Roles guide (5 cols) */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Left: Members Table (7 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F2]/60 text-[#5E7166] font-semibold border-b border-[#E8E2D8]">
                <tr>
                  <th className="px-4 py-3">Miembro</th>
                  <th className="px-3 py-3">Puesto</th>
                  <th className="px-3 py-3">Tipo de cuenta</th>
                  <th className="px-3 py-3">Comisión</th>
                  <th className="px-3 py-3">Visible en turnero</th>
                  <th className="px-3 py-3">Acceso</th>
                  <th className="px-3 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]/60">
                {orgProfessionals
                  .filter((p) =>
                    p.display_name.toLowerCase().includes(teamSearch.toLowerCase()) ||
                    (p.specialty && p.specialty.toLowerCase().includes(teamSearch.toLowerCase()))
                  )
                  .map((prof) => (
                    <tr key={prof.id} className="hover:bg-[#FAF8F2]/50 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#E5E0D8] text-[#24352C] font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(prof.display_name)}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#24352C]">
                              {prof.display_name}
                            </p>
                            <p className="text-[11px] text-[#5E7166]">
                              {prof.specialty || 'Profesional'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 font-medium text-[#24352C]">
                        {prof.specialty || 'Estilista'}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2EC] text-[#28634C]">
                          Profesional
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-[#24352C] tabular-nums">
                        {prof.commission_rate_pct}%
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2EC] text-[#28634C]">
                          {prof.is_public ? 'Visible' : 'Oculto'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-xs text-[#5E7166]">
                        Solo prestador
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setName(prof.display_name);
                            setSpecialty(prof.specialty || '');
                            setCommission(prof.commission_rate_pct);
                            setShowModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#CCD6D0] hover:bg-[#FAF8F2] text-[11px] font-semibold text-[#24352C] transition cursor-pointer"
                        >
                          <Edit className="w-3 h-3 text-[#5E7166]" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Roles y permisos Card (4 cols) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#24352C]">
            Roles y permisos
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Administrador */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#FAF8F2] border border-[#E8E2D8] flex items-center justify-center shrink-0 text-[#28634C]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#24352C]">Administrador</p>
                <p className="text-[11px] text-[#5E7166] mt-0.5 leading-relaxed">
                  Gestiona el negocio. Acceso total al sistema.
                </p>
              </div>
            </div>

            {/* Profesional */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#FAF8F2] border border-[#E8E2D8] flex items-center justify-center shrink-0 text-[#28634C]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#24352C]">Profesional</p>
                <p className="text-[11px] text-[#5E7166] mt-0.5 leading-relaxed">
                  Consulta su agenda. Gestiona sus turnos.
                </p>
              </div>
            </div>

            {/* Recepción */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#FAF8F2] border border-[#E8E2D8] flex items-center justify-center shrink-0 text-[#28634C]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#24352C]">Recepción</p>
                <p className="text-[11px] text-[#5E7166] mt-0.5 leading-relaxed">
                  Gestiona turnos y cobros. Atiende clientes en el local.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center justify-between w-full pt-3 border-t border-[#E8E2D8] text-xs font-semibold text-[#5E7166] hover:text-[#24352C] transition cursor-pointer"
          >
            <span>Cómo dar acceso</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5E7166]" />
          </button>
        </div>
      </div>

      {/* Modal: Add Team Member */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E8E2D8] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#28634C]/10 text-[#28634C] flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#24352C]">Nuevo Miembro del Equipo</h3>
                  <p className="text-xs text-[#5E7166]">Completá los datos básicos del colaborador</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 transition p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#24352C] mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Lucas Fernández, Franco Gómez"
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#24352C] focus:outline-none focus:border-[#28634C] focus:ring-1 focus:ring-[#28634C]"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#24352C] mb-1.5">
                  Rol en el Negocio *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('professional');
                      setIsPublic(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      role === 'professional'
                        ? 'border-[#28634C] bg-[#28634C]/5 text-[#24352C]'
                        : 'border-[#E8E2D8] bg-[#FAF8F2] text-[#5E7166] hover:bg-white'
                    }`}
                  >
                    <span className="text-base">✂️</span>
                    <span className="font-bold text-xs mt-1 block">Profesional</span>
                    <span className="text-[10px] text-[#5E7166] mt-0.5">Atiende turnos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('receptionist');
                      setIsPublic(false);
                      setCommission(0);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      role === 'receptionist'
                        ? 'border-blue-500 bg-blue-50/50 text-[#24352C]'
                        : 'border-[#E8E2D8] bg-[#FAF8F2] text-[#5E7166] hover:bg-white'
                    }`}
                  >
                    <span className="text-base">🛎️</span>
                    <span className="font-bold text-xs mt-1 block">Recepción</span>
                    <span className="text-[10px] text-[#5E7166] mt-0.5">Mostrador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('admin');
                      setIsPublic(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      role === 'admin'
                        ? 'border-[#C4894D] bg-[#E8CDA8]/20 text-[#24352C]'
                        : 'border-[#E8E2D8] bg-[#FAF8F2] text-[#5E7166] hover:bg-white'
                    }`}
                  >
                    <span className="text-base">👑</span>
                    <span className="font-bold text-xs mt-1 block">Admin</span>
                    <span className="text-[10px] text-[#5E7166] mt-0.5">Control total</span>
                  </button>
                </div>
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-xs font-semibold text-[#24352C] mb-1">
                  Especialidad / Puesto
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder={
                    role === 'receptionist'
                      ? 'Ej. Recepcionista, Secretaria'
                      : role === 'admin'
                      ? 'Ej. Encargado de Sucursal, Socio'
                      : 'Ej. Barbero Senior, Colorista, Manicura'
                  }
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#24352C] focus:outline-none focus:border-[#28634C]"
                />
              </div>

              {/* Commission & Color (for professionals) */}
              {role === 'professional' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#24352C] mb-1">
                      Comisión (% por servicio)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={commission}
                      onChange={(e) => setCommission(Number(e.target.value))}
                      className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#24352C] focus:outline-none focus:border-[#28634C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#24352C] mb-1">
                      Color en la Agenda
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-[#E8E2D8] p-0.5 bg-white"
                      />
                      <span className="text-xs font-mono text-[#5E7166]">{color}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Web Booking Visibility */}
              {role === 'professional' && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F2] border border-[#E8E2D8]">
                  <div>
                    <div className="text-xs font-semibold text-[#24352C]">
                      ¿Visible en el Turnero Web?
                    </div>
                    <div className="text-[11px] text-[#5E7166]">
                      Permite que tus clientes elijan a este profesional al reservar online.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 accent-[#28634C] rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Optional Login Account */}
              <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#E8CDA8]/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#24352C] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#28634C]" />
                      Crear datos de acceso (Opcional)
                    </div>
                    <p className="text-[11px] text-[#5E7166]">
                      Habilita a este colaborador para que ingrese a TurnoPro con su usuario
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableLogin}
                    onChange={(e) => setEnableLogin(e.target.checked)}
                    className="w-4 h-4 accent-[#28634C] rounded cursor-pointer"
                  />
                </div>

                {enableLogin && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8CDA8]/40 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#24352C] mb-1">
                        Nombre de Usuario
                      </label>
                      <input
                        type="text"
                        required={enableLogin}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ej. lucas"
                        className="w-full bg-white border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-none focus:border-[#28634C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#24352C] mb-1">
                        Contraseña
                      </label>
                      <input
                        type="text"
                        required={enableLogin}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ej. 123456"
                        className="w-full bg-white border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-none focus:border-[#28634C]"
                      />
                    </div>
                    <p className="col-span-2 text-[10px] text-[#5E7166]">
                      💡 Ingresará en la pantalla de inicio con este usuario y contraseña. No necesita Gmail.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-[#5E7166] hover:bg-[#FAF8F2] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#28634C] hover:bg-[#1E4D3B] text-[#FAF8F2] text-xs font-bold shadow-xs transition"
                >
                  Guardar Miembro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
