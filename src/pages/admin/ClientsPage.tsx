import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Lock,
  GitMerge,
  X,
  ShieldAlert,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { Customer } from '../../types/database.types';
import { hasPermission } from '../../types/rbac.types';

export const ClientsPage: React.FC = () => {
  const {
    currentOrg,
    currentRole,
    customers,
    appointments,
    sales,
    createCustomer,
    updateCustomer,
    mergeCustomers,
  } = useTenant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [highlightedClientId, setHighlightedClientId] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [duplicateIdToMerge, setDuplicateIdToMerge] = useState('');
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // New customer form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newConfidential, setNewConfidential] = useState('');

  const canViewConfidential = hasPermission(currentRole, 'clients:view_confidential_notes');
  const canMerge = hasPermission(currentRole, 'clients:merge');

  // Filter customers for this organization
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (c.organization_id !== currentOrg.id) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [customers, currentOrg.id, searchQuery]);

  // Clean phone number for WhatsApp link
  const getWhatsAppLink = (phone: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanDigits}`;
  };

  // Handle create customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createCustomer({
      full_name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      notes: newNotes.trim() || undefined,
      confidential_notes: canViewConfidential ? newConfidential.trim() : undefined,
    });
    setShowNewModal(false);
    setSelectedCustomer(created);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
    setNewConfidential('');
    setActionAlert('Cliente guardado exitosamente.');
  };

  // Handle merge customer
  const handleMerge = () => {
    if (!selectedCustomer || !duplicateIdToMerge) return;
    const res = mergeCustomers(selectedCustomer.id, duplicateIdToMerge);
    if (res.success) {
      setShowMergeModal(false);
      setDuplicateIdToMerge('');
      setActionAlert('Clientes unificados correctamente.');
    } else {
      alert(res.message);
    }
  };

  const activeHighlightedCustomer = useMemo(() => {
    if (highlightedClientId) {
      const found = filteredCustomers.find((c) => c.id === highlightedClientId);
      if (found) return found;
    }
    return filteredCustomers[0] || null;
  }, [filteredCustomers, highlightedClientId]);

  return (
    <div className="space-y-6">
      {/* MOBILE-ONLY VIEW (SCREEN 2 MOCKUP) */}
      <div className="md:hidden space-y-3.5 pb-24">
        {/* Title & Agregar Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#24352C] tracking-tight">Clientes</h1>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-[#28634C] text-[#28634C] bg-white hover:bg-[#FAF8F2] text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#5E7166] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nombre o teléfono"
            className="w-full bg-white border border-[#E8E2D8] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#24352C] focus:outline-[#28634C] shadow-2xs"
          />
        </div>

        {/* Counter */}
        <div className="text-xs text-[#5E7166] font-medium pt-0.5">
          {filteredCustomers.length} {filteredCustomers.length === 1 ? 'cliente' : 'clientes'}
        </div>

        {/* Client List */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-2xs divide-y divide-[#E8E2D8] overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5E7166] space-y-1">
              <Users className="w-6 h-6 mx-auto text-[#5E7166]/40" />
              <p className="font-semibold text-sm text-[#24352C]">No se encontraron clientes</p>
              <p>Tocá &quot;+ Agregar&quot; para registrar uno nuevo.</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = activeHighlightedCustomer?.id === cust.id;
              const lastAppt = appointments
                .filter((a) => a.customer_id === cust.id)
                .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())[0];
              const lastDateStr = lastAppt
                ? new Date(lastAppt.starts_at).toLocaleDateString('es-AR')
                : new Date(cust.created_at).toLocaleDateString('es-AR');

              return (
                <div
                  key={cust.id}
                  onClick={() => setHighlightedClientId(cust.id)}
                  className={`p-3.5 flex items-center justify-between gap-3 transition cursor-pointer ${
                    isSelected ? 'bg-[#FAF8F2]' : 'hover:bg-[#FAF8F2]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#E5E0D8] text-[#24352C] font-bold text-xs flex items-center justify-center shrink-0">
                      {getInitials(cust.full_name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#24352C] truncate">
                        {cust.full_name}
                      </h4>
                      <p className="text-xs text-[#5E7166] truncate mt-0.5">
                        {cust.total_appointments} {cust.total_appointments === 1 ? 'visita' : 'visitas'} · Última: {lastDateStr}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#5E7166] shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Selected / Featured Client Card at Bottom */}
        {activeHighlightedCustomer && (
          <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-[#E5E0D8] text-[#24352C] font-bold text-sm flex items-center justify-center shrink-0">
                {getInitials(activeHighlightedCustomer.full_name)}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-base text-[#24352C] truncate">
                  {activeHighlightedCustomer.full_name}
                </h4>
                <p className="text-xs text-[#5E7166]">
                  {activeHighlightedCustomer.total_appointments} visitas · <strong className="text-[#24352C]">${activeHighlightedCustomer.total_spent.toLocaleString()}</strong> consumidos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCustomer(activeHighlightedCustomer)}
                className="py-2.5 px-3 rounded-xl border border-[#E8E2D8] bg-white hover:bg-[#FAF8F2] text-xs font-bold text-[#24352C] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#5E7166]" />
                <span>Ver ficha</span>
              </button>
              <a
                href={getWhatsAppLink(activeHighlightedCustomer.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl border border-emerald-500 bg-white hover:bg-emerald-50 text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP-ONLY VIEW */}
      <div className="hidden md:block space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#FAF8F2] rounded-xl border border-[#E8E2D8] text-[#28634C]">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#24352C] tracking-tight">Mis Clientes</h1>
            </div>
            <p className="text-xs text-[#5E7166] mt-1.5">
              Directorio de clientes de {currentOrg.name}. Contactalos por WhatsApp con un toque y revisá sus visitas.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-bold text-xs shadow-xs transition cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-[#E8CDA8]" />
            <span>Agregar Cliente</span>
          </button>
        </div>

        {/* Search Bar Desktop */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs p-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5E7166] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
            />
          </div>
        </div>

        {/* Customer Desktop Table */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-[#5E7166] space-y-2">
              <Users className="w-8 h-8 text-[#5E7166]/40 mx-auto" />
              <p className="font-medium text-sm">No encontramos clientes con esa búsqueda.</p>
              <p className="text-xs text-[#5E7166]/80">Podés agregar uno nuevo con el botón verde superior.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F2] text-[#5E7166] font-semibold border-b border-[#E8E2D8]">
                  <tr>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3">Turnos realizados</th>
                    <th className="px-4 py-3">Total consumido</th>
                    <th className="px-5 py-3 text-right">Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {filteredCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      className="hover:bg-[#FAF8F2]/60 transition cursor-pointer"
                      onClick={() => setSelectedCustomer(cust)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-sm text-[#24352C]">{cust.full_name}</div>
                        {cust.email && <div className="text-[11px] text-[#5E7166]">{cust.email}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-[#24352C] font-mono font-medium">
                        {cust.phone}
                      </td>
                      <td className="px-4 py-3.5">
                        <a
                          href={getWhatsAppLink(cust.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-[11px] transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Chat WhatsApp</span>
                        </a>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#24352C] tabular-nums">
                        {cust.total_appointments} {cust.total_appointments === 1 ? 'turno' : 'turnos'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#28634C] tabular-nums text-sm">
                        ${cust.total_spent.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#FAF8F2] hover:bg-[#F2ECE4] border border-[#E8E2D8] text-[#28634C] font-bold text-xs transition cursor-pointer"
                        >
                          Ver Historial
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL FOR SELECTED CUSTOMER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-[#E8E2D8]">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#F7EFE4] text-[#28634C] font-bold text-lg flex items-center justify-center border border-[#E8CDA8]/60">
                    {selectedCustomer.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#24352C]">{selectedCustomer.full_name}</h2>
                    <p className="text-xs text-[#5E7166]">Cliente en {currentOrg.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-xl text-[#5E7166] hover:text-[#24352C] hover:bg-[#FAF8F2] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Direct Actions: WhatsApp & Call */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={getWhatsAppLink(selectedCustomer.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </a>
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FAF8F2] hover:bg-[#F2ECE4] text-[#24352C] border border-[#E8E2D8] font-bold text-xs transition"
                >
                  <Phone className="w-4 h-4 text-[#28634C]" />
                  <span>Llamar</span>
                </a>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#FAF8F2] rounded-xl border border-[#E8E2D8]">
                  <span className="text-[11px] font-medium text-[#5E7166]">Turnos Realizados</span>
                  <div className="text-xl font-bold text-[#24352C] tabular-nums mt-0.5">
                    {selectedCustomer.total_appointments}
                  </div>
                </div>
                <div className="p-3.5 bg-[#F7EFE4] rounded-xl border border-[#E8CDA8]/60">
                  <span className="text-[11px] font-medium text-[#28634C]">Total Invertido</span>
                  <div className="text-xl font-bold text-[#28634C] tabular-nums mt-0.5">
                    ${selectedCustomer.total_spent.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-3.5 bg-[#FAF8F2] rounded-xl border border-[#E8E2D8] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#5E7166]">Teléfono:</span>
                  <span className="font-bold text-[#24352C] font-mono">{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5E7166]">Email:</span>
                    <span className="font-medium text-[#24352C]">{selectedCustomer.email}</span>
                  </div>
                )}
              </div>

              {/* Operational Notes */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-[#24352C] uppercase tracking-wider">
                  Notas / Preferencias del Cliente
                </h3>
                <div className="p-3.5 bg-[#FAF8F2] rounded-xl border border-[#E8E2D8] text-xs text-[#24352C] leading-relaxed">
                  {selectedCustomer.notes || 'No hay notas registradas para este cliente.'}
                </div>
              </div>

              {/* Confidential / Medical Notes (Secured by RBAC) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#28634C] uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Notas Confidenciales / Ficha Médica</span>
                </div>
                {canViewConfidential ? (
                  <div className="p-3.5 bg-[#F7EFE4] rounded-xl border border-[#E8CDA8]/60 text-xs text-[#24352C] leading-relaxed">
                    {selectedCustomer.confidential_notes || 'Sin observaciones médicas o confidenciales.'}
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#E8E2D8] text-xs text-[#5E7166] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#5E7166] shrink-0" />
                    <span>Solo visible para administradores y dueños.</span>
                  </div>
                )}
              </div>

              {/* Appointments History */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#24352C] uppercase tracking-wider">
                  Historial de Turnos
                </h3>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {appointments
                    .filter((a) => a.customer_id === selectedCustomer.id)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF8F2]/60 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#24352C] tabular-nums">
                            {new Date(a.starts_at).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-[#5E7166] mt-0.5 capitalize">
                            Estado: {a.status}
                          </div>
                        </div>
                        <span className="font-bold text-[#28634C] tabular-nums text-sm">
                          ${a.total_amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between gap-2">
              {canMerge && (
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D8] text-[#5E7166] hover:text-[#24352C] text-xs font-semibold hover:bg-[#FAF8F2] transition cursor-pointer"
                >
                  <GitMerge className="w-3.5 h-3.5 text-[#28634C]" />
                  <span>Unificar Duplicado</span>
                </button>
              )}

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2.5 rounded-xl bg-[#28634C] text-white font-bold text-xs hover:bg-[#1E4E3B] transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="font-bold text-base text-[#24352C]">Nuevo Cliente</h3>
                <p className="text-xs text-[#5E7166]">Completá los datos para agendarlo y contactarlo.</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-[#5E7166] hover:text-[#24352C] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#24352C] mb-1">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Martín Gómez"
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24352C] mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ej. +54 9 11 1234-5678"
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24352C] mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#24352C] mb-1">
                  Notas o Preferencias (opcional)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ej. Prefiere corte con tijera, café sin azúcar..."
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              {canViewConfidential && (
                <div>
                  <label className="block text-xs font-bold text-[#28634C] mb-1">
                    Nota Confidencial / Salud (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={newConfidential}
                    onChange={(e) => setNewConfidential(e.target.value)}
                    placeholder="Alergias a productos, condiciones de piel..."
                    className="w-full bg-[#F7EFE4] border border-[#E8CDA8]/60 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#5E7166] hover:bg-[#FAF8F2] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERGE CLIENTS MODAL */}
      {showMergeModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h3 className="font-bold text-base text-[#24352C]">Unificar Cliente Duplicado</h3>
              <button onClick={() => setShowMergeModal(false)} className="text-[#5E7166] hover:text-[#24352C] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5E7166] leading-relaxed">
              Vas a conservar como principal la ficha de <strong>{selectedCustomer.full_name}</strong>. Elegí el duplicado para unificar su historial:
            </p>

            <div>
              <label className="block text-xs font-bold text-[#24352C] mb-1">
                Ficha duplicada a unificar:
              </label>
              <select
                value={duplicateIdToMerge}
                onChange={(e) => setDuplicateIdToMerge(e.target.value)}
                className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs text-[#24352C] focus:outline-[#28634C]"
              >
                <option value="">Seleccionar duplicado...</option>
                {customers
                  .filter((c) => c.organization_id === currentOrg.id && c.id !== selectedCustomer.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone}) - {c.total_appointments} turnos
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D8]">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#5E7166] hover:bg-[#FAF8F2] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={!duplicateIdToMerge}
                onClick={handleMerge}
                className="px-5 py-2.5 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
