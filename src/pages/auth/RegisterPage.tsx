import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  ArrowRight,
  Shield,
  Lock,
  User,
  CheckCircle2,
  Sparkles,
  Building2,
  Check,
  Layers,
  Sliders,
  Clock,
  Award,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { Organization } from '../../types/database.types';
import { INDUSTRIES_METADATA } from '../../lib/constants/industries';

export const RegisterPage: React.FC = () => {
  const { createOrganization } = useTenant();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<Organization['industry']>('barbershop');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const industriesList = Object.values(INDUSTRIES_METADATA);

  const handleAdminQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !username.trim()) return;

    const newOrg = createOrganization({
      name: businessName.trim(),
      industry,
      username: username.trim().toLowerCase(),
      password: password || 'password123',
      ownerFullName: ownerFullName.trim() || `Titular ${businessName}`,
      subscriptionType: 'demo_7d',
      maxBranches: 1,
      delegationMode: 'single',
    });

    setSuccessMsg(`Cuenta "${newOrg.name}" creada exitosamente con usuario @${username.toLowerCase()} y Demo de 1 semana activa.`);
    setTimeout(() => {
      navigate('/admin/accounts');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#181615] flex flex-col justify-between text-stone-800 dark:text-stone-100 font-sans selection:bg-[#EBF2EE]">
      {/* Top Bar */}
      <header className="border-b border-[#E8E2D8] dark:border-[#2D2825] bg-white/80 dark:bg-[#201D1B]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="w-8 h-8 rounded-xl bg-[#6B8F7D] text-white flex items-center justify-center font-serif text-sm shadow-sm">
              TP
            </div>
            <span className="font-bold text-stone-900 dark:text-white tracking-tight">
              Turno<span className="text-[#6B8F7D] dark:text-[#8CB5A0] font-normal">Pro</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-stone-500">¿Ya tenés un usuario asignado?</span>
            <Link to="/login" className="font-bold text-[#5E836F] dark:text-[#A7C8B5] hover:underline">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-14 w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2EE] dark:bg-[#203026] text-xs font-semibold text-[#3B6652] dark:text-[#A1CEB5] border border-[#D5E3DB] dark:border-[#2D4537]">
            <Shield className="w-3.5 h-3.5" />
            <span>Provisión de Cuentas por Administración</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
            Alta y Creación de Comercios
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
            Las cuentas, esquemas de delegación (mono-rol o multi-rol), sucursales y planes de suscripción (Demo 1 semana, Socio Vitalicio, o 3, 6, 12 meses) son dados de alta por nosotros desde el Panel de Administración.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E8E2D8] dark:border-[#2D2825]">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                ¿Sos Administrador de la Plataforma?
              </h3>
              <p className="text-xs text-stone-500">
                Podés configurar las cuentas, dar de alta contraseñas, habilitar sucursales y definir vigencias en el panel.
              </p>
            </div>
            <Link
              to="/admin/accounts"
              className="px-4 py-2.5 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Sliders className="w-4 h-4" />
              <span>Abrir Panel de Cuentas</span>
            </Link>
          </div>

          <form onSubmit={handleAdminQuickCreate} className="space-y-4 text-xs">
            <div className="font-bold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[#5E836F]">
              Alta Rápida de Comercio y Credenciales
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre del Comercio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Barbería Don Mateo / Consultorio San Martín"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (!username) {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15));
                    }
                  }}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2.5 text-stone-900 dark:text-white focus:outline-[#5E836F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Rubro *
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as any)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2.5 text-stone-900 dark:text-white focus:outline-[#5E836F]"
                >
                  {industriesList.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.emoji} {ind.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Usuario Asignado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: donmateo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2.5 text-stone-900 dark:text-white focus:outline-[#5E836F] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Contraseña Inicial *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl px-3 py-2.5 text-stone-900 dark:text-white focus:outline-[#5E836F] font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Crear Cuenta con Usuario y Demo de 1 Semana</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E2D8] dark:border-[#2D2825] py-4 text-center text-xs text-stone-400">
        Plataforma SaaS Multi-Tenant & Multi-Rubro con aislamiento seguro de datos.
      </footer>
    </div>
  );
};
