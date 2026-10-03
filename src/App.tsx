/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TenantProvider } from './lib/store/tenant-context';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PublicBookingPage } from './pages/public/PublicBookingPage';
import { CustomerAppointmentManagePage } from './pages/public/CustomerAppointmentManagePage';
import { CalendarPage } from './pages/admin/CalendarPage';
import { ClientsPage } from './pages/admin/ClientsPage';
import { ServicesResourcesPage } from './pages/admin/ServicesResourcesPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { SalesCashPage } from './pages/admin/SalesCashPage';
import { TeamPage } from './pages/admin/TeamPage';
import { BranchesSettingsPage } from './pages/admin/BranchesSettingsPage';
import { AccountsAdminPage } from './pages/admin/AccountsAdminPage';
import { AuditPage } from './pages/admin/AuditPage';
import { DocsPage } from './pages/DocsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            {/* Default entrypoint: Direct to Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/landing" element={<HomePage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public Client Booking Flow */}
            <Route path="/reservar/:slug" element={<PublicBookingPage />} />
            <Route path="/mi-turno/:token" element={<CustomerAppointmentManagePage />} />

            {/* Backoffice Administration Area */}
            <Route path="/admin" element={<Navigate to="/admin/calendar" replace />} />
            <Route
              path="/admin/calendar"
              element={
                <AppLayout>
                  <CalendarPage />
                </AppLayout>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <AppLayout>
                  <ClientsPage />
                </AppLayout>
              }
            />
            <Route
              path="/admin/services"
              element={
                <AppLayout>
                  <ServicesResourcesPage />
                </AppLayout>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AppLayout>
                  <InventoryPage />
                </AppLayout>
              }
            />
            <Route
              path="/admin/sales"
              element={
                <AppLayout>
                  <SalesCashPage />
                </AppLayout>
              }
            />
            <Route
              path="/admin/team"
              element={
                <AppLayout>
                  <TeamPage />
                </AppLayout>
              }
            />
            <Route
              path="/admin/branches"
              element={
                <AppLayout>
                  <BranchesSettingsPage />
                </AppLayout>
              }
            />
            <Route
              path="/admin/accounts"
              element={
                <AppLayout>
                  <AccountsAdminPage />
                </AppLayout>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <AppLayout>
                  <AuditPage />
                </AppLayout>
              }
            />
            <Route
              path="/docs"
              element={
                <AppLayout>
                  <DocsPage />
                </AppLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </QueryClientProvider>
  );
}
