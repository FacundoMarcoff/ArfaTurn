export type MemberRole =
  | 'owner'
  | 'admin'
  | 'branch_manager'
  | 'receptionist'
  | 'professional'
  | 'cashier'
  | 'customer';

export type AppointmentStatus =
  | 'pending_verification'
  | 'pending_approval'
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'expired';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'partially_paid'
  | 'paid'
  | 'refunded'
  | 'voided';

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'mercadopago'
  | 'stripe'
  | 'deposit_credit';

export type StockMovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'service_consumption'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'transfer_in'
  | 'transfer_out'
  | 'return_in';

export type CashSessionStatus = 'open' | 'closed' | 'audited';

export interface Profile {
  id: string;
  username: string; // Login principal por usuario
  password?: string; // Contraseña del usuario
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_superadmin?: boolean;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  branch_ids?: string[];
  is_active: boolean;
  created_at: string;
}

export type OrganizationDelegationMode = 'full' | 'single' | 'custom';

export type SubscriptionType = 'demo_7d' | '3_months' | '6_months' | '12_months' | 'vitalicio';
export type SubscriptionStatus = 'trial' | 'active' | 'lifetime' | 'expired';

export interface EnabledModulesConfig {
  inventory: boolean;
  sales_pos: boolean;
  audit: boolean;
  confidential_notes: boolean;
  deposits: boolean;
  multi_service: boolean;
  client_merging: boolean;
}

export interface OrganizationAccountConfig {
  plan_tier: 'starter' | 'growth' | 'enterprise' | 'custom';
  tier_name: string;
  delegation_mode: OrganizationDelegationMode;
  allowed_roles: MemberRole[];
  max_branches: number; // 1, 2, or 99 (unlimited)
  max_professionals: number;
  enabled_modules: EnabledModulesConfig;
  allow_role_delegation: boolean;
  // Suscripción configurada por los administradores
  subscription_type: SubscriptionType;
  subscription_status: SubscriptionStatus;
  subscription_started_at: string;
  subscription_expires_at: string | null; // null si es vitalicio
  subscription_label: string;
  // Credenciales asignadas al dueño del comercio por el admin
  owner_username?: string;
  owner_password?: string;
  notes?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: 'barbershop' | 'salon' | 'clinic' | 'spa' | 'consultorio' | 'general';
  logo_url?: string;
  primary_color: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  currency: string;
  default_timezone: string;
  is_active: boolean;
  account_config: OrganizationAccountConfig;
  created_at: string;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  phone?: string;
  timezone: string;
  currency: string;
  min_advance_minutes: number;
  max_advance_days: number;
  cancel_window_hours: number;
  deposit_required_pct: number;
  requires_approval: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Professional {
  id: string;
  organization_id: string;
  member_id?: string;
  display_name: string;
  specialty?: string;
  bio?: string;
  avatar_url?: string;
  color_tag: string;
  is_public: boolean;
  is_active: boolean;
  commission_rate_pct: number;
  branch_ids?: string[];
  created_at: string;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: string;
  duration_minutes: number;
  prep_buffer_minutes: number;
  clean_buffer_minutes: number;
  price: number;
  deposit_amount: number;
  tax_rate_pct: number;
  is_public: boolean;
  is_active: boolean;
  requires_resource: boolean;
  assigned_professional_ids?: string[];
  created_at: string;
}

export interface Resource {
  id: string;
  organization_id: string;
  branch_id: string;
  name: string;
  resource_type: 'chair' | 'cabin' | 'room' | 'machine';
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface WorkingHour {
  id: string;
  organization_id: string;
  branch_id: string;
  professional_id?: string | null; // null = branch default
  day_of_week: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  open_time: string; // "09:00"
  close_time: string; // "19:00"
  break_start?: string; // "13:00"
  break_end?: string; // "14:00"
  is_enabled: boolean;
}

export interface Customer {
  id: string;
  organization_id: string;
  user_id?: string;
  full_name: string;
  email?: string;
  phone: string;
  notes?: string;
  confidential_notes?: string; // Medical or confidential
  tags: string[];
  is_blacklisted: boolean;
  total_appointments: number;
  total_spent: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  organization_id: string;
  branch_id: string;
  professional_id: string;
  customer_id: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  starts_at: string; // ISO 8601
  ends_at: string;   // ISO 8601
  service_duration_minutes: number;
  total_amount: number;
  deposit_amount: number;
  customer_notes?: string;
  internal_notes?: string;
  booking_channel: 'public_web' | 'admin_backoffice' | 'app';
  management_token: string;
  management_token_expires_at: string;
  idempotency_key?: string;
  created_at: string;

  // Joined fields for UI convenience
  customer?: Customer;
  professional?: Professional;
  service?: Service;
  branch?: Branch;
}

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category: string;
  cost_price: number;
  sale_price: number;
  tax_rate_pct: number;
  min_stock_alert: number;
  is_active: boolean;
  current_stock: number; // calculated or branch specific
  created_at: string;
}

export interface StockMovement {
  id: string;
  organization_id: string;
  branch_id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  cost_per_unit?: number;
  reference_id?: string;
  reason: string;
  performed_by_name: string;
  created_at: string;
  product_name?: string;
}

export interface CashSession {
  id: string;
  organization_id: string;
  branch_id: string;
  opened_by_name: string;
  closed_by_name?: string;
  status: CashSessionStatus;
  initial_amount: number;
  actual_closed_amount?: number;
  expected_closed_amount?: number;
  difference_amount?: number;
  notes?: string;
  opened_at: string;
  closed_at?: string;
}

export interface Sale {
  id: string;
  organization_id: string;
  branch_id: string;
  cash_session_id?: string;
  customer_id?: string;
  appointment_id?: string;
  professional_id?: string;
  receipt_number: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  customer_name?: string;
  professional_name?: string;
  items: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  service_id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_rate_pct: number;
  line_total: number;
}

export interface AuditEvent {
  id: string;
  organization_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
