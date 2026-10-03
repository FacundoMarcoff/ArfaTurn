import React, { useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Scissors,
  Package,
  ReceiptText,
  Building2,
  ShieldCheck,
  Menu,
  X,
  Sliders,
  LogOut,
  Crown,
  Store,
} from 'lucide-react';
import { useTenant } from '../../lib/store/tenant-context';
import { getIndustryInfo } from '../../lib/constants/industries';
import { OfflineIndicator } from '../pwa/OfflineIndicator';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentOrg,
    currentBranch,
    currentUser,
    logout,
  } = useTenant();

  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Guard: Si no hay usuario autenticado, redirigir directo al login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Guard: Si es Super Admin, SOLO puede estar en la consola de cuentas (/admin/accounts)
  // El administrador NO ve turnos ni datos internos de las cuentas
  if (currentUser.is_superadmin && location.pathname !== '/admin/accounts') {
    return <Navigate to="/admin/accounts" replace />;
  }

  // 3. Guard: Si es cliente (Peluquería), NO puede acceder a la consola de cuentas SaaS
  if (!currentUser.is_superadmin && location.pathname === '/admin/accounts') {
    return <Navigate to="/admin/calendar" replace />;
  }

  const industryInfo = getIndustryInfo(currentOrg.industry);

  interface LayoutNavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  // Menú exclusivo según el rol
  const navItems: LayoutNavItem[] = currentUser.is_superadmin
    ? [
        {
          name: 'Gestión de Cuentas SaaS',
          href: '/admin/accounts',
          icon: Sliders,
          badge: 'Super Admin',
        },
      ]
    : [
        { name: 'Agenda / Turnos', href: '/admin/calendar', icon: Calendar },
        { name: 'Clientes / CRM', href: '/admin/clients', icon: Users },
        { name: 'Servicios y Recursos', href: '/admin/services', icon: Scissors },
        { name: 'Productos y Stock', href: '/admin/inventory', icon: Package },
        { name: 'Ventas y Caja POS', href: '/admin/sales', icon: ReceiptText },
        { name: 'Equipo y Roles', href: '/admin/team', icon: ShieldCheck },
        { name: 'Sucursal & Horarios', href: '/admin/branches', icon: Building2 },
      ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#171514] flex flex-col text-stone-800 dark:text-stone-100 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#201D1B]/90 backdrop-blur-md border-b border-[#E8E2D8] dark:border-[#2D2825]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-[#F2ECE4] dark:hover:bg-[#2A2624]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Brand Logo & Name */}
            <Link
              to={currentUser.is_superadmin ? '/admin/accounts' : '/admin/calendar'}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#5E836F] text-white flex items-center justify-center font-serif font-bold text-sm shadow-sm">
                TP
              </div>
              <span className="hidden sm:inline font-bold text-lg tracking-tight text-stone-900 dark:text-white">
                Turno<span className="text-[#5E836F] dark:text-[#8CB5A0] font-normal">Pro</span>
              </span>
            </Link>

            {/* Indicator según tipo de usuario */}
            {currentUser.is_superadmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs font-bold text-amber-800 dark:text-amber-200">
                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">Super Admin</span>
              </div>
            ) : (
              /* Negocio único del cliente (1 usuario = 1 negocio, sin selector multi-comercio) */
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#E4DDD2] dark:border-[#352F2B] bg-[#F7F3EC] dark:bg-[#262220] text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200 min-w-0">
                <Store className="w-3.5 h-3.5 text-[#5E836F] shrink-0" />
                <span className="font-bold truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{currentOrg.name}</span>
                <span className={`hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-md border font-bold ${industryInfo.badgeBg} ${industryInfo.badgeText}`}>
                  {industryInfo.emoji} {industryInfo.name.split(' ')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {/* User display */}
            <div className="flex items-center gap-2.5 p-1 pl-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#262220] border border-[#E4DDD2] dark:border-[#352F2B] text-xs">
              <div className="w-7 h-7 rounded-lg bg-[#5E836F] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <div className="font-bold text-stone-900 dark:text-white leading-tight">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  @{currentUser.username}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D8] dark:border-[#38322E] bg-white dark:bg-[#201D1B] hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900 text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white dark:bg-[#201D1B] rounded-3xl border border-[#E8E2D8] dark:border-[#2D2825] p-3 shadow-xs">
              <div className="px-3 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {currentUser.is_superadmin ? 'Super Admin' : 'Panel del Negocio'}
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-[#5E836F] text-white shadow-xs'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-[#282422]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Offline status indicator */}
            <OfflineIndicator />
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#201D1B] p-5 shadow-2xl space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#2D2825]">
                <div className="font-bold text-base text-stone-900 dark:text-white">Menú</div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-[#5E836F] text-white shadow-xs'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-[#282422]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400 text-stone-950">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-[#E8E2D8] dark:border-[#2D2825]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Content */}
        <main className={`flex-1 min-w-0 ${currentUser.is_superadmin ? '' : 'pb-20 lg:pb-0'}`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Quick thumb access for mobile devices) */}
      {!currentUser.is_superadmin && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#201D1B]/95 backdrop-blur-md border-t border-[#E8E2D8] dark:border-[#2D2825] px-2 py-1.5 flex items-center justify-around shadow-lg">
          <Link
            to="/admin/calendar"
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              location.pathname === '/admin/calendar'
                ? 'text-[#335946] dark:text-[#A1CEB5] font-bold'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Agenda</span>
          </Link>

          <Link
            to="/admin/clients"
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              location.pathname === '/admin/clients'
                ? 'text-[#335946] dark:text-[#A1CEB5] font-bold'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Clientes</span>
          </Link>

          <Link
            to="/admin/sales"
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              location.pathname === '/admin/sales'
                ? 'text-[#335946] dark:text-[#A1CEB5] font-bold'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            <ReceiptText className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Caja POS</span>
          </Link>

          <Link
            to="/admin/services"
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              location.pathname === '/admin/services'
                ? 'text-[#335946] dark:text-[#A1CEB5] font-bold'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            <Scissors className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Servicios</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Menú</span>
          </button>
        </nav>
      )}
    </div>
  );
};
