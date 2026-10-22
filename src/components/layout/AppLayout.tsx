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
  Clock,
  Check,
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // 1. Guard: Si no hay usuario autenticado, redirigir directo al login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Guard: Si es Super Admin, SOLO puede estar en la consola de cuentas (/admin/accounts)
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

  // Menú según el diseño del mockup: Agenda, Clientes, Caja y cobros, etc.
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
        { name: 'Agenda', href: '/admin/calendar', icon: Calendar },
        { name: 'Clientes', href: '/admin/clients', icon: Users },
        { name: 'Caja y cobros', href: '/admin/sales', icon: ReceiptText },
        { name: 'Servicios y precios', href: '/admin/services', icon: Scissors },
        { name: 'Equipo', href: '/admin/team', icon: ShieldCheck },
        { name: 'Productos y stock', href: '/admin/inventory', icon: Package },
        { name: 'Local y horarios', href: '/admin/branches', icon: Clock },
      ];

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex text-[#24352C] font-sans selection:bg-[#E8CDA8]/40 selection:text-[#24352C]">
      {/* DESKTOP SIDEBAR (Left Full-Height Bar as in Mockup) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-[#E8E2D8] flex-col justify-between h-screen sticky top-0 z-30">
        <div className="p-4 space-y-6">
          {/* Logo & Brand Name */}
          <Link
            to={currentUser.is_superadmin ? '/admin/accounts' : '/admin/calendar'}
            className="flex items-center gap-2.5 px-2 py-1 group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#28634C] text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex items-baseline tracking-tight">
              <span className="font-extrabold text-lg text-[#24352C]">Tu</span>
              <span className="font-extrabold text-lg text-[#28634C] ml-1">Turnito</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#EAF2EC] text-[#28634C] font-bold shadow-2xs'
                      : 'text-[#5E7166] hover:bg-[#FAF8F2] hover:text-[#24352C]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#28634C]' : 'text-[#5E7166]'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile in Sidebar */}
        <div className="p-3 border-t border-[#E8E2D8] space-y-2">
          <OfflineIndicator />

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF8F2] transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#E5E0D8] text-[#24352C] font-bold text-xs flex items-center justify-center shrink-0">
                  {getInitials(currentUser.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#24352C] truncate">
                    {currentUser.full_name}
                  </p>
                  <p className="text-[11px] text-[#5E7166] truncate capitalize">
                    {currentUser.role || 'Administrador'}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5E7166] shrink-0" />
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-[#E8E2D8] p-2 shadow-xl z-50 space-y-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN AREA (Top bar + Page content) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8E2D8] px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Mobile-only header view */}
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

          {/* Desktop-only breadcrumb header (Exact Mockup: Estilo / Sucursal Central ⌵  ...  (M) ⌵) */}
          <div className="hidden lg:flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-sm text-[#24352C]">{currentOrg.name}</span>
              <span className="text-[#CCD6D0]">/</span>
              <button
                type="button"
                className="flex items-center gap-1 font-medium text-xs text-[#5E7166] hover:text-[#24352C] cursor-pointer"
              >
                <span>{currentBranch.name}</span>
                <ChevronDown className="w-3 h-3 text-[#5E7166]" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="w-8 h-8 rounded-full bg-[#E5E0D8] text-[#24352C] font-bold text-xs flex items-center justify-center shadow-2xs">
                  {currentUser.full_name.charAt(0)}
                </div>
                <ChevronDown className="w-3 h-3 text-[#5E7166]" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto ${currentUser.is_superadmin ? '' : 'pb-24 lg:pb-8'}`}>
          {children}
        </main>
      </div>

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
