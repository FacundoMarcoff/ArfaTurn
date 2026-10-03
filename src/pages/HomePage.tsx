import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Package,
  ReceiptText,
  Globe,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Sliders,
  Store,
} from 'lucide-react';
import { useTenant } from '../lib/store/tenant-context';

export const HomePage: React.FC = () => {
  const { organizations, switchOrganization } = useTenant();

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 dark:bg-[#181615] dark:text-stone-100 font-sans selection:bg-[#EBF2EE] selection:text-[#2F4F3E] flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-[#E8E2D8] dark:border-[#2D2825] bg-white/80 dark:bg-[#201D1B]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-lg">
            <div className="w-8 h-8 rounded-xl bg-[#6B8F7D] text-white flex items-center justify-center font-serif text-sm shadow-sm">
              TP
            </div>
            <span className="font-bold text-stone-900 dark:text-white tracking-tight">
              Turno<span className="text-[#6B8F7D] dark:text-[#8CB5A0] font-normal">Pro</span>
            </span>
            <span className="ml-2 text-[11px] font-medium text-stone-500 border border-[#E0D8CC] dark:border-[#38332F] bg-[#F7F3EC] dark:bg-[#262220] px-2.5 py-0.5 rounded-full">
              SaaS Multi-Comercio
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/accounts"
              className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-3 py-1.5 rounded-xl border border-[#E0D8CC] dark:border-[#352F2B] hover:bg-[#F2ECE4] dark:hover:bg-[#282421] transition hidden sm:inline-flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-[#6B8F7D]" />
              <span>Admin de Cuentas</span>
            </Link>
            <Link
              to="/login"
              className="text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white px-3 py-1.5 rounded-xl border border-[#E0D8CC] dark:border-[#352F2B] hover:bg-[#F2ECE4] dark:hover:bg-[#282421] transition inline-flex items-center gap-1.5"
            >
              <span>Iniciar Sesión</span>
            </Link>
            <Link
              to="/admin/calendar"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#6B8F7D] hover:bg-[#587969] text-white shadow-xs transition"
            >
              Entrar al Panel
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2EE] dark:bg-[#203026] text-xs font-semibold text-[#3B6652] dark:text-[#A1CEB5] border border-[#D5E3DB] dark:border-[#2D4537]">
            <span>Gestión integral para estudios, salones y consultorios</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-stone-900 dark:text-white tracking-tight leading-tight">
            Turnos sin fricción, CRM de clientes, inventario y caja POS
          </h1>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto">
            Dos experiencias conectadas: <strong>Panel privado</strong> con agenda visual, control de insumos y arqueo de caja, y <strong>Portal público</strong> para que tus clientes reserven en tiempo real con confirmación inmediata.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#6B8F7D] hover:bg-[#587969] text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Iniciar Sesión & Ver mi Rubro</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/admin/calendar"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-[#201D1B] hover:bg-[#FAF7F2] dark:hover:bg-[#292523] text-stone-800 dark:text-stone-200 border border-[#E0D8CC] dark:border-[#332D29] font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Store className="w-4 h-4 text-[#6B8F7D]" />
              <span>Abrir Panel de Gestión</span>
            </Link>

            <Link
              to={`/reservar/barberia-don-mateo`}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-[#201D1B] hover:bg-[#FAF7F2] dark:hover:bg-[#292523] text-stone-800 dark:text-stone-200 border border-[#E0D8CC] dark:border-[#332D29] font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-4 h-4 text-[#6B8F7D]" />
              <span>Probar Turnero Online</span>
            </Link>
          </div>
        </div>

        {/* Demo Businesses / Multi-tenant Showcase */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Comercios de Ejemplo Listos para Explorar
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Hacé clic para abrir el turnero web o ingresar al backoffice de cada comercio:
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Barbería */}
            <div className="bg-[#FAF4ED] dark:bg-[#231E1B] border border-[#ECDCCF] dark:border-[#382E28] rounded-3xl p-6 flex flex-col justify-between transition hover:shadow-sm">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#8C5D45] dark:text-[#E2A688] bg-[#F3E7DC] dark:bg-[#322620] px-2.5 py-0.5 rounded-lg border border-[#E8D4C4] dark:border-[#423128]">
                    Barbería & Estilo
                  </span>
                  <span className="text-stone-400 font-medium">ARS</span>
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                  Barbería Don Mateo
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  2 sucursales (Palermo y Belgrano), 3 barberos con sillones clásicos, stock de pomadas y aceites, y caja registradora.
                </p>
              </div>

              <div className="pt-6 border-t border-[#E8DCCF] dark:border-[#332A24] mt-5 flex items-center justify-between gap-2">
                <Link
                  to="/reservar/barberia-don-mateo"
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#2A2421] text-xs font-semibold text-[#8C5D45] dark:text-[#E2A688] border border-[#E0CFBF] dark:border-[#3D332D] flex items-center justify-center gap-1.5 transition hover:bg-[#FDFBF7]"
                >
                  <span>Turnero Web</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <Link
                  to="/admin/calendar"
                  onClick={() => switchOrganization('org-barberia')}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#8C5D45] hover:bg-[#784F3B] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition shadow-2xs"
                >
                  <span>Backoffice</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Estética & Spa */}
            <div className="bg-[#FAF2F4] dark:bg-[#231C20] border border-[#EBD6DC] dark:border-[#3A2B32] rounded-3xl p-6 flex flex-col justify-between transition hover:shadow-sm">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#A25A6C] dark:text-[#E499AB] bg-[#F3E3E7] dark:bg-[#342229] px-2.5 py-0.5 rounded-lg border border-[#E7CCD3] dark:border-[#462D38]">
                    Estética & Spa
                  </span>
                  <span className="text-stone-400 font-medium">ARS</span>
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                  Estética Bella Donna
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Cabinas faciales, masajes descontracturantes, cosmiatría y reserva con pago de seña previa opcional.
                </p>
              </div>

              <div className="pt-6 border-t border-[#EBD6DC] dark:border-[#35252E] mt-5 flex items-center justify-between gap-2">
                <Link
                  to="/reservar/bella-donna-spa"
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#2B2127] text-xs font-semibold text-[#A25A6C] dark:text-[#E499AB] border border-[#DFC4CD] dark:border-[#402C37] flex items-center justify-center gap-1.5 transition hover:bg-[#FEFBFC]"
                >
                  <span>Turnero Web</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <Link
                  to="/admin/calendar"
                  onClick={() => switchOrganization('org-estetica')}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#A25A6C] hover:bg-[#8D4D5D] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition shadow-2xs"
                >
                  <span>Backoffice</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Consultorio Odontológico */}
            <div className="bg-[#F2F7F4] dark:bg-[#1B2320] border border-[#D5E4DC] dark:border-[#273830] rounded-3xl p-6 flex flex-col justify-between transition hover:shadow-sm">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#3D6B57] dark:text-[#9EC4AF] bg-[#E2EDE6] dark:bg-[#22332B] px-2.5 py-0.5 rounded-lg border border-[#CEE0D5] dark:border-[#2D4539]">
                    Consultorio Médico
                  </span>
                  <span className="text-stone-400 font-medium">ARS</span>
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                  Consultorio San Martín
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Odontología integral con separación estricta entre notas de recepción y fichas clínicas confidenciales.
                </p>
              </div>

              <div className="pt-6 border-t border-[#D5E4DC] dark:border-[#26372F] mt-5 flex items-center justify-between gap-2">
                <Link
                  to="/reservar/consultorio-san-martin"
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#202C26] text-xs font-semibold text-[#3D6B57] dark:text-[#9EC4AF] border border-[#C6DDD1] dark:border-[#2C4136] flex items-center justify-center gap-1.5 transition hover:bg-[#F9FCFA]"
                >
                  <span>Turnero Web</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <Link
                  to="/admin/calendar"
                  onClick={() => switchOrganization('org-consultorio')}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#3D6B57] hover:bg-[#325847] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition shadow-2xs"
                >
                  <span>Backoffice</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] space-y-2 shadow-2xs">
            <Calendar className="w-5 h-5 text-[#6B8F7D]" />
            <h4 className="font-bold text-sm text-stone-900 dark:text-white">Disponibilidad en Tiempo Real</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Cálculo atómico en PostgreSQL. Considera horarios laborales, descansos y buffers sin solapamientos.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] space-y-2 shadow-2xs">
            <Users className="w-5 h-5 text-[#8C5D45]" />
            <h4 className="font-bold text-sm text-stone-900 dark:text-white">CRM Aislado por Comercio</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Fichas de clientes privadas, historial de turnos y notas clínicas con control de acceso por rol.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] space-y-2 shadow-2xs">
            <Package className="w-5 h-5 text-[#C5A572]" />
            <h4 className="font-bold text-sm text-stone-900 dark:text-white">Stock Auditado</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Movimientos de stock justificados por compras, ventas y consumos en servicios sin edición directa.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-[#201D1B] rounded-2xl border border-[#E8E2D8] dark:border-[#2D2825] space-y-2 shadow-2xs">
            <Globe className="w-5 h-5 text-[#5B8576]" />
            <h4 className="font-bold text-sm text-stone-900 dark:text-white">100% Web & Mobile Responsive</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Accedé desde cualquier dispositivo, celular, tablet o computadora sin necesidad de instalar nada.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E2D8] dark:border-[#2D2825] py-8 text-center text-xs text-stone-400">
        <p>TurnoPro SaaS · Construido con React, TypeScript y Supabase.</p>
      </footer>
    </div>
  );
};
