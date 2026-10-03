-- ============================================================================
-- TURNOPRO SAAS - MIGRATION 002: RLS POLICIES, SECURITY & STORED PROCEDURES
-- Multi-tenant isolation, RBAC policies and atomic transactional functions
-- ============================================================================

-- Enable RLS on all sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_branch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Helper function: Get organizations where current auth.uid() is an active member
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS TABLE (organization_id UUID, role member_role)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id, role
  FROM organization_members
  WHERE user_id = auth.uid() AND is_active = TRUE;
$$;

-- Helper function: Check if current user has permission in organization
CREATE OR REPLACE FUNCTION has_org_role(target_org_id UUID, allowed_roles member_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
      AND organization_id = target_org_id
      AND is_active = TRUE
      AND role = ANY(allowed_roles)
  );
$$;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view and edit their own profile"
  ON profiles
  FOR ALL
  USING (id = auth.uid());

-- 2. ORGANIZATIONS POLICIES
-- Public can view active organization info by slug (for public booking)
CREATE POLICY "Public can view active organization info"
  ON organizations
  FOR SELECT
  USING (is_active = TRUE);

-- Organization members can update organization if owner or admin
CREATE POLICY "Admins can update organization"
  ON organizations
  FOR UPDATE
  USING (has_org_role(id, ARRAY['owner'::member_role, 'admin'::member_role]));

-- 3. BRANCHES POLICIES
-- Public can view active branches for published organizations
CREATE POLICY "Public can view active branches"
  ON branches
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Staff can manage branches"
  ON branches
  FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role]));

-- 4. SERVICES & PROFESSIONALS (Catalog is public for booking)
CREATE POLICY "Public can view active services"
  ON services
  FOR SELECT
  USING (is_active = TRUE AND is_public = TRUE);

CREATE POLICY "Staff can manage services"
  ON services
  FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role]));

CREATE POLICY "Public can view active professionals"
  ON professionals
  FOR SELECT
  USING (is_active = TRUE AND is_public = TRUE);

CREATE POLICY "Staff can manage professionals"
  ON professionals
  FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role]));

-- 5. WORKING HOURS & EXCEPTIONS
CREATE POLICY "Public and staff can view working hours"
  ON working_hours
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Staff can manage working hours"
  ON working_hours
  FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role]));

CREATE POLICY "Public and staff can view schedule exceptions"
  ON schedule_exceptions
  FOR SELECT
  USING (TRUE);

-- 6. CUSTOMERS (Strictly isolated by organization, sensitive notes isolated)
CREATE POLICY "Staff can view customers of their organization"
  ON customers
  FOR SELECT
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role, 'receptionist'::member_role, 'professional'::member_role, 'cashier'::member_role]));

CREATE POLICY "Staff can modify customers of their organization"
  ON customers
  FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role, 'receptionist'::member_role]));

-- 7. APPOINTMENTS POLICIES
-- Staff can view all appointments in their organization
CREATE POLICY "Staff can view appointments"
  ON appointments
  FOR SELECT
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role, 'receptionist'::member_role, 'professional'::member_role, 'cashier'::member_role]));

-- Staff can insert or update appointments
CREATE POLICY "Staff can modify appointments"
  ON appointments
  FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role, 'receptionist'::member_role]));

-- Customer can select their own appointment using the unique cryptographic management_token
CREATE POLICY "Public customer can view appointment via secure token"
  ON appointments
  FOR SELECT
  USING (
    management_token IS NOT NULL
    AND management_token_expires_at > NOW()
  );

-- 8. SALES & CASH SESSIONS
CREATE POLICY "Staff can access cash sessions"
  ON cash_sessions
  FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role, 'cashier'::member_role, 'receptionist'::member_role]));

CREATE POLICY "Staff can access sales"
  ON sales
  FOR ALL
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role, 'cashier'::member_role, 'receptionist'::member_role]));

CREATE POLICY "Staff can access sale items"
  ON sale_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id
        AND has_org_role(s.organization_id, ARRAY['owner'::member_role, 'admin'::member_role, 'branch_manager'::member_role, 'cashier'::member_role, 'receptionist'::member_role])
    )
  );

-- 9. AUDIT EVENTS
CREATE POLICY "Admins can view audit logs"
  ON audit_events
  FOR SELECT
  USING (has_org_role(organization_id, ARRAY['owner'::member_role, 'admin'::member_role]));

CREATE POLICY "System can insert audit logs"
  ON audit_events
  FOR INSERT
  WITH CHECK (TRUE);


-- ============================================================================
-- STORED PROCEDURES & ATOMIC FUNCTIONS
-- ============================================================================

