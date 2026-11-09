-- ============================================================================
-- DEPRECATED DUPLICATE MIGRATION - DO NOT EXECUTE THIS FILE
-- The ONLY authoritative migration is: supabase/migrations/001_initial_schema.sql
-- ============================================================================
-- TRUSTFORGE: Complete Schema Migration (Real MVP Edition)
-- Database: Supabase PostgreSQL
-- Features: Profiles, Vehicles, Trusted Contacts, Activity Events, Contact Requests, Parking Reports, Emergency Alerts
-- Security: Row Level Security (RLS) enabled on all tables, secure public token access functions

-- Enable pgcrypto for UUIDs & cryptographic tokens
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  date_of_birth DATE,
  residential_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- 2. VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('car', 'bike', 'scooter', 'other')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  model_year INTEGER NOT NULL DEFAULT extract(year from now())::integer,
  registration_number TEXT NOT NULL,
  color TEXT NOT NULL,
  photo_url TEXT,
  qr_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  qr_active BOOLEAN NOT NULL DEFAULT true,
  qr_scans_count INTEGER NOT NULL DEFAULT 0,
  allow_contact_requests BOOLEAN NOT NULL DEFAULT true,
  allow_parking_reports BOOLEAN NOT NULL DEFAULT true,
  allow_emergency_alerts BOOLEAN NOT NULL DEFAULT true,
  mask_registration_number BOOLEAN NOT NULL DEFAULT false,
  allow_public_phone_display BOOLEAN NOT NULL DEFAULT false,
  show_owner_name BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_qr_token ON public.vehicles(qr_token);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- 3. TRUSTED CONTACTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notify_on_emergency BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trusted_contacts_owner_id ON public.trusted_contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_vehicle_id ON public.trusted_contacts(vehicle_id);

ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own trusted contacts"
  ON public.trusted_contacts FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own trusted contacts"
  ON public.trusted_contacts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own trusted contacts"
  ON public.trusted_contacts FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own trusted contacts"
  ON public.trusted_contacts FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- 4. ACTIVITY EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('qr_scan', 'contact_request', 'parking_report', 'emergency_alert', 'qr_token_regenerated', 'qr_status_changed')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_ip_hash TEXT,
  user_agent TEXT,
  scanner_location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_activity_events_vehicle_id ON public.activity_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON public.activity_events(created_at DESC);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle owners can view activity events for their vehicles"
  ON public.activity_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = activity_events.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. CONTACT REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT,
  caller_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  scanner_location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_vehicle_id ON public.contact_requests(vehicle_id);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle owners can view contact requests for their vehicles"
  ON public.contact_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = contact_requests.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vehicle owners can update contact requests for their vehicles"
  ON public.contact_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = contact_requests.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. PARKING REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.parking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('blocking_entrance', 'wrong_parking', 'blocking_vehicle', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved', 'dismissed')),
  scanner_location JSONB,
  scanner_contact_opt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_parking_reports_vehicle_id ON public.parking_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parking_reports_status ON public.parking_reports(status);

ALTER TABLE public.parking_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle owners can view parking reports for their vehicles"
  ON public.parking_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = parking_reports.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vehicle owners can update parking reports for their vehicles"
  ON public.parking_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = parking_reports.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. EMERGENCY ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'urgent' CHECK (severity IN ('urgent', 'critical')),
  message TEXT,
  scanner_location JSONB,
  contacts_notified_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_vehicle_id ON public.emergency_alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts(status);

ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle owners can view emergency alerts for their vehicles"
  ON public.emergency_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = emergency_alerts.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Vehicle owners can update emergency alerts for their vehicles"
  ON public.emergency_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = emergency_alerts.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- SECURE PUBLIC RPC FUNCTIONS (NO PRIVATE DATA EXPOSURE)
-- ============================================================================

-- Function 1: Lookup public vehicle details by secure QR token
CREATE OR REPLACE FUNCTION public.get_public_vehicle_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle RECORD;
  v_profile RECORD;
  v_trusted_count INTEGER;
  v_display_reg TEXT;
  v_owner_display_name TEXT;
  v_public_phone TEXT := NULL;
BEGIN
  -- Lookup vehicle by token
  SELECT * INTO v_vehicle
  FROM public.vehicles
  WHERE qr_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Vehicle QR code is not recognized.');
  END IF;

  IF NOT v_vehicle.qr_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'INACTIVE_QR', 'message', 'This vehicle QR code has been deactivated by the owner.');
  END IF;

  -- Increment scan count
  UPDATE public.vehicles
  SET qr_scans_count = qr_scans_count + 1
  WHERE id = v_vehicle.id;

  -- Log scan event in activity_events
  INSERT INTO public.activity_events (vehicle_id, event_type, details)
  VALUES (v_vehicle.id, 'qr_scan', jsonb_build_object('timestamp', timezone('utc'::text, now())));

  -- Fetch owner profile
  SELECT full_name, phone INTO v_profile
  FROM public.profiles
  WHERE id = v_vehicle.owner_id;

  IF v_vehicle.show_owner_name AND FOUND AND v_profile.full_name IS NOT NULL THEN
    v_owner_display_name := split_part(v_profile.full_name, ' ', 1) || ' ' || 
      CASE WHEN length(split_part(v_profile.full_name, ' ', 2)) > 0 
           THEN substring(split_part(v_profile.full_name, ' ', 2), 1, 1) || '.'
           ELSE 'Owner' END;
  ELSE
    v_owner_display_name := 'Verified Owner';
  END IF;

  -- If owner explicitly enabled allow_public_phone_display, pass phone; otherwise NULL
  IF v_vehicle.allow_public_phone_display AND FOUND THEN
    v_public_phone := v_profile.phone;
  END IF;

  -- Count trusted contacts without revealing private details
  SELECT count(*) INTO v_trusted_count
  FROM public.trusted_contacts
  WHERE vehicle_id = v_vehicle.id OR (vehicle_id IS NULL AND owner_id = v_vehicle.owner_id);

  -- Mask registration number if requested by owner
  IF v_vehicle.mask_registration_number THEN
    IF length(v_vehicle.registration_number) > 6 THEN
      v_display_reg := substring(v_vehicle.registration_number, 1, 2) || ' **** ' || substring(v_vehicle.registration_number, length(v_vehicle.registration_number) - 3, 4);
    ELSE
      v_display_reg := substring(v_vehicle.registration_number, 1, 2) || ' ****';
    END IF;
  ELSE
    v_display_reg := v_vehicle.registration_number;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'vehicle', jsonb_build_object(
      'id', v_vehicle.id,
      'category', v_vehicle.category,
      'brand', v_vehicle.brand,
      'model', v_vehicle.model,
      'color', v_vehicle.color,
      'registration_display', v_display_reg,
      'photo_url', v_vehicle.photo_url,
      'owner_display_name', v_owner_display_name,
      'trusted_contacts_count', v_trusted_count,
      'allow_contact_requests', v_vehicle.allow_contact_requests,
      'allow_parking_reports', v_vehicle.allow_parking_reports,
      'allow_emergency_alerts', v_vehicle.allow_emergency_alerts,
      'allow_public_phone_display', v_vehicle.allow_public_phone_display,
      'owner_public_phone', v_public_phone
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_vehicle_by_token(TEXT) TO anon, authenticated;

-- Function 2: Submit contact request via public QR token
CREATE OR REPLACE FUNCTION public.submit_public_contact_request(
  p_token TEXT,
  p_category TEXT DEFAULT 'general',
  p_message TEXT DEFAULT NULL,
  p_caller_contact TEXT DEFAULT NULL,
  p_location JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle RECORD;
  v_request_id UUID;
BEGIN
  SELECT * INTO v_vehicle
  FROM public.vehicles
  WHERE qr_token = p_token AND qr_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_OR_INACTIVE_TOKEN');
  END IF;

  IF NOT v_vehicle.allow_contact_requests THEN
    RETURN jsonb_build_object('success', false, 'error', 'FEATURE_DISABLED', 'message', 'Owner contact requests are currently disabled.');
  END IF;

  INSERT INTO public.contact_requests (
    vehicle_id,
    category,
    message,
    caller_phone,
    scanner_location
  ) VALUES (
    v_vehicle.id,
    COALESCE(p_category, 'general'),
    p_message,
    p_caller_contact,
    p_location
  ) RETURNING id INTO v_request_id;

  INSERT INTO public.activity_events (vehicle_id, event_type, details, scanner_location)
  VALUES (
    v_vehicle.id,
    'contact_request',
    jsonb_build_object(
      'request_id', v_request_id,
      'category', p_category,
      'message', COALESCE(p_message, 'Contact request submitted by scanner.')
    ),
    p_location
  );

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_contact_request(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

-- Function 3: Submit parking report via public QR token
CREATE OR REPLACE FUNCTION public.submit_public_parking_report(
  p_token TEXT,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL,
  p_location JSONB DEFAULT NULL,
  p_scanner_contact TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle RECORD;
  v_report_id UUID;
BEGIN
  SELECT * INTO v_vehicle
  FROM public.vehicles
  WHERE qr_token = p_token AND qr_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_OR_INACTIVE_TOKEN');
  END IF;

  IF NOT v_vehicle.allow_parking_reports THEN
    RETURN jsonb_build_object('success', false, 'error', 'FEATURE_DISABLED', 'message', 'Parking reports are currently disabled for this vehicle.');
  END IF;

  INSERT INTO public.parking_reports (
    vehicle_id,
    reason,
    description,
    scanner_location,
    scanner_contact_opt
  ) VALUES (
    v_vehicle.id,
    p_reason,
    p_description,
    p_location,
    p_scanner_contact
  ) RETURNING id INTO v_report_id;

  INSERT INTO public.activity_events (vehicle_id, event_type, details, scanner_location)
  VALUES (
    v_vehicle.id,
    'parking_report',
    jsonb_build_object('report_id', v_report_id, 'reason', p_reason),
    p_location
  );

  RETURN jsonb_build_object('success', true, 'report_id', v_report_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_parking_report(TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated;

-- Function 4: Submit emergency alert via public QR token
CREATE OR REPLACE FUNCTION public.submit_public_emergency_alert(
  p_token TEXT,
  p_message TEXT DEFAULT NULL,
  p_location JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle RECORD;
  v_alert_id UUID;
  v_contacts_count INTEGER := 0;
BEGIN
  SELECT * INTO v_vehicle
  FROM public.vehicles
  WHERE qr_token = p_token AND qr_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_OR_INACTIVE_TOKEN');
  END IF;

  SELECT count(*) INTO v_contacts_count
  FROM public.trusted_contacts
  WHERE (vehicle_id = v_vehicle.id OR (vehicle_id IS NULL AND owner_id = v_vehicle.owner_id))
    AND notify_on_emergency = true;

  INSERT INTO public.emergency_alerts (
    vehicle_id,
    severity,
    message,
    scanner_location,
    contacts_notified_count
  ) VALUES (
    v_vehicle.id,
    'urgent',
    COALESCE(p_message, 'Urgent assistance requested via vehicle QR code.'),
    p_location,
    v_contacts_count
  ) RETURNING id INTO v_alert_id;

  INSERT INTO public.activity_events (vehicle_id, event_type, details, scanner_location)
  VALUES (
    v_vehicle.id,
    'emergency_alert',
    jsonb_build_object('alert_id', v_alert_id, 'contacts_notified', v_contacts_count),
    p_location
  );

  RETURN jsonb_build_object(
    'success', true,
    'alert_id', v_alert_id,
    'contacts_notified_count', v_contacts_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_emergency_alert(TEXT, TEXT, JSONB) TO anon, authenticated;
