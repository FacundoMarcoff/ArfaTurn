import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Organization,
  Branch,
  Professional,
  Service,
  Resource,
  WorkingHour,
  Customer,
  Appointment,
  Product,
  StockMovement,
  CashSession,
  Sale,
  AuditEvent,
  MemberRole,
  AppointmentStatus,
  StockMovementType,
  PaymentMethod,
  OrganizationAccountConfig,
  OrganizationDelegationMode,
  SubscriptionType,
  SubscriptionStatus,
  EnabledModulesConfig,
  Profile,
  OrganizationMember,
} from '../../types/database.types';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_BRANCHES,
  INITIAL_PROFESSIONALS,
  INITIAL_SERVICES,
  INITIAL_RESOURCES,
  INITIAL_WORKING_HOURS,
  INITIAL_CUSTOMERS,
  INITIAL_APPOINTMENTS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_CASH_SESSIONS,
  INITIAL_SALES,
  INITIAL_AUDIT_EVENTS,
  INITIAL_PROFILES,
  INITIAL_MEMBERSHIPS,
} from './demo-data';
import { INDUSTRIES_METADATA } from '../constants/industries';

interface TenantContextType {
  currentOrg: Organization;
  currentBranch: Branch;
  currentRole: MemberRole;
  organizations: Organization[];
  branches: Branch[];
  professionals: Professional[];
  services: Service[];
  resources: Resource[];
  workingHours: WorkingHour[];
  customers: Customer[];
  appointments: Appointment[];
  products: Product[];
  stockMovements: StockMovement[];
  cashSessions: CashSession[];
  sales: Sale[];
  auditEvents: AuditEvent[];

  // Mutators
  switchOrganization: (orgId: string) => void;
  switchBranch: (branchId: string) => void;
  switchRole: (role: MemberRole) => void;

  // Appointments
  createAppointment: (params: {
    branchId: string;
    professionalId: string;
    serviceId: string;
    startsAt: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerNotes?: string;
    depositPaid?: number;
    paymentMethod?: PaymentMethod;
  }) => { success: boolean; appointment?: Appointment; message?: string };

  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  rescheduleAppointment: (appointmentId: string, newStartsAt: string, newProfessionalId?: string) => { success: boolean; message?: string };
  cancelAppointment: (appointmentId: string, reason?: string) => { success: boolean; message?: string };

  // Customers
  createCustomer: (customerData: Partial<Customer> & { full_name: string; phone: string }) => Customer;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  mergeCustomers: (primaryId: string, duplicateId: string) => { success: boolean; message?: string };

  // Services & Resources
  createService: (serviceData: Omit<Service, 'id' | 'organization_id' | 'created_at'>) => Service;
  updateService: (serviceId: string, updates: Partial<Service>) => void;

  // Professionals & Team Workers
  createProfessional: (data: {
    displayName: string;
    specialty?: string;
    commissionRatePct?: number;
    colorTag?: string;
    isPublic?: boolean;
  }) => Professional;
  deleteProfessional: (profId: string) => { success: boolean; message?: string };

  // Inventory & Stock
  recordStockMovement: (params: {
    productId: string;
    branchId: string;
    movementType: StockMovementType;
    quantity: number;
    reason: string;
  }) => { success: boolean; message?: string };

  // Cash & Sales
  openCashSession: (initialAmount: number, notes?: string) => void;
  closeCashSession: (actualAmount: number, notes?: string) => void;
  createSale: (saleData: {
    branchId: string;
    customerId?: string;
    appointmentId?: string;
    professionalId?: string;
    items: Array<{ serviceId?: string; productId?: string; description: string; quantity: number; unitPrice: number; discountRate?: number }>;
    paymentMethod: PaymentMethod;
    depositCreditApplied?: number;
    notes?: string;
  }) => { success: boolean; sale?: Sale; message?: string };

  // Account & Tenant Administration (Super Admin / Admin de Cuentas)
  updateOrganizationAccountConfig: (orgId: string, updates: Partial<OrganizationAccountConfig>) => void;
  updateOrganizationSubscription: (orgId: string, subscriptionType: SubscriptionType) => void;
  createBranch: (params: { name: string; address?: string; city?: string; phone?: string; timezone?: string }) => { success: boolean; branch?: Branch; message?: string };
  toggleBranchActive: (branchId: string) => { success: boolean; message?: string };
  createOrganization: (orgData: {
    name: string;
    industry: Organization['industry'];
    username: string; // Login por usuario asignado por el admin
    password?: string;
    ownerFullName?: string;
    subscriptionType?: SubscriptionType;
    currency?: string;
    maxBranches?: number;
    delegationMode?: OrganizationDelegationMode;
    allowedRoles?: MemberRole[];
    enabledModules?: Partial<EnabledModulesConfig>;
    notes?: string;
  }) => Organization;
  deleteOrganization: (orgId: string) => { success: boolean };

  // Auth & Multi-Account / Multi-Rubro Workspace Access
  currentUser: Profile | null;
  profiles: Profile[];
  memberships: OrganizationMember[];
  userOrganizations: Array<{ organization: Organization; membership: OrganizationMember }>;
  login: (identifier: string, password?: string, remember?: boolean) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  rememberDevice: boolean;
  rememberedUsername: string;
  setRememberedAccount: (username: string | null) => void;
  registerUserAndOrg: (params: {
    fullName: string;
    email: string;
    username?: string;
    password?: string;
    businessName: string;
    industry: Organization['industry'];
    delegationMode?: OrganizationDelegationMode;
    branchesCount?: number;
    subscriptionType?: SubscriptionType;
  }) => { success: boolean; organization?: Organization; message?: string };
  updateUserProfile: (userId: string, updates: Partial<Profile>) => void;
  resetToDemoData: () => void;
}

