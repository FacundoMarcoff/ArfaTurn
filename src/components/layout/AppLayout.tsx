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
  ChevronDown,
  MoreHorizontal,
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

  // Menú exclusivo según el rol - Lenguaje simple y claro para cualquier usuario
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
        { name: 'Turnos y Agenda', href: '/admin/calendar', icon: Calendar },
        { name: 'Mis Clientes', href: '/admin/clients', icon: Users },
        { name: 'Caja y Cobros', href: '/admin/sales', icon: ReceiptText },
        { name: 'Servicios y Precios', href: '/admin/services', icon: Scissors },
        { name: 'Mi Equipo', href: '/admin/team', icon: ShieldCheck },
        { name: 'Productos y Stock', href: '/admin/inventory', icon: Package },
        { name: 'Horarios del Local', href: '/admin/branches', icon: Building2 },
      ];

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex flex-col text-[#24352C] font-sans selection:bg-[#E8CDA8]/40 selection:text-[#24352C]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Mobile-only header (Exact mockup layout) */}
          <div className="lg:hidden flex items-center justify-between w-full">
            <div className="flex flex-col text-left min-w-0">
              <span className="font-bold text-base text-[#24352C] leading-tight tracking-tight truncate">
                {currentOrg.name}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="text-xs text-[#5E7166] flex items-center gap-1 font-medium hover:text-[#24352C] cursor-pointer"
              >
                <span className="truncate">{currentBranch.name}</span>
                <ChevronDown className="w-3 h-3 text-[#5E7166]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 rounded-full bg-[#FAF8F2] hover:bg-[#F2ECE4] border border-[#E8E2D8] text-[#24352C] font-bold text-sm flex items-center justify-center shadow-xs cursor-pointer"
            >
              {currentUser.full_name.charAt(0)}
            </button>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Brand Logo & Name */}
            <Link
              to={currentUser.is_superadmin ? '/admin/accounts' : '/admin/calendar'}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#28634C] text-[#FAF8F2] flex items-center justify-center font-serif font-bold text-sm shadow-xs">
                TP
              </div>
              <span className="font-bold text-lg tracking-tight text-[#24352C]">
                Turno<span className="text-[#28634C] font-normal">Pro</span>
              </span>
            </Link>

            {/* Indicator según tipo de usuario */}
            {currentUser.is_superadmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-xs font-bold text-amber-800">
                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">Super Admin</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#E8E2D8] bg-[#FAF8F2] text-xs sm:text-sm font-semibold text-[#24352C] min-w-0">
                <Store className="w-3.5 h-3.5 text-[#28634C] shrink-0" />
                <span className="font-bold truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{currentOrg.name}</span>
                <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-md border border-[#E8CDA8]/60 bg-[#F7EFE4] text-[#28634C] font-bold">
                  {industryInfo.emoji} {industryInfo.name.split(' ')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Right Header items (Desktop only) */}
          <div className="hidden lg:flex items-center gap-3">
            {/* User display */}
            <div className="flex items-center gap-2.5 p-1 pl-2.5 rounded-xl bg-[#FAF8F2] border border-[#E8E2D8] text-xs">
              <div className="w-7 h-7 rounded-lg bg-[#28634C] text-[#FAF8F2] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="text-left pr-1">
                <div className="font-bold text-[#24352C] leading-tight">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-[#5E7166] font-mono">
                  @{currentUser.username}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D8] bg-white hover:bg-red-50 hover:border-red-200 text-[#5E7166] hover:text-red-600 text-xs font-semibold transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-[#E8E2D8] p-3 shadow-xs">
              <div className="px-3 py-2 text-[10px] font-bold text-[#5E7166] uppercase tracking-wider">
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
                          ? 'bg-[#28634C] text-white shadow-xs'
                          : 'text-[#24352C] hover:bg-[#FAF8F2] hover:text-[#28634C]'
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
                              : 'bg-amber-100 text-amber-800'
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
            <div className="fixed inset-y-0 left-0 w-72 bg-white p-5 shadow-2xl space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                <div className="font-bold text-base text-[#24352C]">Menú</div>
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
                          ? 'bg-[#28634C] text-white shadow-xs'
                          : 'text-[#24352C] hover:bg-[#FAF8F2]'
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

              <div className="pt-4 border-t border-[#E8E2D8]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs text-red-600 hover:bg-red-50 font-semibold transition"
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

      {/* Mobile Bottom Navigation Bar (Exact 4 items from mockup) */}
      {!currentUser.is_superadmin && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] px-3 py-2 flex items-center justify-around shadow-lg">
          <Link
            to="/admin/calendar"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer min-w-[64px] ${
              location.pathname === '/admin/calendar'
                ? 'bg-[#EAF2EC] text-[#28634C] font-bold'
                : 'text-[#5E7166] hover:text-[#24352C]'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Agenda</span>
          </Link>

          <Link
            to="/admin/clients"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer min-w-[64px] ${
              location.pathname === '/admin/clients'
                ? 'bg-[#EAF2EC] text-[#28634C] font-bold'
                : 'text-[#5E7166] hover:text-[#24352C]'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Clientes</span>
          </Link>

          <Link
            to="/admin/sales"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer min-w-[64px] ${
              location.pathname === '/admin/sales'
                ? 'bg-[#EAF2EC] text-[#28634C] font-bold'
                : 'text-[#5E7166] hover:text-[#24352C]'
            }`}
          >
            <ReceiptText className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Caja</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition cursor-pointer min-w-[64px] ${
              !['/admin/calendar', '/admin/clients', '/admin/sales'].includes(location.pathname)
                ? 'bg-[#EAF2EC] text-[#28634C] font-bold'
                : 'text-[#5E7166] hover:text-[#24352C]'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Más</span>
          </button>
        </nav>
      )}
    </div>
  );
};
