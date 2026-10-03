-- ============================================================================
-- TURNOPRO SAAS - SCRIPT SQL COMPLETO PARA SUPABASE
-- Pega este script en el "SQL Editor" de tu proyecto de Supabase y haz clic en "Run"
-- ============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUM
DO $$ BEGIN
  CREATE TYPE member_role AS ENUM (
    'owner', 'admin', 'branch_manager', 'receptionist', 'professional', 'cashier', 'customer'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'pending_verification', 'pending_approval', 'pending_payment', 'confirmed',
    'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending', 'authorized', 'partially_paid', 'paid', 'refunded', 'voided'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cash', 'credit_card', 'debit_card', 'bank_transfer', 'mercadopago', 'stripe', 'deposit_credit'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM (
    'purchase_in', 'sale_out', 'service_consumption', 'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out', 'return_in'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE cash_session_status AS ENUM ('open', 'closed', 'audited');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. TABLAS PRINCIPALES

-- 3.1 PROFILES (Usuarios del sistema)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_superadmin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 ORGANIZATIONS (Negocios / Comercios SaaS)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL DEFAULT 'general',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#335946',
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  currency TEXT NOT NULL DEFAULT 'ARS',
  default_timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  account_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 BRANCHES (Sucursales)
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address_line TEXT,
  city TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, slug)
);