export function calculateSubscriptionDetails(subscriptionType: SubscriptionType) {
  const now = Date.now();
  switch (subscriptionType) {
    case 'demo_7d': {
      const expiresAt = new Date(now + 7 * 86400000).toISOString();
      return {
        type: 'demo_7d' as SubscriptionType,
        status: 'trial' as SubscriptionStatus,
        started_at: new Date(now).toISOString(),
        expires_at: expiresAt,
        label: 'Demo 1 Semana (7 Días)',
      };
    }
    case 'vitalicio': {
      return {
        type: 'vitalicio' as SubscriptionType,
        status: 'lifetime' as SubscriptionStatus,
        started_at: new Date(now).toISOString(),
        expires_at: null,
        label: 'Socio Vitalicio (Sin Vencimiento)',
      };
    }
    case '3_months': {
      const expiresAt = new Date(now + 90 * 86400000).toISOString();
      return {
        type: '3_months' as SubscriptionType,
        status: 'active' as SubscriptionStatus,
        started_at: new Date(now).toISOString(),
        expires_at: expiresAt,
        label: 'Plan 3 Meses',
      };
    }
    case '6_months': {
      const expiresAt = new Date(now + 180 * 86400000).toISOString();
      return {
        type: '6_months' as SubscriptionType,
        status: 'active' as SubscriptionStatus,
        started_at: new Date(now).toISOString(),
        expires_at: expiresAt,
        label: 'Plan 6 Meses',
      };
    }
    case '12_months': {
      const expiresAt = new Date(now + 365 * 86400000).toISOString();
      return {
        type: '12_months' as SubscriptionType,
        status: 'active' as SubscriptionStatus,
        started_at: new Date(now).toISOString(),
        expires_at: expiresAt,
        label: 'Plan 12 Meses (1 Año)',
      };
    }
  }
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wipe stale legacy multi-tenant dummy data if old version detected
  const CLEAN_DATA_VERSION = 'tp_v5_clean_single_business';
  if (typeof window !== 'undefined' && localStorage.getItem('tp_clean_version') !== CLEAN_DATA_VERSION) {
    localStorage.clear();
    localStorage.setItem('tp_clean_version', CLEAN_DATA_VERSION);
  }

  // Profiles and memberships for login
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('tp_profiles');
    if (!saved) return INITIAL_PROFILES;
    try {
      const parsed: Profile[] = JSON.parse(saved);
      const hasAdmin = parsed.some((p) => p.is_superadmin || p.username === 'admin');
      if (!hasAdmin) {
        const adminProfile = INITIAL_PROFILES.find((p) => p.username === 'admin');
        if (adminProfile) parsed.push(adminProfile);
      }
      return parsed.map((p) => {
        const defaultMatch = INITIAL_PROFILES.find((init) => init.id === p.id);
        return {
          ...p,
          username: p.username || defaultMatch?.username || p.email.split('@')[0],
          password: p.password || defaultMatch?.password || 'password123',
          is_superadmin: p.is_superadmin ?? defaultMatch?.is_superadmin ?? false,
        };
      });
    } catch {
      return INITIAL_PROFILES;
    }
  });

  const [memberships, setMemberships] = useState<OrganizationMember[]>(() => {
    const saved = localStorage.getItem('tp_memberships');
    const base = saved ? JSON.parse(saved) : INITIAL_MEMBERSHIPS;
    const hasAdminMems = base.some((m: OrganizationMember) => m.user_id === 'user-admin');
    if (!hasAdminMems) {
      const adminMems = INITIAL_MEMBERSHIPS.filter((m) => m.user_id === 'user-admin');
      return [...base, ...adminMems];
    }
    return base;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    const saved = localStorage.getItem('tp_current_user_id');
    return saved !== null && saved !== '' ? saved : null;
  });

  const [rememberedUsername, setRememberedUsername] = useState<string>(() => {
    return localStorage.getItem('tp_remembered_username') || '';
  });

  const [rememberDevice, setRememberDevice] = useState<boolean>(() => {
    return localStorage.getItem('tp_remember_device') === 'true';
  });

  const setRememberedAccount = (username: string | null) => {
    if (username) {
      localStorage.setItem('tp_remembered_username', username);
      localStorage.setItem('tp_remember_device', 'true');
      setRememberedUsername(username);
      setRememberDevice(true);
    } else {
      localStorage.removeItem('tp_remembered_username');
      localStorage.removeItem('tp_remember_device');
      setRememberedUsername('');
      setRememberDevice(false);
    }
  };

  // Load from local storage or defaults with safe account_config fallback
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('tp_orgs');
    if (!saved) return INITIAL_ORGANIZATIONS;
    try {
      const parsed: Organization[] = JSON.parse(saved);
      return parsed.map((org) => {
        const defaultMatch = INITIAL_ORGANIZATIONS.find((o) => o.id === org.id);
        const defaultConfig: OrganizationAccountConfig = defaultMatch?.account_config || {
          plan_tier: 'growth',
          tier_name: 'Estándar',
          delegation_mode: 'full',
          allowed_roles: ['owner', 'admin', 'branch_manager', 'receptionist', 'professional', 'cashier'],
          max_branches: 2,
          max_professionals: 10,
          allow_role_delegation: true,
          subscription_type: 'vitalicio',
          subscription_status: 'lifetime',
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: null,
          subscription_label: 'Socio Vitalicio',
          owner_username: org.slug?.split('-')[0] || 'usuario',
          owner_password: 'password123',
          enabled_modules: {
            inventory: true,
            sales_pos: true,
            audit: true,
            confidential_notes: true,
            deposits: true,
            multi_service: true,
            client_merging: true,
          },
        };
        return {
          ...org,
          account_config: org.account_config
            ? {
                ...defaultConfig,
                ...org.account_config,
                enabled_modules: {
                  ...defaultConfig.enabled_modules,
                  ...(org.account_config.enabled_modules || {}),
                },
              }
            : defaultConfig,
        };
      });
    } catch {
      return INITIAL_ORGANIZATIONS;
    }
  });

  const [currentOrgId, setCurrentOrgId] = useState<string>(() => {
    return localStorage.getItem('tp_current_org_id') || INITIAL_ORGANIZATIONS[0]?.id || 'org-peluqueria';
  });

  const [currentBranchId, setCurrentBranchId] = useState<string>(() => {
    return localStorage.getItem('tp_current_branch_id') || INITIAL_BRANCHES[0]?.id || 'branch-central';
  });

  const [currentRole, setCurrentRole] = useState<MemberRole>(() => {
    return (localStorage.getItem('tp_current_role') as MemberRole) || 'owner';
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('tp_branches');
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
  });

  const [professionals, setProfessionals] = useState<Professional[]>(() => {
    const saved = localStorage.getItem('tp_professionals');
    return saved ? JSON.parse(saved) : INITIAL_PROFESSIONALS;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('tp_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem('tp_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(() => {
    const saved = localStorage.getItem('tp_working_hours');
    return saved ? JSON.parse(saved) : INITIAL_WORKING_HOURS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('tp_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('tp_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('tp_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('tp_stock_movements');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  const [cashSessions, setCashSessions] = useState<CashSession[]>(() => {
    const saved = localStorage.getItem('tp_cash_sessions');
    return saved ? JSON.parse(saved) : INITIAL_CASH_SESSIONS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('tp_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem('tp_audit_events');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_EVENTS;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('tp_orgs', JSON.stringify(organizations));
    localStorage.setItem('tp_current_org_id', currentOrgId);
    localStorage.setItem('tp_current_branch_id', currentBranchId);
    localStorage.setItem('tp_current_role', currentRole);
    localStorage.setItem('tp_branches', JSON.stringify(branches));
    localStorage.setItem('tp_professionals', JSON.stringify(professionals));
    localStorage.setItem('tp_services', JSON.stringify(services));
    localStorage.setItem('tp_resources', JSON.stringify(resources));
    localStorage.setItem('tp_working_hours', JSON.stringify(workingHours));
    localStorage.setItem('tp_customers', JSON.stringify(customers));
    localStorage.setItem('tp_appointments', JSON.stringify(appointments));
    localStorage.setItem('tp_products', JSON.stringify(products));
    localStorage.setItem('tp_stock_movements', JSON.stringify(stockMovements));
    localStorage.setItem('tp_cash_sessions', JSON.stringify(cashSessions));
    localStorage.setItem('tp_sales', JSON.stringify(sales));
    localStorage.setItem('tp_audit_events', JSON.stringify(auditEvents));
    localStorage.setItem('tp_profiles', JSON.stringify(profiles));
    localStorage.setItem('tp_memberships', JSON.stringify(memberships));
    if (currentUserId) {
      localStorage.setItem('tp_current_user_id', currentUserId);
    } else {
      localStorage.removeItem('tp_current_user_id');
    }
  }, [
    organizations,
    currentOrgId,
    currentBranchId,
    currentRole,
    branches,
    professionals,
    services,
    resources,
    workingHours,
    customers,
    appointments,
    products,
    stockMovements,
    cashSessions,
    sales,
    auditEvents,
    profiles,
    memberships,
    currentUserId,
  ]);

  const currentUser = profiles.find((p) => p.id === currentUserId) || null;

  // Organizations accessible by the currently logged-in user
  const userOrganizations = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.is_superadmin) {
      return organizations.map((org) => {
        const mem = memberships.find((m) => m.organization_id === org.id && m.user_id === currentUser.id);
        return {
          organization: org,
          membership: mem || {
            id: `mem-admin-${org.id}`,
            organization_id: org.id,
            user_id: currentUser.id,
            role: 'owner' as MemberRole,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        };
      });
    }

    const userMems = memberships.filter((m) => m.user_id === currentUser.id && m.is_active);
    return userMems
      .map((mem) => {
        const org = organizations.find((o) => o.id === mem.organization_id);
        if (!org) return null;
        return {
          organization: org,
          membership: mem,
        };
      })
      .filter(Boolean) as Array<{ organization: Organization; membership: OrganizationMember }>;
  }, [currentUser, memberships, organizations]);

  const currentOrg = organizations.find((o) => o.id === currentOrgId) || organizations[0];
  const orgBranches = branches.filter((b) => b.organization_id === currentOrg.id);
  const currentBranch = orgBranches.find((b) => b.id === currentBranchId) || orgBranches[0] || branches[0];

  const switchOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (!org) return;
    setCurrentOrgId(org.id);
    const validBranches = branches.filter((b) => b.organization_id === org.id);
    if (validBranches.length > 0) {
      setCurrentBranchId(validBranches[0].id);
    }
  };

  const switchBranch = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setCurrentBranchId(branch.id);
      if (branch.organization_id !== currentOrgId) {
        setCurrentOrgId(branch.organization_id);
      }
    }
  };

  const switchRole = (role: MemberRole) => {
    setCurrentRole(role);
  };

  // Log audit helper
  const addAudit = (action: string, resourceType: string, resourceId: string, metadata: Record<string, unknown> = {}) => {
    const newEvent: AuditEvent = {
      id: `aud-${Date.now()}`,
      organization_id: currentOrg.id,
      user_name: `${currentRole.toUpperCase()}`,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      created_at: new Date().toISOString(),
    };
    setAuditEvents((prev) => [newEvent, ...prev]);
  };

  // Create appointment atomically with conflict prevention
  const createAppointment = (params: {
    branchId: string;
    professionalId: string;
    serviceId: string;
    startsAt: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerNotes?: string;
    depositPaid?: number;
    paymentMethod?: PaymentMethod;
  }) => {
    const service = services.find((s) => s.id === params.serviceId);
    if (!service) return { success: false, message: 'Servicio no encontrado' };

    const startDate = new Date(params.startsAt);
    const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);

    // Conflict check
    const hasConflict = appointments.some((appt) => {
      if (appt.professional_id !== params.professionalId) return false;
      if (['cancelled', 'expired', 'no_show'].includes(appt.status)) return false;

      const apptStart = new Date(appt.starts_at);
      const apptEnd = new Date(appt.ends_at);
      return startDate < apptEnd && endDate > apptStart;
    });

    if (hasConflict) {
      return {
        success: false,
        message: 'Conflicto de horario: El profesional ya tiene un turno reservado en ese intervalo.',
      };
    }

    // Upsert Customer
    let customer = customers.find((c) => c.organization_id === currentOrg.id && c.phone === params.customerPhone);
    if (!customer) {
      customer = {
        id: `cust-${Date.now()}`,
        organization_id: currentOrg.id,
        full_name: params.customerName,
        phone: params.customerPhone,
        email: params.customerEmail,
        notes: '',
        tags: ['Nuevo'],
        is_blacklisted: false,
        total_appointments: 1,
        total_spent: service.price,
        created_at: new Date().toISOString(),
      };
      setCustomers((prev) => [...prev, customer!]);
    } else {
      customer = {
        ...customer,
        full_name: params.customerName,
        email: params.customerEmail || customer.email,
        total_appointments: customer.total_appointments + 1,
      };
      setCustomers((prev) => prev.map((c) => (c.id === customer!.id ? customer! : c)));
    }

    const managementToken = `tok-${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    const deposit = params.depositPaid || service.deposit_amount || 0;

    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      organization_id: currentOrg.id,
      branch_id: params.branchId,
      professional_id: params.professionalId,
      customer_id: customer.id,
      status: 'confirmed',
      payment_status: deposit > 0 ? (deposit >= service.price ? 'paid' : 'partially_paid') : 'pending',
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
      service_duration_minutes: service.duration_minutes,
      total_amount: service.price,
      deposit_amount: deposit,
      customer_notes: params.customerNotes,
      booking_channel: 'public_web',
      management_token: managementToken,
      management_token_expires_at: new Date(Date.now() + 60 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      service: service,
    };

    setAppointments((prev) => [...prev, newAppointment]);
    addAudit('appointment.created', 'appointments', newAppointment.id, {
      customer_name: params.customerName,
      professional_id: params.professionalId,
      starts_at: params.startsAt,
      service: service.name,
    });

    return { success: true, appointment: newAppointment };
  };

  const updateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((appt) => (appt.id === appointmentId ? { ...appt, status } : appt))
    );
    addAudit('appointment.status_updated', 'appointments', appointmentId, { new_status: status });
  };

  const rescheduleAppointment = (appointmentId: string, newStartsAt: string, newProfessionalId?: string) => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, message: 'Turno no encontrado' };

    const targetProfId = newProfessionalId || appt.professional_id;
    const startDate = new Date(newStartsAt);
    const endDate = new Date(startDate.getTime() + appt.service_duration_minutes * 60000);

    // Overlap validation
    const hasConflict = appointments.some((other) => {
      if (other.id === appt.id) return false;
      if (other.professional_id !== targetProfId) return false;
      if (['cancelled', 'expired', 'no_show'].includes(other.status)) return false;

      const otherStart = new Date(other.starts_at);
      const otherEnd = new Date(other.ends_at);
      return startDate < otherEnd && endDate > otherStart;
    });

    if (hasConflict) {
      return {
        success: false,
        message: 'No es posible reprogramar: el horario entra en conflicto con otro turno reservado.',
      };
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              starts_at: startDate.toISOString(),
              ends_at: endDate.toISOString(),
              professional_id: targetProfId,
              status: 'confirmed',
            }
          : a
      )
    );

    addAudit('appointment.rescheduled', 'appointments', appointmentId, {
      previous_starts_at: appt.starts_at,
      new_starts_at: startDate.toISOString(),
    });

    return { success: true };
  };

  const cancelAppointment = (appointmentId: string, reason?: string) => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return { success: false, message: 'Turno no encontrado' };

    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: 'cancelled', internal_notes: reason } : a))
    );

    addAudit('appointment.cancelled', 'appointments', appointmentId, { reason });
    return { success: true };
  };

  // Customer handlers
  const createCustomer = (data: Partial<Customer> & { full_name: string; phone: string }) => {
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      organization_id: currentOrg.id,
      full_name: data.full_name,
      phone: data.phone,
      email: data.email || '',
      notes: data.notes || '',
      confidential_notes: data.confidential_notes || '',
      tags: data.tags || ['Nuevo'],
      is_blacklisted: false,
      total_appointments: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, newCust]);
    addAudit('customer.created', 'customers', newCust.id, { name: newCust.full_name });
    return newCust;
  };

  const updateCustomer = (customerId: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, ...updates } : c))
    );
    addAudit('customer.updated', 'customers', customerId, updates);
  };

  const mergeCustomers = (primaryId: string, duplicateId: string) => {
    const primary = customers.find((c) => c.id === primaryId);
    const duplicate = customers.find((c) => c.id === duplicateId);

    if (!primary || !duplicate) {
      return { success: false, message: 'Uno de los clientes no existe' };
    }

    // Move appointments from duplicate to primary
    setAppointments((prev) =>
      prev.map((a) => (a.customer_id === duplicateId ? { ...a, customer_id: primaryId } : a))
    );

    // Merge notes & totals
    const mergedNotes = [primary.notes, duplicate.notes].filter(Boolean).join(' | ');
    const mergedTags = Array.from(new Set([...primary.tags, ...duplicate.tags]));

    setCustomers((prev) =>
      prev
        .filter((c) => c.id !== duplicateId)
        .map((c) =>
          c.id === primaryId
            ? {
                ...c,
                total_appointments: primary.total_appointments + duplicate.total_appointments,
                total_spent: primary.total_spent + duplicate.total_spent,
                notes: mergedNotes,
                tags: mergedTags,
              }
            : c
        )
    );

    addAudit('customer.merged', 'customers', primaryId, {
      merged_from_id: duplicateId,
      previous_name: duplicate.full_name,
    });

    return { success: true };
  };

  // Services
  const createService = (data: Omit<Service, 'id' | 'organization_id' | 'created_at'>) => {
    const newService: Service = {
      ...data,
      id: `srv-${Date.now()}`,
      organization_id: currentOrg.id,
      created_at: new Date().toISOString(),
    };
    setServices((prev) => [...prev, newService]);
    addAudit('service.created', 'services', newService.id, { name: newService.name });
    return newService;
  };

  const updateService = (serviceId: string, updates: Partial<Service>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s))
    );
    addAudit('service.updated', 'services', serviceId, updates);
  };

  // Professionals & Team Workers
  const createProfessional = (data: {
    displayName: string;
    specialty?: string;
    commissionRatePct?: number;
    colorTag?: string;
    isPublic?: boolean;
  }) => {
    const newProf: Professional = {
      id: `prof-${Date.now()}`,
      organization_id: currentOrg.id,
      display_name: data.displayName,
      specialty: data.specialty || 'Profesional de Servicio',
      commission_rate_pct: data.commissionRatePct ?? 50,
      color_tag: data.colorTag || '#2A5C43',
      is_public: data.isPublic ?? true,
      is_active: true,
      branch_ids: [currentBranch.id],
      created_at: new Date().toISOString(),
    };
    setProfessionals((prev) => [...prev, newProf]);
    addAudit('professional.created', 'professionals', newProf.id, { name: newProf.display_name });
    return newProf;
  };

  const deleteProfessional = (profId: string) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== profId));
    addAudit('professional.deleted', 'professionals', profId, {});
    return { success: true };
  };

  // Stock & Inventory
  const recordStockMovement = (params: {
    productId: string;
    branchId: string;
    movementType: StockMovementType;
    quantity: number;
    reason: string;
  }) => {
    const product = products.find((p) => p.id === params.productId);
    if (!product) return { success: false, message: 'Producto no encontrado' };

    const previousStock = product.current_stock;
    const newStock = previousStock + params.quantity;

    if (newStock < 0 && !['adjustment_out', 'transfer_out'].includes(params.movementType)) {
      return { success: false, message: 'Stock insuficiente para descontar.' };
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === params.productId ? { ...p, current_stock: newStock } : p))
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      organization_id: currentOrg.id,
      branch_id: params.branchId,
      product_id: params.productId,
      movement_type: params.movementType,
      quantity: params.quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      cost_per_unit: product.cost_price,
      reason: params.reason,
      performed_by_name: `${currentRole.toUpperCase()}`,
      product_name: product.name,
      created_at: new Date().toISOString(),
    };

    setStockMovements((prev) => [movement, ...prev]);
    addAudit('stock.moved', 'products', params.productId, {
      product: product.name,
      quantity: params.quantity,
      type: params.movementType,
    });

    return { success: true };
  };

  // Cash sessions
  const openCashSession = (initialAmount: number, notes?: string) => {
    const newSession: CashSession = {
      id: `cash-ses-${Date.now()}`,
      organization_id: currentOrg.id,
      branch_id: currentBranch.id,
      opened_by_name: `${currentRole.toUpperCase()}`,
      status: 'open',
      initial_amount: initialAmount,
      opened_at: new Date().toISOString(),
      notes,
    };
    setCashSessions((prev) => [newSession, ...prev]);
    addAudit('cash_session.opened', 'cash_sessions', newSession.id, { initial_amount: initialAmount });
  };

  const closeCashSession = (actualAmount: number, notes?: string) => {
    const active = cashSessions.find((s) => s.status === 'open' && s.branch_id === currentBranch.id);
    if (!active) return;

    // Calculate expected: initial + sales with cash
    const salesInSession = sales.filter((s) => s.cash_session_id === active.id && s.payment_method === 'cash');
    const cashTotal = salesInSession.reduce((acc, curr) => acc + curr.paid_amount, 0);
    const expected = active.initial_amount + cashTotal;
    const diff = actualAmount - expected;

    setCashSessions((prev) =>
      prev.map((s) =>
        s.id === active.id
          ? {
              ...s,
              status: 'closed',
              actual_closed_amount: actualAmount,
              expected_closed_amount: expected,
              difference_amount: diff,
              closed_at: new Date().toISOString(),
              closed_by_name: `${currentRole.toUpperCase()}`,
              notes: notes || s.notes,
            }
          : s
      )
    );

    addAudit('cash_session.closed', 'cash_sessions', active.id, {
      actual: actualAmount,
      expected,
      difference: diff,
    });
  };

  // Point of Sale: Create Sale
  const createSale = (saleData: {
    branchId: string;
    customerId?: string;
    appointmentId?: string;
    professionalId?: string;
    items: Array<{ serviceId?: string; productId?: string; description: string; quantity: number; unitPrice: number; discountRate?: number }>;
    paymentMethod: PaymentMethod;
    depositCreditApplied?: number;
    notes?: string;
  }) => {
    const subtotal = saleData.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const depositCredit = saleData.depositCreditApplied || 0;
    const totalAmount = Math.max(0, subtotal - depositCredit);
    const activeCashSession = cashSessions.find((s) => s.status === 'open' && s.branch_id === saleData.branchId);

    const receiptNum = `REC-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    const cust = customers.find((c) => c.id === saleData.customerId);
    const prof = professionals.find((p) => p.id === saleData.professionalId);

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      organization_id: currentOrg.id,
      branch_id: saleData.branchId,
      cash_session_id: activeCashSession?.id,
      customer_id: saleData.customerId,
      appointment_id: saleData.appointmentId,
      professional_id: saleData.professionalId,
      receipt_number: receiptNum,
      subtotal,
      discount_amount: depositCredit,
      tax_amount: Math.round(totalAmount * 0.21),
      total_amount: totalAmount,
      paid_amount: totalAmount,
      payment_status: 'paid',
      payment_method: saleData.paymentMethod,
      notes: saleData.notes,
      created_at: new Date().toISOString(),
      customer_name: cust?.full_name,
      professional_name: prof?.display_name,
      items: saleData.items.map((it, idx) => ({
        id: `sitem-${Date.now()}-${idx}`,
        sale_id: `sale-${Date.now()}`,
        service_id: it.serviceId,
        product_id: it.productId,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        discount_rate_pct: it.discountRate || 0,
        line_total: it.quantity * it.unitPrice,
      })),
    };

    setSales((prev) => [newSale, ...prev]);

    // If sale contains products, automatically record stock deductions
    for (const item of saleData.items) {
      if (item.productId) {
        recordStockMovement({
          productId: item.productId,
          branchId: saleData.branchId,
          movementType: 'sale_out',
          quantity: -item.quantity,
          reason: `Venta POS #${receiptNum}`,
        });
      }
    }

    // If linked to an appointment, mark appointment payment as paid
    if (saleData.appointmentId) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === saleData.appointmentId ? { ...a, payment_status: 'paid' } : a))
      );
    }

    // Update customer total spent
    if (cust) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === cust.id ? { ...c, total_spent: c.total_spent + totalAmount } : c
        )
      );
    }

    addAudit('sale.completed', 'sales', newSale.id, {
      receipt_number: receiptNum,
      total_amount: totalAmount,
      method: saleData.paymentMethod,
    });

    return { success: true, sale: newSale };
  };

  // Account & Tenant Administration (Super Admin / Admin de Cuentas)
  const updateOrganizationAccountConfig = (orgId: string, updates: Partial<OrganizationAccountConfig>) => {
    setOrganizations((prev) =>
      prev.map((org) => {
        if (org.id !== orgId) return org;
        const currentConfig = org.account_config;
        const updatedConfig: OrganizationAccountConfig = {
          ...currentConfig,
          ...updates,
          enabled_modules: {
            ...currentConfig.enabled_modules,
            ...(updates.enabled_modules || {}),
          },
        };
        return {
          ...org,
          account_config: updatedConfig,
        };
      })
    );

    addAudit('organization.config_updated', 'organization', orgId, {
      updates,
    });
  };

  const createBranch = (params: { name: string; address?: string; city?: string; phone?: string; timezone?: string }) => {
    const org = currentOrg;
    const existingOrgBranches = branches.filter((b) => b.organization_id === org.id);
    const maxAllowed = org.account_config?.max_branches ?? 2;

    if (existingOrgBranches.length >= maxAllowed) {
      return {
        success: false,
        message: `Límite alcanzado: Esta cuenta tiene configurado un máximo de ${maxAllowed} sucursal(es). Como administrador puedes aumentar el límite en Configuración de Cuentas.`,
      };
    }

    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      organization_id: org.id,
      name: params.name,
      slug: params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      address: params.address || '',
      city: params.city || 'Buenos Aires',
      phone: params.phone || org.contact_phone || '',
      timezone: params.timezone || org.default_timezone || 'America/Argentina/Buenos_Aires',
      currency: org.currency || 'ARS',
      min_advance_minutes: 60,
      max_advance_days: 30,
      cancel_window_hours: 12,
      deposit_required_pct: 0,
      requires_approval: false,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setBranches((prev) => [...prev, newBranch]);
    addAudit('branch.created', 'branch', newBranch.id, { name: newBranch.name, organization_id: org.id });
    return { success: true, branch: newBranch };
  };

  const toggleBranchActive = (branchId: string) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, is_active: !b.is_active } : b))
    );
    addAudit('branch.status_toggled', 'branch', branchId, {});
    return { success: true };
  };

  const updateOrganizationSubscription = (orgId: string, subscriptionType: SubscriptionType) => {
    const sub = calculateSubscriptionDetails(subscriptionType);
    updateOrganizationAccountConfig(orgId, {
      subscription_type: sub.type,
      subscription_status: sub.status,
      subscription_started_at: sub.started_at,
      subscription_expires_at: sub.expires_at,
      subscription_label: sub.label,
    });
    addAudit('organization.subscription_updated', 'organization', orgId, {
      subscription_type: sub.type,
      label: sub.label,
    });
  };

  const createOrganization = (orgData: {
    name: string;
    industry: Organization['industry'];
    username: string;
    password?: string;
    ownerFullName?: string;
    subscriptionType?: SubscriptionType;
    currency?: string;
    maxBranches?: number;
    delegationMode?: OrganizationDelegationMode;
    allowedRoles?: MemberRole[];
    enabledModules?: Partial<EnabledModulesConfig>;
    notes?: string;
  }) => {
    const slug = orgData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newOrgId = `org-${Date.now()}`;
    const delegationMode = orgData.delegationMode || 'full';
    const allowedRoles: MemberRole[] =
      orgData.allowedRoles ||
      (delegationMode === 'single'
        ? ['owner']
        : ['owner', 'admin', 'branch_manager', 'receptionist', 'professional', 'cashier']);

    const sub = calculateSubscriptionDetails(orgData.subscriptionType || 'demo_7d');
    const assignedUsername = (orgData.username || slug).trim().toLowerCase();
    const assignedPassword = orgData.password || 'password123';
    const ownerName = orgData.ownerFullName?.trim() || `Titular ${orgData.name}`;

    const newOrg: Organization = {
      id: newOrgId,
      name: orgData.name,
      slug,
      industry: orgData.industry,
      primary_color: '#5E836F',
      currency: orgData.currency || 'ARS',
      default_timezone: 'America/Argentina/Buenos_Aires',
      is_active: true,
      created_at: new Date().toISOString(),
      account_config: {
        plan_tier: delegationMode === 'single' ? 'starter' : 'growth',
        tier_name: delegationMode === 'single' ? 'Autónomo Mono-Rol' : 'Comercio Dual',
        delegation_mode: delegationMode,
        allowed_roles: allowedRoles,
        max_branches: orgData.maxBranches ?? 1,
        max_professionals: delegationMode === 'single' ? 1 : 10,
        allow_role_delegation: delegationMode !== 'single',
        subscription_type: sub.type,
        subscription_status: sub.status,
        subscription_started_at: sub.started_at,
        subscription_expires_at: sub.expires_at,
        subscription_label: sub.label,
        owner_username: assignedUsername,
        owner_password: assignedPassword,
        enabled_modules: {
          inventory: orgData.enabledModules?.inventory ?? (delegationMode !== 'single'),
          sales_pos: orgData.enabledModules?.sales_pos ?? (delegationMode !== 'single'),
          audit: orgData.enabledModules?.audit ?? true,
          confidential_notes: orgData.enabledModules?.confidential_notes ?? true,
          deposits: orgData.enabledModules?.deposits ?? true,
          multi_service: orgData.enabledModules?.multi_service ?? true,
          client_merging: orgData.enabledModules?.client_merging ?? true,
        },
        notes: orgData.notes || `Cuenta creada por administración. Vigencia: ${sub.label}.`,
      },
    };

    const firstBranch: Branch = {
      id: `branch-${Date.now()}`,
      organization_id: newOrgId,
      name: `Sede Central - ${newOrg.name}`,
      slug: `${slug}-central`,
      address: 'Sede Principal',
      city: 'Buenos Aires',
      phone: '+54 11 4000-0000',
      timezone: newOrg.default_timezone,
      currency: newOrg.currency,
      min_advance_minutes: 60,
      max_advance_days: 30,
      cancel_window_hours: 12,
      deposit_required_pct: 0,
      requires_approval: false,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // Create user profile for the client owner
    const newUserId = `user-${assignedUsername.replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    const newProfile: Profile = {
      id: newUserId,
      username: assignedUsername,
      password: assignedPassword,
      email: `${assignedUsername}@${slug}.com`,
      full_name: ownerName,
      phone: '+54 11 0000-0000',
      is_superadmin: false,
      created_at: new Date().toISOString(),
    };

    const newMembership: OrganizationMember = {
      id: `mem-${Date.now()}`,
      organization_id: newOrgId,
      user_id: newUserId,
      role: 'owner',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // Populate initial typical professional & services
    const industryInfo = INDUSTRIES_METADATA[orgData.industry] || INDUSTRIES_METADATA.general;
    const initialServices: Service[] = industryInfo.typicalServices.map((ts, idx) => ({
      id: `srv-${newOrgId}-${idx}`,
      organization_id: newOrgId,
      name: ts.name,
      category: ts.category,
      duration_minutes: ts.duration,
      prep_buffer_minutes: 0,
      clean_buffer_minutes: 5,
      price: ts.price,
      deposit_amount: Math.round(ts.price * 0.25),
      tax_rate_pct: 21,
      is_public: true,
      is_active: true,
      requires_resource: true,
      created_at: new Date().toISOString(),
    }));

    const initialProf: Professional = {
      id: `prof-${newUserId}`,
      organization_id: newOrgId,
      display_name: ownerName,
      specialty: `Especialista en ${industryInfo.name}`,
      color_tag: '#5E836F',
      is_public: true,
      is_active: true,
      commission_rate_pct: 100,
      created_at: new Date().toISOString(),
    };

    setProfiles((prev) => [...prev, newProfile]);
    setMemberships((prev) => [...prev, newMembership]);
    setServices((prev) => [...prev, ...initialServices]);
    setProfessionals((prev) => [...prev, initialProf]);
    setOrganizations((prev) => [...prev, newOrg]);
    setBranches((prev) => [...prev, firstBranch]);

    addAudit('organization.created_by_admin', 'organization', newOrgId, {
      name: newOrg.name,
      username: assignedUsername,
      subscription: sub.label,
    });

    return newOrg;
  };

  const deleteOrganization = (orgId: string) => {
    // 1. Find user IDs linked to this organization
    const orgMems = memberships.filter((m) => m.organization_id === orgId);
    const linkedUserIds = orgMems.map((m) => m.user_id);

    // 2. Cascade delete all operational data for this organization
    setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    setMemberships((prev) => prev.filter((m) => m.organization_id !== orgId));
    setBranches((prev) => prev.filter((b) => b.organization_id !== orgId));
    setProfessionals((prev) => prev.filter((p) => p.organization_id !== orgId));
    setServices((prev) => prev.filter((s) => s.organization_id !== orgId));
    setResources((prev) => prev.filter((r) => r.organization_id !== orgId));
    setCustomers((prev) => prev.filter((c) => c.organization_id !== orgId));
    setAppointments((prev) => prev.filter((a) => a.organization_id !== orgId));
    setProducts((prev) => prev.filter((p) => p.organization_id !== orgId));
    setStockMovements((prev) => prev.filter((s) => s.organization_id !== orgId));
    setCashSessions((prev) => prev.filter((c) => c.organization_id !== orgId));
    setSales((prev) => prev.filter((s) => s.organization_id !== orgId));
    setWorkingHours((prev) => prev.filter((w) => w.organization_id !== orgId));

    // 3. Remove non-superadmin user profiles that only belonged to this organization
    setProfiles((prev) =>
      prev.filter((p) => {
        if (p.is_superadmin || p.username === 'admin') return true;
        return !linkedUserIds.includes(p.id);
      })
    );

    // 4. Update currentOrgId if needed
    const remainingOrgs = organizations.filter((o) => o.id !== orgId);
    if (currentOrgId === orgId && remainingOrgs.length > 0) {
      setCurrentOrgId(remainingOrgs[0].id);
      const remBranches = branches.filter((b) => b.organization_id === remainingOrgs[0].id);
      if (remBranches.length > 0) {
        setCurrentBranchId(remBranches[0].id);
      }
    }

    addAudit('organization.deleted_by_admin', 'organization', orgId, {});
    return { success: true };
  };

  // Auth & Multi-Account login/register actions (Con Usuario y Contraseña)
  const login = (identifier: string, password?: string, remember?: boolean) => {
    const normalized = identifier.trim().toLowerCase();
    const user = profiles.find(
      (p) => p.username?.toLowerCase() === normalized || p.email?.toLowerCase() === normalized
    );
    if (!user) {
      return {
        success: false,
        message: 'Usuario no encontrado. Verificá el nombre de usuario asignado por el administrador.',
      };
    }

    if (password && user.password && user.password !== password) {
      return {
        success: false,
        message: 'Contraseña incorrecta. Por favor verificala o contactá al administrador.',
      };
    }

    setCurrentUserId(user.id);
    localStorage.setItem('tp_current_user_id', user.id);

    if (remember) {
      setRememberedAccount(user.username || normalized);
    }

    // Switch to first organization this user belongs to
    const accessibleMems = user.is_superadmin
      ? organizations.map((o) => ({ organization_id: o.id, role: 'owner' as MemberRole }))
      : memberships.filter((m) => m.user_id === user.id && m.is_active);

    if (accessibleMems.length > 0) {
      const firstTarget = accessibleMems[0];
      const targetOrg = organizations.find((o) => o.id === firstTarget.organization_id);
      if (targetOrg) {
        setCurrentOrgId(targetOrg.id);
        const validBranches = branches.filter((b) => b.organization_id === targetOrg.id);
        if (validBranches.length > 0) {
          setCurrentBranchId(validBranches[0].id);
        }
        setCurrentRole(firstTarget.role);
      }
    }

    addAudit('auth.login', 'profile', user.id, { username: user.username, name: user.full_name });
    return { success: true };
  };

  const logout = () => {
    setCurrentUserId(null);
    localStorage.removeItem('tp_current_user_id');
  };

  const switchUser = (userId: string) => {
    const user = profiles.find((p) => p.id === userId);
    if (user) {
      login(user.username || user.email);
    }
  };

  const updateUserProfile = (userId: string, updates: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, ...updates } : p))
    );
    addAudit('profile.updated', 'profile', userId, updates as any);
  };

  const registerUserAndOrg = (params: {
    fullName: string;
    email: string;
    username?: string;
    password?: string;
    businessName: string;
    industry: Organization['industry'];
    delegationMode?: OrganizationDelegationMode;
    branchesCount?: number;
    subscriptionType?: SubscriptionType;
  }) => {
    const assignedUsername = (params.username || params.email.split('@')[0] || `user${Date.now()}`).trim().toLowerCase();
    const existing = profiles.find((p) => p.username?.toLowerCase() === assignedUsername || p.email.toLowerCase() === params.email.trim().toLowerCase());
    if (existing) {
      return { success: false, message: 'Ya existe una cuenta registrada con este usuario o correo' };
    }

    const newUserId = `user-${Date.now()}`;
    const newProfile: Profile = {
      id: newUserId,
      username: assignedUsername,
      password: params.password || 'password123',
      email: params.email.trim().toLowerCase(),
      full_name: params.fullName,
      phone: '+54 11 0000-0000',
      is_superadmin: false,
      created_at: new Date().toISOString(),
    };

    const newOrg = createOrganization({
      name: params.businessName,
      industry: params.industry,
      username: assignedUsername,
      password: params.password || 'password123',
      ownerFullName: params.fullName,
      subscriptionType: params.subscriptionType || 'demo_7d',
      currency: 'ARS',
      maxBranches: params.branchesCount ?? 1,
      delegationMode: params.delegationMode ?? 'single',
    });

    const newMembership: OrganizationMember = {
      id: `mem-${Date.now()}`,
      organization_id: newOrg.id,
      user_id: newUserId,
      role: 'owner',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // Populate initial typical services for that rubro
    const industryInfo = INDUSTRIES_METADATA[params.industry] || INDUSTRIES_METADATA.general;
    const initialServices: Service[] = industryInfo.typicalServices.map((ts, idx) => ({
      id: `srv-${newOrg.id}-${idx}`,
      organization_id: newOrg.id,
      name: ts.name,
      category: ts.category,
      duration_minutes: ts.duration,
      prep_buffer_minutes: 0,
      clean_buffer_minutes: 5,
      price: ts.price,
      deposit_amount: Math.round(ts.price * 0.25),
      tax_rate_pct: 21,
      is_public: true,
      is_active: true,
      requires_resource: true,
      created_at: new Date().toISOString(),
    }));

    // Populate initial professional (the owner)
    const initialProf: Professional = {
      id: `prof-${newUserId}`,
      organization_id: newOrg.id,
      display_name: params.fullName,
      specialty: `Especialista en ${industryInfo.name}`,
      color_tag: '#5E836F',
      is_public: true,
      is_active: true,
      commission_rate_pct: 100,
      created_at: new Date().toISOString(),
    };

    setProfiles((prev) => [...prev, newProfile]);
    setMemberships((prev) => [...prev, newMembership]);
    setServices((prev) => [...prev, ...initialServices]);
    setProfessionals((prev) => [...prev, initialProf]);

    // Log in as new user and switch to this organization
    setCurrentUserId(newUserId);
    localStorage.setItem('tp_current_user_id', newUserId);
    setCurrentOrgId(newOrg.id);
    setCurrentRole('owner');

    addAudit('auth.register', 'profile', newUserId, {
      business_name: params.businessName,
      industry: params.industry,
    });

    return { success: true, organization: newOrg };
  };

  const resetToDemoData = () => {
    localStorage.clear();
    setProfiles(INITIAL_PROFILES);
    setMemberships(INITIAL_MEMBERSHIPS);
    setCurrentUserId(null);
    setOrganizations(INITIAL_ORGANIZATIONS);
    setCurrentOrgId(INITIAL_ORGANIZATIONS[0].id);
    setCurrentBranchId(INITIAL_BRANCHES[0].id);
    setCurrentRole('owner');
    setBranches(INITIAL_BRANCHES);
    setProfessionals(INITIAL_PROFESSIONALS);
    setServices(INITIAL_SERVICES);
    setResources(INITIAL_RESOURCES);
    setWorkingHours(INITIAL_WORKING_HOURS);
    setCustomers(INITIAL_CUSTOMERS);
    setAppointments(INITIAL_APPOINTMENTS);
    setProducts(INITIAL_PRODUCTS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setCashSessions(INITIAL_CASH_SESSIONS);
    setSales(INITIAL_SALES);
    setAuditEvents(INITIAL_AUDIT_EVENTS);
  };

  return (
    <TenantContext.Provider
      value={{
        currentOrg,
        currentBranch,
        currentRole,
        organizations,
        branches,
        professionals,
        services,
        resources,
        workingHours,
        customers,
        appointments,
        products,
        stockMovements,
        cashSessions,
        sales,
        auditEvents,
        switchOrganization,
        switchBranch,
        switchRole,
        createAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        cancelAppointment,
        createCustomer,
        updateCustomer,
        mergeCustomers,
        createService,
        updateService,
        createProfessional,
        deleteProfessional,
        recordStockMovement,
        openCashSession,
        closeCashSession,
        createSale,
        updateOrganizationAccountConfig,
        updateOrganizationSubscription,
        createBranch,
        toggleBranchActive,
        createOrganization,
        deleteOrganization,
        currentUser,
        profiles,
        memberships,
        userOrganizations,
        login,
        logout,
        switchUser,
        rememberDevice,
        rememberedUsername,
        setRememberedAccount,
        registerUserAndOrg,
        updateUserProfile,
        resetToDemoData,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
