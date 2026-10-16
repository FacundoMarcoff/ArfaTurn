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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8CDA8]/30 text-[#24352C] border border-[#E8CDA8]/60">
            <ShieldCheck className="w-3 h-3 text-[#28634C]" />
            Dueño / Admin
          </span>
        );
      case 'receptionist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3 h-3" />
            Recepción
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#28634C]/10 text-[#28634C] border border-[#28634C]/25">
            <Scissors className="w-3 h-3" />
            Profesional
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#28634C]/10 text-[#28634C]">
              Gestión de Personal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#24352C] tracking-tight mt-1">
            Equipo & Accesos
          </h1>
          <p className="text-sm text-[#5E7166] mt-0.5">
            Administrá a las personas que atienden en {currentOrg.name || 'tu negocio'} y definí sus roles de forma simple.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#28634C] hover:bg-[#1E4D3B] text-[#FAF8F2] font-semibold text-sm shadow-sm transition hover:shadow active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Agregar Miembro</span>
        </button>
      </div>

      {/* Explanation Banner: How Login Works */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F2] border border-[#E8CDA8]/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#28634C] text-[#FAF8F2] flex items-center justify-center shrink-0 shadow-xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[#24352C]">
              ¿Cómo entran al sistema tus colaboradores?
            </h3>
            <p className="text-xs text-[#5E7166] leading-relaxed max-w-2xl">
              <strong>No es obligatorio tener Gmail ni cuentas complejas.</strong> Podés asignarles un simple <strong>usuario y contraseña</strong> (por ejemplo: usuario <code className="px-1.5 py-0.5 bg-white rounded border border-[#E8E2D8] font-mono text-[#24352C]">franco</code> y clave <code className="px-1.5 py-0.5 bg-white rounded border border-[#E8E2D8] font-mono text-[#24352C]">1234</code>) para que ingresen directo desde la pantalla de inicio en su celular o PC.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-[#28634C] bg-white px-3 py-1.5 rounded-xl border border-[#E8CDA8]/70">
            ✓ Sin correos que van a Spam
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D8] shadow-xs">
          <div className="text-xs font-semibold text-[#5E7166]">Total del Equipo</div>
          <div className="text-2xl font-bold text-[#24352C] mt-1">{orgProfessionals.length}</div>
          <div className="text-[11px] text-[#5E7166] mt-0.5">Colaboradores registrados</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D8] shadow-xs">
          <div className="text-xs font-semibold text-[#5E7166]">Visibles en Turnero Web</div>
          <div className="text-2xl font-bold text-[#28634C] mt-1">
            {orgProfessionals.filter((p) => p.is_public).length}
          </div>
          <div className="text-[11px] text-[#5E7166] mt-0.5">Disponibles para reserva online</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8E2D8] shadow-xs">
          <div className="text-xs font-semibold text-[#5E7166]">Sucursal Activa</div>
          <div className="text-base font-bold text-[#24352C] mt-1 truncate">
            {currentBranch.name || 'Sucursal Principal'}
          </div>
          <div className="text-[11px] text-[#5E7166] mt-0.5">Asignación automática de agenda</div>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-[#24352C]">Miembros del Equipo</h2>
            <p className="text-xs text-[#5E7166]">Personal que atiende o gestiona el establecimiento</p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAF8F2] p-1 rounded-xl border border-[#E8E2D8]">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeTab === 'all'
                  ? 'bg-[#28634C] text-[#FAF8F2] shadow-xs'
                  : 'text-[#5E7166] hover:text-[#24352C]'
              }`}
            >
              Todos ({orgProfessionals.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('professional')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeTab === 'professional'
                  ? 'bg-[#28634C] text-[#FAF8F2] shadow-xs'
                  : 'text-[#5E7166] hover:text-[#24352C]'
              }`}
            >
              Profesionales
            </button>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-bold text-base text-[#24352C]">No hay miembros registrados</h3>
            <p className="text-xs text-[#5E7166] mt-1 max-w-sm mx-auto">
              Comenzá agregando a tu primer colaborador para que aparezca en el calendario y en el turnero online.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#28634C] text-white text-xs font-semibold shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Agregar primer miembro</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E2D8]">
            {filteredList.map((prof) => {
              const linkedUser = getLinkedProfile(prof);
              return (
                <div
                  key={prof.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F2]/50 transition"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0"
                      style={{ backgroundColor: prof.color_tag || '#28634C' }}
                    >
                      {prof.display_name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#24352C]">{prof.display_name}</h3>
                        {renderRoleBadge(linkedUser?.is_superadmin ? 'admin' : 'professional')}
                      </div>
                      <p className="text-xs text-[#5E7166] mt-0.5">
                        {prof.specialty || 'Profesional de Servicio'}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Details & Badges */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-[#5E7166]">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#28634C]" />
                      <span>Comisión:</span>
                      <strong className="text-[#24352C] font-semibold">{prof.commission_rate_pct}%</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#28634C]" />
                      <span>Turnero Web:</span>
                      <span
                        className={`font-semibold ${
                          prof.is_public ? 'text-[#28634C]' : 'text-stone-400'
                        }`}
                      >
                        {prof.is_public ? 'Visible' : 'Oculto'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#28634C]" />
                      <span>Acceso:</span>
                      {linkedUser ? (
                        <span className="font-mono text-[#24352C] bg-white px-2 py-0.5 rounded border border-[#E8E2D8] text-[11px]">
                          @{linkedUser.username}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">Solo prestador</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-[#E8E2D8]">
                    {orgProfessionals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseás eliminar a ${prof.display_name}?`)) {
                            deleteProfessional(prof.id);
                          }
                        }}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Eliminar miembro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simplified Roles Guide: 3 Clear Roles */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs p-6 space-y-4">
        <div>
          <h2 className="font-bold text-base text-[#24352C] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#28634C]" />
            Guía Simple de Roles
          </h2>
          <p className="text-xs text-[#5E7166] mt-0.5">
            Solo 3 roles claros y directos para que la gestión de tu negocio sea ordenada y sin complicaciones:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Role 1: Dueño */}
          <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#E8CDA8]/60 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#28634C] text-[#FAF8F2] flex items-center justify-center font-bold text-xs">
                👑
              </div>
              <h3 className="font-bold text-sm text-[#24352C]">Dueño / Administrador</h3>
            </div>
            <p className="text-xs text-[#5E7166] leading-relaxed">
              Control total del negocio. Puede ver la caja, reportes de facturación, modificar precios, servicios y gestionar el equipo.
            </p>
            <div className="pt-2 border-t border-[#E8CDA8]/40 text-[11px] font-semibold text-[#28634C]">
              ✓ Acceso a todo el sistema
            </div>
          </div>

          {/* Role 2: Profesional */}
          <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#E8E2D8] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#28634C]/15 text-[#28634C] flex items-center justify-center font-bold text-xs">
                ✂️
              </div>
              <h3 className="font-bold text-sm text-[#24352C]">Profesional / Barbero</h3>
            </div>
            <p className="text-xs text-[#5E7166] leading-relaxed">
              Enfocado en la atención. Ve únicamente sus propios turnos asignados en la agenda, atiende clientes y consulta sus comisiones ganadas.
            </p>
            <div className="pt-2 border-t border-[#E8E2D8] text-[11px] font-semibold text-[#28634C]">
              ✓ Agenda personal y turnos propios
            </div>
          </div>

          {/* Role 3: Recepción */}
          <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#E8E2D8] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                🛎️
              </div>
              <h3 className="font-bold text-sm text-[#24352C]">Recepción / Mostrador</h3>
            </div>
            <p className="text-xs text-[#5E7166] leading-relaxed">
              Atención al público en mostrador. Puede agendar turnos para cualquier profesional, recibir clientes y cobrar en caja sin ver datos sensibles.
            </p>
            <div className="pt-2 border-t border-[#E8E2D8] text-[11px] font-semibold text-blue-700">
              ✓ Cobros y agenda general
            </div>
          </div>
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
