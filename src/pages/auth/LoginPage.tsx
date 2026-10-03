import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { Profile } from '../../types/database.types';

export const LoginPage: React.FC = () => {
  const {
    currentUser,
    logout,
    login,
    profiles,
    rememberDevice,
    rememberedUsername,
    setRememberedAccount,
  } = useTenant();
  const navigate = useNavigate();

  const [username, setUsername] = useState(rememberedUsername || '');
  const [password, setPassword] = useState('');
  const [rememberThisDevice, setRememberThisDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ejecución directa de inicio de sesión
  const handlePerformLogin = (userToLogin: Profile, passToCheck?: string) => {
    setError(null);

    const res = login(userToLogin.username, passToCheck || userToLogin.password, rememberThisDevice);
    if (!res.success) {
      setError(res.message || 'Error al iniciar sesión.');
      return;
    }

    if (rememberThisDevice) {
      setRememberedAccount(userToLogin.username);
    } else {
      setRememberedAccount(null);
    }

    // Redirección inmediata según el rol
    if (userToLogin.is_superadmin) {
      navigate('/admin/accounts');
    } else {
      navigate('/admin/calendar');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Por favor ingresá tu nombre de usuario.');
      return;
    }

    const user = profiles.find(
      (p) => p.username?.toLowerCase() === cleanUsername || p.email?.toLowerCase() === cleanUsername
    );

    if (!user) {
      setError('Usuario no registrado. Verificá los datos o consultá al administrador.');
      return;
    }

    if (password && user.password && user.password !== password) {
      setError('Contraseña incorrecta. Por favor verificala.');
      return;
    }

    handlePerformLogin(user, password);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#181615] flex flex-col justify-between text-stone-800 dark:text-stone-100 font-sans selection:bg-[#EBF2EE]">
      {/* Top Bar */}
      <header className="border-b border-[#E8E2D8] dark:border-[#2D2825] bg-white/80 dark:bg-[#201D1B]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-lg">
            <div className="w-8 h-8 rounded-xl bg-[#5E836F] text-white flex items-center justify-center font-serif text-sm shadow-sm">
              TP
            </div>
            <span className="font-bold text-stone-900 dark:text-white tracking-tight">
              Turno<span className="text-[#5E836F] dark:text-[#8CB5A0] font-normal">Pro</span>
            </span>
          </div>

          <span className="text-xs text-stone-400">
            Plataforma SaaS de Turnos, Clientes y Ventas
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-8 sm:py-12 w-full space-y-6">
        {/* Sesión Activa */}
        {currentUser && (
          <div className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#D5E3DB] dark:border-[#2E4738] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EBF2EE] dark:bg-[#203026] text-[#3B6652] dark:text-[#A1CEB5] flex items-center justify-center font-bold text-base">
                {currentUser.full_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    {currentUser.full_name}
                  </span>
                  {currentUser.is_superadmin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      👑 Super Admin
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  @{currentUser.username} · Sesión iniciada
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(currentUser.is_superadmin ? '/admin/accounts' : '/admin/calendar')
                }
                className="px-3.5 py-2 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>{currentUser.is_superadmin ? 'Ir a Consola Admin' : 'Ir a Mi Negocio'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="p-2 rounded-xl border border-[#E8E2D8] dark:border-[#38322E] text-stone-500 hover:text-red-600 transition cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Formulario Tradicional de Login */}
        <div className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] shadow-xs p-6 sm:p-8 space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF2EE] dark:bg-[#203026] text-[#3B6652] dark:text-[#A1CEB5] flex items-center justify-center mx-auto border border-[#D5E3DB] dark:border-[#2D4537] shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-serif font-black text-stone-900 dark:text-white tracking-tight">
              Ingreso al Sistema
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Ingresá tu usuario y contraseña para continuar:
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl pl-9 pr-3 py-2.5 text-stone-900 dark:text-white focus:outline-[#5E836F] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF7F2] dark:bg-[#1A1817] border border-[#E4DDD2] dark:border-[#352F2B] rounded-xl pl-9 pr-10 py-2.5 text-stone-900 dark:text-white focus:outline-[#5E836F] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberThisDevice}
                  onChange={(e) => setRememberThisDevice(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5E836F] accent-[#5E836F]"
                />
                <span className="text-xs text-stone-600 dark:text-stone-300">
                  Recordar en este equipo
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#5E836F] hover:bg-[#4E705D] text-white font-semibold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Ingresar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E2D8] dark:border-[#2D2825] py-4 text-center text-xs text-stone-400">
        TurnoPro SaaS · Sistema de Gestión de Turnos, Clientes y Ventas
      </footer>
    </div>
  );
};
