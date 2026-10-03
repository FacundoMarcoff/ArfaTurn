-- ============================================================================
-- TURNOPRO SAAS - MIGRATION 001: INITIAL SCHEMA & ATOMIC CONSTRAINTS
-- Multi-tenant appointment, CRM, inventory and sales schema with exclusion constraints
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ENUMS
CREATE TYPE member_role AS ENUM (
  'owner',
  'admin',
  'branch_manager',
  'receptionist',
  'professional',
  'cashier',
  'customer'
);

CREATE TYPE appointment_status AS ENUM (
  'pending_verification',
  'pending_approval',
  'pending_payment',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'expired'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'authorized',
  'partially_paid',
  'paid',
  'refunded',
  'voided'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'mercadopago',
  'stripe',
  'deposit_credit'
);

CREATE TYPE stock_movement_type AS ENUM (
  'purchase_in',
  'sale_out',
  'service_consumption',
  'adjustment_in',
  'adjustment_out',
  'transfer_in',
  'transfer_out',
  'return_in'
);

CREATE TYPE cash_session_status AS ENUM (
  'open',
  'closed',
  'audited'
);

-- 1. PROFILES (Users synced with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_superadmin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATIONS (Tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL DEFAULT 'general', -- 'barbershop', 'salon', 'clinic', 'spa', 'consultorio'
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4f46e5',
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  currency TEXT NOT NULL DEFAULT 'ARS',
  default_timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BRANCHES (Sucursales)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  currency TEXT NOT NULL DEFAULT 'ARS',
  min_advance_minutes INT NOT NULL DEFAULT 60, -- 1 hour minimum notice
  max_advance_days INT NOT NULL DEFAULT 30,    -- 30 days max future booking
  cancel_window_hours INT NOT NULL DEFAULT 24, -- Cancellation allowed up to 24h prior
  deposit_required_pct INT NOT NULL DEFAULT 0, -- % deposit required (0 = optional/none)
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, slug)
);

-- 4. ORGANIZATION MEMBERS (Staff membership & Organization-wide roles)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'receptionist',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- 5. BRANCH MEMBERS (Branch-level assignments)
CREATE TABLE branch_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (branch_id, member_id)
);

-- 6. PROFESSIONALS (Service Providers)
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  specialty TEXT,
  bio TEXT,
  avatar_url TEXT,
  color_tag TEXT DEFAULT '#3b82f6',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  commission_rate_pct NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SERVICES (Service Catalog)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  prep_buffer_minutes INT NOT NULL DEFAULT 0,
  clean_buffer_minutes INT NOT NULL DEFAULT 0,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  deposit_amount NUMERIC(12, 2) DEFAULT 0.00,
  tax_rate_pct NUMERIC(5, 2) DEFAULT 0.00,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  requires_resource BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROFESSIONAL SERVICES (Mapping & custom overrides)
CREATE TABLE professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  custom_duration_minutes INT,
  custom_price NUMERIC(12, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (professional_id, service_id)
);

-- 9. RESOURCES (Physical chairs, cabins, rooms, equipment)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'room', -- 'chair', 'cabin', 'machine'
  capacity INT NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. WORKING HOURS (Branch and professional schedules)
CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE, -- NULL means branch default
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),        -- 0 = Sunday, 1 = Monday
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_hours CHECK (open_time < close_time),
  CONSTRAINT valid_break CHECK (break_start IS NULL OR (break_start < break_end AND break_start >= open_time AND break_end <= close_time))
);

-- 11. SCHEDULE EXCEPTIONS (Holidays, time off, custom branch or staff days)
CREATE TABLE schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_working_day BOOLEAN NOT NULL DEFAULT FALSE,
  custom_open_time TIME,
  custom_close_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CUSTOMERS (Strictly isolated by organization)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Optional link to auth user
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  notes TEXT,                    -- General operational notes
  confidential_notes TEXT,       -- Sensitive / medical notes (accessible only to doctor/authorized)
  tags TEXT[] DEFAULT '{}',
  is_blacklisted BOOLEAN DEFAULT FALSE,
  total_appointments INT DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, phone)
);

