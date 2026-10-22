import React, { useState } from 'react';
import {
  Scissors,
  Plus,
  Clock,
  DollarSign,
  Box,
  CheckCircle,
  X,
  ChevronDown,
  Sparkles,
  Layers,
  Search,
  MoreVertical,
  Info,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { Service, Resource } from '../../types/database.types';

export const ServicesResourcesPage: React.FC = () => {
  const {
    currentOrg,
    currentBranch,
    services,
    resources,
    professionals,
    createService,
    updateService,
  } = useTenant();

  const [activeTab, setActiveTab] = useState<'services' | 'resources'>('services');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [showAdvancedTime, setShowAdvancedTime] = useState(false);

  // New service form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [duration, setDuration] = useState(30);
  const [prepBuffer, setPrepBuffer] = useState(0);
  const [cleanBuffer, setCleanBuffer] = useState(5);
  const [price, setPrice] = useState(15000);
  const [deposit, setDeposit] = useState(0);
  const [taxRate, setTaxRate] = useState(21);
  const [description, setDescription] = useState('');

  const orgServices = services.filter((s) => s.organization_id === currentOrg.id);
  const branchResources = resources.filter(
    (r) => r.organization_id === currentOrg.id && r.branch_id === currentBranch.id
  );

  const durationOptions = [15, 20, 30, 45, 60, 90, 120];

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    createService({
      name: name.trim(),
      category: category.trim() || 'General',
      duration_minutes: Number(duration),
      prep_buffer_minutes: Number(prepBuffer),
      clean_buffer_minutes: Number(cleanBuffer),
      price: Number(price),
      deposit_amount: Number(deposit),
      tax_rate_pct: Number(taxRate),
      description: description.trim(),
      is_public: true,
      is_active: true,
      requires_resource: true,
      assigned_professional_ids: professionals
        .filter((p) => p.organization_id === currentOrg.id)
        .map((p) => p.id),
    });

    setShowNewServiceModal(false);
    setName('');
    setDescription('');
    setPrice(15000);
    setDeposit(0);
    setDuration(30);
    setShowAdvancedTime(false);
  };

  return (
    <div className="space-y-4">
      {/* Header (Title + + Nuevo servicio) */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#24352C] tracking-tight">
          Servicios y precios
        </h1>

        <button
          type="button"
          onClick={() => setShowNewServiceModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#E8CDA8]" />
          <span>+ Nuevo servicio</span>
        </button>
      </div>

      {/* Secondary Toolbar: Tabs on left, Search on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'services'
                ? 'bg-[#EAF2EC] text-[#28634C] shadow-2xs'
                : 'bg-white text-[#5E7166] border border-[#CCD6D0] hover:bg-[#FAF8F2]'
            }`}
          >
            Servicios ({orgServices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-[#EAF2EC] text-[#28634C] shadow-2xs'
                : 'bg-white text-[#5E7166] border border-[#CCD6D0] hover:bg-[#FAF8F2]'
            }`}
          >
            Puestos ({branchResources.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#5E7166] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            placeholder="Buscar servicio"
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#CCD6D0] rounded-xl text-xs text-[#24352C] placeholder-[#5E7166]/70 focus:outline-[#28634C] shadow-2xs"
          />
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'services' ? (
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F2]/60 text-[#5E7166] font-semibold border-b border-[#E8E2D8]">
                <tr>
                  <th className="px-5 py-3">Servicio</th>
                  <th className="px-4 py-3">Duración</th>
                  <th className="px-4 py-3">Limpieza</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Reserva online</th>
                  <th className="px-4 py-3 w-10 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]/60">
                {orgServices
                  .filter((s) => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                  .map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-[#FAF8F2]/50 transition cursor-pointer"
                    >
                      <td className="px-5 py-3.5 font-bold text-xs text-[#24352C]">
                        {s.name}
                      </td>
                      <td className="px-4 py-3.5 text-[#5E7166] font-medium">
                        {s.duration_minutes} min
                      </td>
                      <td className="px-4 py-3.5 text-[#5E7166] font-medium">
                        {s.clean_buffer_minutes || 5} min
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#24352C] tabular-nums">
                        ${s.price.toLocaleString()}
                        {s.deposit_amount > 0 && (
                          <span className="block text-[10px] text-[#5E7166] font-normal">
                            Seña ${s.deposit_amount.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2EC] text-[#28634C]">
                          {s.is_public ? 'Visible' : 'Oculto'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-[#5E7166]">
                        <button
                          type="button"
                          className="p-1 rounded-lg hover:bg-[#FAF8F2] text-[#5E7166] transition cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-[#FAF8F2]/40 border-t border-[#E8E2D8] flex items-center gap-2 text-xs text-[#5E7166]">
            <Info className="w-4 h-4 text-[#28634C] shrink-0" />
            <span>Seleccioná un servicio para editar sus datos.</span>
          </div>
        </div>
      ) : (
        /* Resources / Puestos View */
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F2]/60 text-[#5E7166] font-semibold border-b border-[#E8E2D8]">
                <tr>
                  <th className="px-5 py-3">Puesto / Sillón</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Capacidad</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]/60">
                {branchResources.map((res) => (
                  <tr key={res.id} className="hover:bg-[#FAF8F2]/50 transition">
                    <td className="px-5 py-3.5 font-bold text-xs text-[#24352C]">
                      {res.name}
                    </td>
                    <td className="px-4 py-3.5 text-[#5E7166] capitalize">
                      {res.resource_type}
                    </td>
                    <td className="px-4 py-3.5 text-[#24352C] font-semibold">
                      {res.capacity} {res.capacity === 1 ? 'persona' : 'personas'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2EC] text-[#28634C]">
                        Operativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* CREATE SERVICE MODAL */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="font-bold text-base text-[#24352C]">Crear Nuevo Servicio</h3>
                <p className="text-xs text-[#5E7166]">Definí nombre, precio y duración del turno.</p>
              </div>
              <button
                onClick={() => setShowNewServiceModal(false)}
                className="p-1.5 rounded-xl text-[#5E7166] hover:text-[#24352C] hover:bg-[#FAF8F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#24352C] mb-1.5">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Corte clásico, Tratamiento capilar, Perfilado de barba..."
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#24352C] mb-1.5">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej. Cortes, Color, Barba"
                    className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24352C] mb-1.5">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#28634C] focus:outline-[#28634C]"
                  />
                </div>
              </div>

              {/* Duration with quick chips */}
              <div>
                <label className="block text-xs font-bold text-[#24352C] mb-1.5">
                  Duración del Turno: <span className="text-[#28634C] font-extrabold">{duration} minutos</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDuration(opt)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer min-h-[38px] ${
                        duration === opt
                          ? 'bg-[#28634C] text-white shadow-xs'
                          : 'bg-[#FAF8F2] text-[#5E7166] hover:text-[#24352C] border border-[#E8E2D8]'
                      }`}
                    >
                      {opt} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Seña requerida */}
              <div>
                <label className="block text-xs font-bold text-[#24352C] mb-1.5">
                  Seña Requerida ($) <span className="font-normal text-[#5E7166]">(Dejar en $0 si no pide anticipo)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#24352C] mb-1.5">
                  Descripción para los clientes (opcional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Incluye lavado, secado y peinado final..."
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              {/* Progressive disclosure for advanced buffers */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedTime(!showAdvancedTime)}
                  className="text-xs font-semibold text-[#5E7166] hover:text-[#24352C] flex items-center gap-1 cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedTime ? 'rotate-180' : ''}`} />
                  <span>Configuración avanzada (Tiempo de limpieza / IVA)</span>
                </button>

                {showAdvancedTime && (
                  <div className="mt-3 p-3.5 bg-[#FAF8F2] rounded-2xl border border-[#E8E2D8] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-[#24352C] mb-1">
                        Minutos de Limpieza posterior
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={cleanBuffer}
                        onChange={(e) => setCleanBuffer(Number(e.target.value))}
                        className="w-full bg-white border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#24352C] mb-1">
                        Alícuota IVA (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-full bg-white border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setShowNewServiceModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#5E7166] hover:bg-[#FAF8F2] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