-- 3.4 MEMBERSHIPS (Vínculo usuario - comercio - rol)
CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'receptionist',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- 3.5 PROFESSIONALS (Trabajadores / Especialistas del comercio)
CREATE TABLE IF NOT EXISTS professionals (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  specialty TEXT,
  bio TEXT,
  avatar_url TEXT,
  color_tag TEXT NOT NULL DEFAULT '#2A5C43',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  commission_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
  branch_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 SERVICES (Catálogo de Servicios)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  prep_buffer_minutes INT NOT NULL DEFAULT 0,
  clean_buffer_minutes INT NOT NULL DEFAULT 0,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 RESOURCES (Cabinas, Sillones, Box, Equipos)
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'station',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 WORKING HOURS (Horarios de atención)
CREATE TABLE IF NOT EXISTS working_hours (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  professional_id TEXT REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (close_time > open_time)
);

-- 3.9 CUSTOMERS (Clientes del comercio)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  notes TEXT,
  confidential_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
  total_appointments INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 APPOINTMENTS (Turnos)
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  professional_id TEXT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status appointment_status NOT NULL DEFAULT 'confirmed',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  service_duration_minutes INT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  customer_notes TEXT,
  internal_notes TEXT,
  booking_channel TEXT NOT NULL DEFAULT 'admin_backoffice',
  management_token TEXT NOT NULL,
  management_token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

-- 3.11 PRODUCTS & INVENTORY (Stock)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(12, 2) NOT NULL CHECK (sale_price >= 0),
  tax_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
  min_stock_alert INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  current_stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type stock_movement_type NOT NULL,
  quantity INT NOT NULL,
  unit_cost NUMERIC(12, 2),
  reason TEXT NOT NULL,
  performed_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.12 CASH SESSIONS & SALES (Caja y Ventas POS)
CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  status cash_session_status NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opened_by_name TEXT NOT NULL,
  initial_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  actual_cash NUMERIC(12, 2),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  cash_session_id TEXT REFERENCES cash_sessions(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  professional_id TEXT REFERENCES professionals(id) ON DELETE SET NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  paid_amount NUMERIC(12, 2) NOT NULL,
  deposit_credit_applied NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_method payment_method NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.13 AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÍNDICES DE VELOCIDAD
CREATE INDEX IF NOT EXISTS idx_appointments_org_time ON appointments (organization_id, branch_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_customers_org_phone ON customers (organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_sales_org_date ON sales (organization_id, created_at);

-- 5. DATOS INICIALES (SEMILLA)

-- 5.1 Cuenta Super Admin y Cuenta Cliente Peluquería
INSERT INTO profiles (id, username, password, email, full_name, phone, is_superadmin)
VALUES 
  ('user-admin', 'admin', 'admin123', 'admin@turnopro.com', 'Super Administrador', '+54 11 0000-0000', TRUE),
  ('user-peluqueria', 'peluqueria', 'password123', 'contacto@estilobarber.com', 'Martín (Titular Peluquería)', '+54 11 2233-4455', FALSE)
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password, username = EXCLUDED.username;

-- 5.2 Negocio Peluquería
INSERT INTO organizations (id, name, slug, industry, contact_email, contact_phone, account_config)
VALUES (
  'org-peluqueria',
  'Peluquería & Barbería Estilo',
  'peluqueria-barberia-estilo',
  'barbershop',
  'contacto@estilobarber.com',
  '+54 11 2233-4455',
  '{
    "subscription_type": "lifetime",
    "subscription_status": "active",
    "subscription_label": "Cuenta Vitalicia (Sin Vencimiento)",
    "delegation_mode": "single",
    "max_branches": 3,
    "enabled_modules": {"pos": true, "inventory": true, "crm": true, "online_booking": true, "financial_reports": true, "whatsapp_reminders": true}
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 5.3 Sucursal Central
INSERT INTO branches (id, organization_id, name, slug, address_line, city, phone)
VALUES (
  'branch-central',
  'org-peluqueria',
  'Casa Central Palermo',
  'palermo-central',
  'Av. Santa Fe 3420',
  'Buenos Aires',
  '+54 11 4455-6677'
)
ON CONFLICT (id) DO NOTHING;

-- 5.4 Membresía del titular
INSERT INTO organization_members (id, organization_id, user_id, role)
VALUES ('mem-peluqueria-owner', 'org-peluqueria', 'user-peluqueria', 'owner')
ON CONFLICT (id) DO NOTHING;

-- 5.5 Trabajadores / Profesionales
INSERT INTO professionals (id, organization_id, display_name, specialty, color_tag, is_public, commission_rate_pct, branch_ids)
VALUES 
  ('prof-mateo', 'org-peluqueria', 'Mateo (Barbero Principal)', 'Corte Clásico & Fade', '#2A5C43', TRUE, 50.00, ARRAY['branch-central']),
  ('prof-lucas', 'org-peluqueria', 'Lucas (Color & Barba)', 'Colorimetría & Perfilado', '#8C6B32', TRUE, 45.00, ARRAY['branch-central'])
ON CONFLICT (id) DO NOTHING;

-- 5.6 Catálogo de Servicios
INSERT INTO services (id, organization_id, name, category, duration_minutes, price, deposit_amount)
VALUES 
  ('srv-corte', 'org-peluqueria', 'Corte Clásico & Fade', 'Barbería', 40, 15000, 0),
  ('srv-barba', 'org-peluqueria', 'Perfilado y Afeitado Tradicional', 'Barbería', 30, 9000, 0),
  ('srv-combo', 'org-peluqueria', 'Combo Corte + Barba + Ritual', 'Promociones', 60, 21000, 5000),
  ('srv-color', 'org-peluqueria', 'Colorimetría / Decoloración Global', 'Color', 90, 32000, 10000)
ON CONFLICT (id) DO NOTHING;

-- 5.7 Clientes
INSERT INTO customers (id, organization_id, full_name, phone, email, tags, total_appointments, total_spent)
VALUES 
  ('cust-lucas', 'org-peluqueria', 'Lucas Rossi', '+54 11 4455-8899', 'lucas.rossi@email.com', ARRAY['Frecuente', 'Puntual'], 8, 115000),
  ('cust-valeria', 'org-peluqueria', 'Valeria Gómez', '+54 11 3322-1144', 'valeria.g@email.com', ARRAY['Fade', 'Premium'], 5, 84000),
  ('cust-franco', 'org-peluqueria', 'Franco Benítez', '+54 11 6677-8899', 'franco.b@email.com', ARRAY['Nuevo'], 1, 15000)
ON CONFLICT (id) DO NOTHING;

-- 5.8 Productos
INSERT INTO products (id, organization_id, name, category, cost_price, sale_price, current_stock)
VALUES 
  ('prod-pomada', 'org-peluqueria', 'Pomada Mate Fijación Fuerte (100g)', 'Styling', 5000, 12500, 24),
  ('prod-aceite', 'org-peluqueria', 'Aceite para Barba y Bigote (30ml)', 'Cuidado Personal', 3800, 9800, 15),
  ('prod-shampoo', 'org-peluqueria', 'Shampoo Anticaída Fortificante (250ml)', 'Tratamiento', 6200, 14200, 8)
ON CONFLICT (id) DO NOTHING;

-- Mensaje de confirmación final
SELECT 'Base de datos de TurnoPro creada y poblada exitosamente con la cuenta Admin y la cuenta Peluquería!' AS resultado;