-- 13. CUSTOMER IDENTITIES (Multi-tenancy isolation helper)
CREATE TABLE customer_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, customer_id)
);

-- 14. APPOINTMENTS (Bookings)
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status appointment_status NOT NULL DEFAULT 'confirmed',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  service_duration_minutes INT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_amount >= 0),
  internal_notes TEXT,
  customer_notes TEXT,
  booking_channel TEXT NOT NULL DEFAULT 'public_web', -- 'public_web', 'admin_backoffice', 'app'
  management_token TEXT NOT NULL UNIQUE,              -- Unpredictable cryptographically secure token for public turn management
  management_token_expires_at TIMESTAMPTZ NOT NULL,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_appointment_time CHECK (starts_at < ends_at)
);

-- PostgreSQL EXCLUSION CONSTRAINT to prevent overlapping appointments for the same professional!
ALTER TABLE appointments
ADD CONSTRAINT no_professional_overlapping_appointments
EXCLUDE USING gist (
  professional_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
)
WHERE (status NOT IN ('cancelled', 'expired', 'no_show'));

-- 15. APPOINTMENT SEGMENTS (Multi-service breakdown)
CREATE TABLE appointment_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  sequence_order INT NOT NULL DEFAULT 1,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. APPOINTMENT RESOURCES (Resource allocation per segment)
CREATE TABLE appointment_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. BOOKING HOLDS (Temporary holds while paying deposit online)
CREATE TABLE booking_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  hold_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_released BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. PRODUCTS & INVENTORY
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(12, 2) NOT NULL CHECK (sale_price >= 0),
  tax_rate_pct NUMERIC(5, 2) DEFAULT 0.00,
  min_stock_alert INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branch stock quantities
CREATE TABLE product_branch_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  current_stock INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (branch_id, product_id)
);

-- Audited stock movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type stock_movement_type NOT NULL,
  quantity INT NOT NULL,              -- Positive or negative integer
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  cost_per_unit NUMERIC(12, 2),
  reference_id TEXT,                 -- e.g. sale_id, appointment_id or adjustment ref
  reason TEXT NOT NULL,
  performed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. CASH SESSIONS (Apertura y Cierre de Caja)
CREATE TABLE cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  opened_by_id UUID NOT NULL REFERENCES profiles(id),
  closed_by_id UUID REFERENCES profiles(id),
  status cash_session_status NOT NULL DEFAULT 'open',
  initial_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  actual_closed_amount NUMERIC(12, 2),
  expected_closed_amount NUMERIC(12, 2),
  difference_amount NUMERIC(12, 2),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL, -- Positive for ingreso, negative for retiro
  reason TEXT NOT NULL,
  performed_by_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. SALES (Ventas POS)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  created_by_id UUID NOT NULL REFERENCES profiles(id),
  receipt_number TEXT NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_status payment_status NOT NULL DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, receipt_number)
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL,
  discount_rate_pct NUMERIC(5, 2) DEFAULT 0.00,
  line_total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. PAYMENTS (Pagos y Señas)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  gateway_payment_id TEXT,
  gateway_status TEXT,
  is_deposit BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. AUDIT LOG (Eventos de auditoría no mutables)
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g. 'client.merged', 'stock.adjusted', 'role.changed', 'appointment.cancelled'
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for fast agenda & query execution
CREATE INDEX idx_appointments_org_branch_time ON appointments (organization_id, branch_id, starts_at, ends_at);
CREATE INDEX idx_appointments_professional_time ON appointments (professional_id, starts_at, ends_at);
CREATE INDEX idx_appointments_customer ON appointments (customer_id);
CREATE INDEX idx_customers_org_phone ON customers (organization_id, phone);
CREATE INDEX idx_stock_product_branch ON product_branch_stock (branch_id, product_id);
CREATE INDEX idx_sales_org_created ON sales (organization_id, created_at);
CREATE INDEX idx_audit_org_created ON audit_events (organization_id, created_at);
