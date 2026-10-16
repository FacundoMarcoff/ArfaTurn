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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#FAF8F2] rounded-xl border border-[#E8E2D8] text-[#28634C]">
              <Scissors className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#24352C] tracking-tight">
              Servicios y Precios
            </h1>
          </div>
          <p className="text-xs text-[#5E7166] mt-1.5">
            Configurá los servicios que ofrecés en {currentOrg.name}, su valor y el tiempo que dura cada turno.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Selector */}
          <div className="flex bg-[#FAF8F2] p-1 rounded-xl text-xs font-semibold border border-[#E8E2D8]">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
                activeTab === 'services'
                  ? 'bg-[#28634C] text-white shadow-xs font-bold'
                  : 'text-[#5E7166] hover:text-[#24352C]'
              }`}
            >
              <span>Servicios</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {orgServices.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
                activeTab === 'resources'
                  ? 'bg-[#28634C] text-white shadow-xs font-bold'
                  : 'text-[#5E7166] hover:text-[#24352C]'
              }`}
            >
              <span>Puestos / Sillones</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {branchResources.length}
              </span>
            </button>
          </div>

          {activeTab === 'services' && (
            <button
              onClick={() => setShowNewServiceModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#28634C] hover:bg-[#1E4E3B] text-white font-bold text-xs shadow-xs transition cursor-pointer min-h-[40px]"
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
          {orgServices.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[#5E7166] bg-white rounded-2xl border border-[#E8E2D8] p-8 space-y-2">
              <Scissors className="w-8 h-8 text-[#5E7166]/40 mx-auto" />
              <p className="font-semibold text-sm">No tenés servicios creados todavía.</p>
              <p className="text-xs">Hacé clic en &quot;Nuevo Servicio&quot; para empezar a cargar tus prestaciones.</p>
            </div>
          ) : (
            orgServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#28634C]/40 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#28634C] bg-[#F7EFE4] px-2.5 py-1 rounded-lg border border-[#E8CDA8]/60">
                      {service.category}
                    </span>
                    <div className="text-xl font-bold text-[#28634C] tabular-nums">
                      ${service.price.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#24352C] leading-snug">
                      {service.name}
                    </h3>
                    <p className="text-xs text-[#5E7166] mt-1 leading-relaxed line-clamp-2">
                      {service.description || 'Sin descripción adicional.'}
                    </p>
                  </div>

                  {/* Duration Chip */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-[#24352C] bg-[#FAF8F2] px-3 py-1.5 rounded-xl border border-[#E8E2D8]">
                      <Clock className="w-3.5 h-3.5 text-[#28634C]" />
                      <span className="tabular-nums">{service.duration_minutes} min</span>
                    </span>

                    {(service.prep_buffer_minutes > 0 || service.clean_buffer_minutes > 0) && (
                      <span className="text-[11px] text-[#5E7166] bg-[#FAF8F2] px-2 py-1 rounded-lg">
                        +{service.clean_buffer_minutes + service.prep_buffer_minutes}m limpieza
                      </span>
                    )}

                    {service.deposit_amount > 0 && (
                      <span className="text-[11px] font-bold text-[#28634C] bg-[#F7EFE4] px-2.5 py-1 rounded-lg border border-[#E8CDA8]/60">
                        Seña: ${service.deposit_amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#5E7166]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {service.is_public ? 'Visible para reservar' : 'Oculto'}
                  </span>
                  <span className="text-[11px] font-medium text-[#5E7166]">
                    IVA {service.tax_rate_pct}%
                  </span>
                </div>
              </div>
            ))
          )}
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
                  <div className="w-10 h-10 rounded-xl bg-[#F7EFE4] text-[#28634C] flex items-center justify-center font-bold border border-[#E8CDA8]/60">
                    <Box className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FAF8F2] text-[#24352C] border border-[#E8E2D8]">
                    Capacidad: {res.capacity} {res.capacity === 1 ? 'persona' : 'personas'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#24352C]">{res.name}</h3>
                  <p className="text-xs text-[#5E7166] mt-0.5">Espacio de trabajo en {currentBranch.name}</p>
                </div>

                <div className="text-[11px] text-[#5E7166] border-t border-[#E8E2D8] pt-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Operativo y sincronizado con turnos</span>
                </div>
              </div>
            ))}
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
