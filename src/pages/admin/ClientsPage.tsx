import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Tag,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Lock,
  GitMerge,
  History,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  ShieldAlert,
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
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [duplicateIdToMerge, setDuplicateIdToMerge] = useState('');
  const [actionAlert, setActionAlert] = useState<string | null>(null);

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
    setActionAlert('Cliente registrado exitosamente.');
  };

  // Handle merge customer
  const handleMerge = () => {
    if (!selectedCustomer || !duplicateIdToMerge) return;
    const res = mergeCustomers(selectedCustomer.id, duplicateIdToMerge);
    if (res.success) {
      setShowMergeModal(false);
      setDuplicateIdToMerge('');
      setActionAlert('Clientes fusionados y auditados correctamente.');
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#201D1B] p-5 rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">Fichas de Clientes / CRM</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Historial de visitas, notas operativas, saldo y segmentación aislada por comercio.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6B8F7D] hover:bg-[#587969] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {actionAlert && (
        <div className="p-4 rounded-xl bg-[#EBF2EE] dark:bg-[#23352B] border border-[#D5E3DB] dark:border-[#2E4738] text-[#2F4F3E] dark:text-[#A1CEB5] text-xs flex items-center justify-between">
          <span>{actionAlert}</span>
          <button onClick={() => setActionAlert(null)} className="font-bold underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Search & List */}
      <div className="bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#EFE9DF] dark:border-[#2D2825]">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono, email o etiqueta..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF7F2] dark:bg-[#262220] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl text-xs text-stone-900 dark:text-white focus:outline-[#6B8F7D]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] dark:bg-[#282421] text-stone-500 font-semibold border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Etiquetas</th>
                <th className="px-4 py-3">Turnos</th>
                <th className="px-4 py-3">Total Consumido</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9DF] dark:divide-[#2D2825]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No se encontraron clientes registrados en este comercio.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-[#FAF7F2]/80 dark:hover:bg-[#252220] transition cursor-pointer"
                    onClick={() => setSelectedCustomer(cust)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-stone-900 dark:text-stone-100">{cust.full_name}</div>
                      <div className="text-[10px] text-stone-400">Desde {new Date(cust.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-stone-800 dark:text-stone-200">{cust.phone}</div>
                      {cust.email && <div className="text-[11px] text-stone-400">{cust.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {cust.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F2ECE4] dark:bg-[#2E2926] text-stone-700 dark:text-stone-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-800 dark:text-stone-200 tabular-nums">
                      {cust.total_appointments} turnos
                    </td>
                    <td className="px-4 py-3 font-bold text-[#4A725D] dark:text-[#A1CEB5] tabular-nums">
                      ${cust.total_spent.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(cust);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#EBF2EE] dark:bg-[#25382D] text-[#335946] dark:text-[#A1CEB5] font-semibold hover:bg-[#DFECE3] transition cursor-pointer"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL FOR SELECTED CUSTOMER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#201D1B] h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-[#E8E2D8] dark:border-[#2D2825]">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] dark:border-[#2D2825]">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">{selectedCustomer.full_name}</h2>
                  <p className="text-xs text-stone-400">Ficha de Cliente • {currentOrg.name}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#FAF7F2] dark:bg-[#1A1817] rounded-xl border border-[#E8E2D8] dark:border-[#2D2825]">
                  <span className="text-[11px] text-stone-400">Total Turnos</span>
                  <div className="text-lg font-bold text-stone-900 dark:text-white tabular-nums">
                    {selectedCustomer.total_appointments}
                  </div>
                </div>
                <div className="p-3 bg-[#EBF2EE] dark:bg-[#1E2E25] rounded-xl border border-[#D5E3DB] dark:border-[#2E4738]">
                  <span className="text-[11px] text-[#4A725D] dark:text-[#A1CEB5]">Total Gastado</span>
                  <div className="text-lg font-bold text-[#2F4F3E] dark:text-[#B6E0CA] tabular-nums">
                    ${selectedCustomer.total_spent.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Contact Data */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                  <Phone className="w-4 h-4 text-[#5E836F]" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                    <Mail className="w-4 h-4 text-[#5E836F]" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
              </div>

              {/* Operational Notes */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                  Notas Operativas / Preferencias
                </h3>
                <div className="p-3 bg-[#FAF7F2] dark:bg-[#1A1817] rounded-xl border border-[#E8E2D8] dark:border-[#2D2825] text-xs text-stone-700 dark:text-stone-300">
                  {selectedCustomer.notes || 'Sin notas registradas.'}
                </div>
              </div>

              {/* Confidential / Medical Notes (Secured by RBAC) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C6B32] dark:text-[#E8C78A] uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Notas Confidenciales / Salud</span>
                </div>
                {canViewConfidential ? (
                  <div className="p-3 bg-[#FEF8ED] dark:bg-[#2D2418] rounded-xl border border-[#F3E5CB] dark:border-[#473822] text-xs text-[#8C6B32] dark:text-[#E8C78A]">
                    {selectedCustomer.confidential_notes || 'Sin observaciones médicas o confidenciales.'}
                  </div>
                ) : (
                  <div className="p-3 bg-[#F2ECE4] dark:bg-[#262220] rounded-xl border border-[#E0D8CC] dark:border-[#38332F] text-xs text-stone-500 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>Acceso restringido: Tu rol ({currentRole}) no tiene autorización para leer notas clínicas o confidenciales.</span>
                  </div>
                )}
              </div>

              {/* Appointments History */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                  Historial de Turnos
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {appointments
                    .filter((a) => a.customer_id === selectedCustomer.id)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#2D2825] bg-[#FAF7F2]/50 dark:bg-[#1A1817]/50 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-stone-800 dark:text-stone-100 tabular-nums">
                            {new Date(a.starts_at).toLocaleDateString()} - {new Date(a.starts_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                          </div>
                          <div className="text-[10px] text-stone-400 capitalize">{a.status}</div>
                        </div>
                        <span className="font-bold text-stone-800 dark:text-stone-200 tabular-nums">
                          ${a.total_amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E8E2D8] dark:border-[#2D2825] flex items-center justify-between gap-2">
              {canMerge && (
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D5E3DB] dark:border-[#2E4738] text-[#335946] dark:text-[#A1CEB5] text-xs font-semibold hover:bg-[#EBF2EE] dark:hover:bg-[#203026] transition"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Fusionar Duplicado</span>
                </button>
              )}

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-[#F2ECE4] dark:bg-[#282421] text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-[#E8E2D8] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <h3 className="font-bold text-base text-stone-900 dark:text-white">Nuevo Cliente</h3>
              <button onClick={() => setShowNewModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+54 11 ..."
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notas Operativas
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Preferencias de atención, horarios..."
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              {canViewConfidential && (
                <div>
                  <label className="block text-xs font-semibold text-[#8C6B32] dark:text-[#E8C78A] mb-1">
                    Nota Confidencial / Salud
                  </label>
                  <textarea
                    rows={2}
                    value={newConfidential}
                    onChange={(e) => setNewConfidential(e.target.value)}
                    placeholder="Historial médico o confidencial protegido..."
                    className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#F3E5CB] dark:border-[#473822] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#8C6B32]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition"
                >
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERGE CLIENTS MODAL */}
      {showMergeModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
              <h3 className="font-bold text-base text-stone-900 dark:text-white">Fusionar Ficha de Cliente</h3>
              <button onClick={() => setShowMergeModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Vas a conservar como principal la ficha de <strong>{selectedCustomer.full_name}</strong>. Seleccioná el registro duplicado que se unificará y registrará en la auditoría:
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Ficha duplicada a absorber:
              </label>
              <select
                value={duplicateIdToMerge}
                onChange={(e) => setDuplicateIdToMerge(e.target.value)}
                className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-[#5E836F]"
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

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8] dark:border-[#2D2825]">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-[#F7F3EC] dark:hover:bg-[#282421] transition"
              >
                Cancelar
              </button>
              <button
                disabled={!duplicateIdToMerge}
                onClick={handleMerge}
                className="px-5 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition"
              >
                Confirmar Fusión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
