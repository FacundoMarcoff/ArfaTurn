import React, { useState } from 'react';
import {
  Scissors,
  Plus,
  Clock,
  DollarSign,
  Users,
  Box,
  Layers,
  CheckCircle,
  X,
  Edit2,
  Trash2,
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
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);

  // New service form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [duration, setDuration] = useState(45);
  const [prepBuffer, setPrepBuffer] = useState(5);
  const [cleanBuffer, setCleanBuffer] = useState(5);
  const [price, setPrice] = useState(15000);
  const [deposit, setDeposit] = useState(0);
  const [taxRate, setTaxRate] = useState(21);
  const [description, setDescription] = useState('');

  const orgServices = services.filter((s) => s.organization_id === currentOrg.id);
  const branchResources = resources.filter(
    (r) => r.organization_id === currentOrg.id && r.branch_id === currentBranch.id
  );

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    createService({
      name: name.trim(),
      category: category.trim(),
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#24352C] tracking-tight">
            Servicios y Recursos Físicos
          </h1>
          <p className="text-xs text-[#5E7166] mt-1">
            Configuración de duración, buffers de limpieza, señas online y asignación de salas o sillones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex bg-[#FAF8F2] p-1 rounded-xl text-xs font-semibold border border-[#E8E2D8]">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-[#28634C] text-white shadow-xs font-bold'
                  : 'text-[#5E7166] hover:text-[#24352C]'
              }`}
            >
              Servicios ({orgServices.length})
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'resources'
                  ? 'bg-[#28634C] text-white shadow-xs font-bold'
                  : 'text-[#5E7166] hover:text-[#24352C]'
              }`}
            >
              Recursos / Sillones ({branchResources.length})
            </button>
          </div>

          {activeTab === 'services' && (
            <button
              onClick={() => setShowNewServiceModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E8CDA8]" />
              <span>Nuevo Servicio</span>
            </button>
          )}
        </div>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#28634C]/50 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#28634C] bg-[#F7EFE4] px-2.5 py-0.5 rounded-lg border border-[#E8CDA8]/60">
                    {service.category}
                  </span>
                  <div className="text-lg font-bold text-[#28634C] tabular-nums">
                    ${service.price.toLocaleString()}
                  </div>
                </div>

                <h3 className="font-bold text-sm text-[#24352C] leading-snug">
                  {service.name}
                </h3>

                <p className="text-xs text-[#5E7166] leading-relaxed line-clamp-2">
                  {service.description || 'Sin descripción detallada.'}
                </p>

                {/* Duration & Buffers */}
                <div className="pt-2 flex items-center gap-3 text-xs text-[#5E7166]">
                  <span className="flex items-center gap-1 font-semibold text-[#24352C]">
                    <Clock className="w-3.5 h-3.5 text-[#28634C]" />
                    <span className="tabular-nums">{service.duration_minutes} min</span>
                  </span>
                  {(service.prep_buffer_minutes > 0 || service.clean_buffer_minutes > 0) && (
                    <span className="text-[10px] text-[#5E7166]">
                      +{service.prep_buffer_minutes}m prep / +{service.clean_buffer_minutes}m limpieza
                    </span>
                  )}
                </div>

                {service.deposit_amount > 0 && (
                  <div className="text-[11px] font-semibold text-[#28634C] bg-[#F7EFE4] p-2 rounded-xl border border-[#E8CDA8]/60">
                    Seña requerida: ${service.deposit_amount.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#5E7166]">
                <span>{service.is_public ? 'Publicado online' : 'Oculto'}</span>
                <span className="font-semibold text-[#28634C]">IVA {service.tax_rate_pct}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Resources Tab */
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branchResources.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#F7EFE4] text-[#28634C] flex items-center justify-center font-bold border border-[#E8CDA8]/60">
                    <Box className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[#F7EFE4] text-[#28634C] border border-[#E8CDA8]/60">
                    Capacidad: {res.capacity}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#24352C]">{res.name}</h3>
                  <p className="text-xs text-[#5E7166] capitalize mt-0.5">Tipo: {res.resource_type}</p>
                </div>

                <div className="text-[11px] text-[#5E7166] border-t border-[#E8E2D8] pt-2">
                  Asignado a: {currentBranch.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE SERVICE MODAL */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E8E2D8] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h3 className="font-bold text-base text-[#24352C]">Crear Nuevo Servicio</h3>
              <button onClick={() => setShowNewServiceModal(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#24352C] mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Corte y Peinado Premium"
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#24352C] mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ej. Peluquería, Barba, Faciales..."
                    className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#24352C] mb-1">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#24352C] mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-2 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#24352C] mb-1">
                    Buffer Preparación
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={prepBuffer}
                    onChange={(e) => setPrepBuffer(Number(e.target.value))}
                    className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-2 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#24352C] mb-1">
                    Buffer Limpieza
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={cleanBuffer}
                    onChange={(e) => setCleanBuffer(Number(e.target.value))}
                    className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-2 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24352C] mb-1">
                  Monto de Seña requerida ($) (0 si no requiere seña)
                </label>
                <input
                  type="number"
                  min={0}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24352C] mb-1">
                  Descripción pública para clientes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles que verá el cliente al elegir el servicio..."
                  className="w-full bg-[#FAF8F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#24352C] focus:outline-[#28634C]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setShowNewServiceModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-[#5E7166] hover:bg-[#FAF8F2] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  Crear Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