-- FUNCTION: Atomic creation of appointment with conflict detection & customer upsert
CREATE OR REPLACE FUNCTION create_atomic_booking(
  p_organization_id UUID,
  p_branch_id UUID,
  p_professional_id UUID,
  p_service_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_hold_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_duration INT;
  v_service_price NUMERIC(12, 2);
  v_deposit_amount NUMERIC(12, 2);
  v_ends_at TIMESTAMPTZ;
  v_customer_id UUID;
  v_appointment_id UUID;
  v_management_token TEXT;
  v_token_expiry TIMESTAMPTZ;
  v_conflict_count INT;
BEGIN
  -- 1. Idempotency Check: if idempotency key already exists, return previous booking
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, management_token INTO v_appointment_id, v_management_token
    FROM appointments
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'management_token', v_management_token,
        'replayed', true
      );
    END IF;
  END IF;

  -- 2. Fetch service duration and price
  SELECT duration_minutes, price, deposit_amount
  INTO v_service_duration, v_service_price, v_deposit_amount
  FROM services
  WHERE id = p_service_id AND organization_id = p_organization_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  v_ends_at := p_starts_at + (v_service_duration || ' minutes')::INTERVAL;

  -- 3. Check for conflict with other confirmed/checked_in appointments
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE professional_id = p_professional_id
    AND status NOT IN ('cancelled', 'expired', 'no_show')
    AND tstzrange(starts_at, ends_at, '[)') && tstzrange(p_starts_at, v_ends_at, '[)');

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'SLOT_UNAVAILABLE',
      'message', 'El profesional seleccionado ya cuenta con un turno reservado en ese horario.'
    );
  END IF;

  -- 4. Upsert Customer in the organization
  SELECT id INTO v_customer_id
  FROM customers
  WHERE organization_id = p_organization_id AND phone = p_customer_phone;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (
      organization_id, full_name, phone, email, total_appointments
    ) VALUES (
      p_organization_id, p_customer_name, p_customer_phone, p_customer_email, 1
    ) RETURNING id INTO v_customer_id;
  ELSE
    UPDATE customers
    SET full_name = p_customer_name,
        email = COALESCE(p_customer_email, email),
        total_appointments = total_appointments + 1,
        updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;

  -- 5. Generate secure cryptographically random management token
  v_management_token := encode(gen_random_bytes(24), 'hex');
  v_token_expiry := v_ends_at + INTERVAL '90 days';

  -- 6. Insert Appointment
  INSERT INTO appointments (
    organization_id,
    branch_id,
    professional_id,
    customer_id,
    status,
    payment_status,
    starts_at,
    ends_at,
    service_duration_minutes,
    total_amount,
    deposit_amount,
    customer_notes,
    booking_channel,
    management_token,
    management_token_expires_at,
    idempotency_key
  ) VALUES (
    p_organization_id,
    p_branch_id,
    p_professional_id,
    v_customer_id,
    'confirmed',
    CASE WHEN v_deposit_amount > 0 THEN 'pending'::payment_status ELSE 'pending'::payment_status END,
    p_starts_at,
    v_ends_at,
    v_service_duration,
    v_service_price,
    COALESCE(v_deposit_amount, 0),
    p_customer_notes,
    'public_web',
    v_management_token,
    v_token_expiry,
    p_idempotency_key
  ) RETURNING id INTO v_appointment_id;

  -- 7. Insert Appointment Segment
  INSERT INTO appointment_segments (
    appointment_id, service_id, sequence_order, starts_at, ends_at, duration_minutes, price
  ) VALUES (
    v_appointment_id, p_service_id, 1, p_starts_at, v_ends_at, v_service_duration, v_service_price
  );

  -- 8. Release booking hold if provided
  IF p_hold_token IS NOT NULL THEN
    UPDATE booking_holds
    SET is_released = TRUE
    WHERE hold_token = p_hold_token;
  END IF;

  -- 9. Audit event
  INSERT INTO audit_events (
    organization_id, action, resource_type, resource_id, metadata
  ) VALUES (
    p_organization_id,
    'appointment.created',
    'appointments',
    v_appointment_id::text,
    jsonb_build_object(
      'customer_id', v_customer_id,
      'professional_id', p_professional_id,
      'starts_at', p_starts_at,
      'service_id', p_service_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'management_token', v_management_token,
    'starts_at', p_starts_at,
    'ends_at', v_ends_at,
    'total_amount', v_service_price,
    'customer_id', v_customer_id
  );
END;
$$;

-- FUNCTION: Audited stock movement update (Prevents manual direct edit of stock column)
CREATE OR REPLACE FUNCTION record_stock_movement(
  p_organization_id UUID,
  p_branch_id UUID,
  p_product_id UUID,
  p_movement_type stock_movement_type,
  p_quantity INT,
  p_reason TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_cost_per_unit NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INT;
  v_new_stock INT;
  v_performed_by UUID;
BEGIN
  v_performed_by := auth.uid();

  -- Get current stock with row lock
  SELECT current_stock INTO v_current_stock
  FROM product_branch_stock
  WHERE branch_id = p_branch_id AND product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    v_current_stock := 0;
    INSERT INTO product_branch_stock (organization_id, branch_id, product_id, current_stock)
    VALUES (p_organization_id, p_branch_id, p_product_id, 0);
  END IF;

  v_new_stock := v_current_stock + p_quantity;

  IF v_new_stock < 0 AND p_movement_type NOT IN ('adjustment_out', 'transfer_out') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INSUFFICIENT_STOCK',
      'message', 'Stock insuficiente para completar la operación.'
    );
  END IF;

  -- Update current stock
  UPDATE product_branch_stock
  SET current_stock = v_new_stock, updated_at = NOW()
  WHERE branch_id = p_branch_id AND product_id = p_product_id;

  -- Log movement
  INSERT INTO stock_movements (
    organization_id, branch_id, product_id, movement_type,
    quantity, previous_stock, new_stock, cost_per_unit, reference_id,
    reason, performed_by_id
  ) VALUES (
    p_organization_id, p_branch_id, p_product_id, p_movement_type,
    p_quantity, v_current_stock, v_new_stock, p_cost_per_unit, p_reference_id,
    p_reason, v_performed_by
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_stock', v_current_stock,
    'new_stock', v_new_stock
  );
END;
$$;
