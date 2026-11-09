-- ============================================================================
-- TRUSTFORGE: Production-Hardened Initial Schema Migration
-- Authoritative Migration File: supabase/migrations/001_initial_schema.sql
-- Database: Supabase PostgreSQL
-- Features: Profiles, Vehicles, Trusted Contacts, Activity Events, Contact Requests, Parking Reports, Emergency Alerts
-- Security: Strict RLS on all tables, Idempotent Policy Setup, Hardened SECURITY DEFINER RPC Functions with search_path = public, pg_temp
-- Anti-Spam: Rate limiting on public QR interactions, strict input validation & payload constraints
-- ============================================================================

-- Enable pgcrypto for UUIDs & cryptographic token generation
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

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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

DROP POLICY IF EXISTS "Owners can view their own vehicles" ON public.vehicles;
CREATE POLICY "Owners can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert their own vehicles" ON public.vehicles;
CREATE POLICY "Owners can insert their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their own vehicles" ON public.vehicles;
CREATE POLICY "Owners can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their own vehicles" ON public.vehicles;
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

DROP POLICY IF EXISTS "Owners can view their own trusted contacts" ON public.trusted_contacts;
CREATE POLICY "Owners can view their own trusted contacts"
  ON public.trusted_contacts FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert their own trusted contacts" ON public.trusted_contacts;
CREATE POLICY "Owners can insert their own trusted contacts"
  ON public.trusted_contacts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their own trusted contacts" ON public.trusted_contacts;
CREATE POLICY "Owners can update their own trusted contacts"
  ON public.trusted_contacts FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their own trusted contacts" ON public.trusted_contacts;
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

DROP POLICY IF EXISTS "Vehicle owners can view activity events for their vehicles" ON public.activity_events;
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
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'parking', 'lights_on', 'window_open', 'other')),
  message TEXT,
  caller_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  scanner_location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_vehicle_id ON public.contact_requests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON public.contact_requests(created_at DESC);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vehicle owners can view contact requests for their vehicles" ON public.contact_requests;
CREATE POLICY "Vehicle owners can view contact requests for their vehicles"
  ON public.contact_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = contact_requests.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vehicle owners can update contact requests for their vehicles" ON public.contact_requests;
CREATE POLICY "Vehicle owners can update contact requests for their vehicles"
  ON public.contact_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = contact_requests.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  )
  WITH CHECK (
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
CREATE INDEX IF NOT EXISTS idx_parking_reports_created_at ON public.parking_reports(created_at DESC);

ALTER TABLE public.parking_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vehicle owners can view parking reports for their vehicles" ON public.parking_reports;
CREATE POLICY "Vehicle owners can view parking reports for their vehicles"
  ON public.parking_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = parking_reports.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vehicle owners can update parking reports for their vehicles" ON public.parking_reports;
CREATE POLICY "Vehicle owners can update parking reports for their vehicles"
  ON public.parking_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = parking_reports.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  )
  WITH CHECK (
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
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON public.emergency_alerts(created_at DESC);

ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vehicle owners can view emergency alerts for their vehicles" ON public.emergency_alerts;
CREATE POLICY "Vehicle owners can view emergency alerts for their vehicles"
  ON public.emergency_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = emergency_alerts.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Vehicle owners can update emergency alerts for their vehicles" ON public.emergency_alerts;
CREATE POLICY "Vehicle owners can update emergency alerts for their vehicles"
  ON public.emergency_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = emergency_alerts.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = emergency_alerts.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- SECURE PUBLIC RPC FUNCTIONS (NO PRIVATE DATA EXPOSURE, STRICT INPUT VALIDATION)
-- ============================================================================

-- Function 1: Lookup public vehicle details by secure QR token
CREATE OR REPLACE FUNCTION public.get_public_vehicle_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vehicle RECORD;
  v_profile RECORD;
  v_trusted_count INTEGER;
  v_display_reg TEXT;
  v_owner_display_name TEXT;
  v_public_phone TEXT := NULL;
  v_clean_token TEXT;
BEGIN
  -- Strict Token Format Validation
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Token parameter is required.');
  END IF;

  v_clean_token := trim(p_token);
  IF length(v_clean_token) < 16 OR length(v_clean_token) > 64 OR v_clean_token !~ '^[a-zA-Z0-9_-]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN_FORMAT', 'message', 'Vehicle token format is invalid.');
  END IF;

  -- Lookup vehicle by token
  SELECT * INTO v_vehicle
  FROM public.vehicles
  WHERE qr_token = v_clean_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Vehicle QR code is not recognized.');
  END IF;

  IF NOT v_vehicle.qr_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'INACTIVE_QR', 'message', 'This vehicle QR code has been deactivated by the owner.');
  END IF;

  -- Anti-Spam: Throttle scan counter & activity logging to prevent artificial inflation
  IF NOT EXISTS (
    SELECT 1 FROM public.activity_events
    WHERE vehicle_id = v_vehicle.id
      AND event_type = 'qr_scan'
      AND created_at > timezone('utc'::text, now()) - INTERVAL '5 seconds'
  ) THEN
    UPDATE public.vehicles
    SET qr_scans_count = qr_scans_count + 1
    WHERE id = v_vehicle.id;

    INSERT INTO public.activity_events (vehicle_id, event_type, details)
    VALUES (v_vehicle.id, 'qr_scan', jsonb_build_object('timestamp', timezone('utc'::text, now())));
  END IF;

  -- Fetch owner profile for display name calculation only
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

  -- Strict Phone Redaction: Only reveal phone if owner explicitly enabled allow_public_phone_display
  IF v_vehicle.allow_public_phone_display AND FOUND THEN
    v_public_phone := v_profile.phone;
  END IF;

  -- Count trusted contacts without revealing any personal or contact details
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

  -- Return ONLY strictly allowlisted public vehicle fields
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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vehicle RECORD;
  v_request_id UUID;
  v_clean_token TEXT;
  v_clean_category TEXT;
  v_clean_message TEXT;
  v_clean_contact TEXT;
BEGIN
  -- 1. Input Validation: Token
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Token parameter is required.');
  END IF;

  v_clean_token := trim(p_token);
  IF length(v_clean_token) < 16 OR length(v_clean_token) > 64 OR v_clean_token !~ '^[a-zA-Z0-9_-]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN_FORMAT', 'message', 'Vehicle token format is invalid.');
  END IF;

  -- 2. Input Validation: Category
  v_clean_category := COALESCE(NULLIF(trim(p_category), ''), 'general');
  IF v_clean_category NOT IN ('general', 'parking', 'lights_on', 'window_open', 'other') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CATEGORY', 'message', 'Category must be one of: general, parking, lights_on, window_open, other.');
  END IF;

  -- 3. Input Validation: Message Length (max 500 characters)
  v_clean_message := NULLIF(trim(p_message), '');
  IF v_clean_message IS NOT NULL AND length(v_clean_message) > 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'MESSAGE_TOO_LONG', 'message', 'Message cannot exceed 500 characters.');
  END IF;

  -- 4. Input Validation: Contact Length (max 30 characters)
  v_clean_contact := NULLIF(trim(p_caller_contact), '');
  IF v_clean_contact IS NOT NULL AND length(v_clean_contact) > 30 THEN
    RETURN jsonb_build_object('success', false, 'error', 'CONTACT_TOO_LONG', 'message', 'Contact phone/identifier cannot exceed 30 characters.');
  END IF;

  -- 5. Input Validation: Location Payload Constraints (max 512 bytes, safe numeric check)
  IF p_location IS NOT NULL THEN
    IF jsonb_typeof(p_location) <> 'object' THEN
      RETURN jsonb_build_object('success', false, 'error', 'INVALID_LOCATION_FORMAT', 'message', 'Location payload must be a JSON object.');
    END IF;

    IF pg_column_size(p_location) > 512 THEN
      RETURN jsonb_build_object('success', false, 'error', 'LOCATION_PAYLOAD_TOO_LARGE', 'message', 'Location payload exceeds allowable size.');
    END IF;

    IF (p_location ? 'latitude') OR (p_location ? 'longitude') THEN
      IF NOT (p_location ? 'latitude') OR NOT (p_location ? 'longitude') THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_COORDINATES', 'message', 'Both latitude and longitude are required when location is supplied.');
      END IF;

      IF (p_location->>'latitude') !~ '^-?[0-9]+(\.[0-9]+)?$' OR (p_location->>'longitude') !~ '^-?[0-9]+(\.[0-9]+)?$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_COORDINATES', 'message', 'Latitude and longitude must be valid decimal numbers.');
      END IF;

      IF (p_location->>'latitude')::numeric < -90 OR (p_location->>'latitude')::numeric > 90 OR
         (p_location->>'longitude')::numeric < -180 OR (p_location->>'longitude')::numeric > 180 THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_COORDINATES', 'message', 'Coordinates are outside valid geographical bounds.');
      END IF;
    END IF;
  END IF;

  -- 6. Vehicle Existence & Feature Check
  SELECT * INTO v_vehicle
  FROM public.vehicles
  WHERE qr_token = v_clean_token AND qr_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_OR_INACTIVE_TOKEN', 'message', 'Vehicle QR token is invalid or inactive.');
  END IF;

  IF NOT v_vehicle.allow_contact_requests THEN
    RETURN jsonb_build_object('success', false, 'error', 'FEATURE_DISABLED', 'message', 'Owner contact requests are currently disabled for this vehicle.');
  END IF;

  -- 7. Anti-Spam / Rate-Limiting: Prevent rapid multi-submissions
  IF EXISTS (
    SELECT 1 FROM public.contact_requests
    WHERE vehicle_id = v_vehicle.id
      AND created_at > timezone('utc'::text, now()) - INTERVAL '15 seconds'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED', 'message', 'A contact request was recently submitted for this vehicle. Please wait 15 seconds.');
  END IF;

  IF (
    SELECT count(*) FROM public.contact_requests
    WHERE vehicle_id = v_vehicle.id
      AND created_at > timezone('utc'::text, now()) - INTERVAL '5 minutes'
  ) >= 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED', 'message', 'Submission rate limit reached for this vehicle. Please try again later.');
  END IF;

  -- 8. Insert Request
  INSERT INTO public.contact_requests (
    vehicle_id,
    category,
    message,
    caller_phone,
    scanner_location
  ) VALUES (
    v_vehicle.id,
    v_clean_category,
    v_clean_message,
    v_clean_contact,
    p_location
  ) RETURNING id INTO v_request_id;

  INSERT INTO public.activity_events (vehicle_id, event_type, details, scanner_location)
  VALUES (
    v_vehicle.id,
    'contact_request',
    jsonb_build_object(
      'request_id', v_request_id,
      'category', v_clean_category,
      'message', COALESCE(v_clean_message, 'Contact request submitted by scanner.')
    ),
    p_location
  );

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id);
END;
$$;

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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vehicle RECORD;
  v_report_id UUID;
  v_clean_token TEXT;
  v_clean_reason TEXT;
  v_clean_description TEXT;
  v_clean_contact TEXT;
BEGIN
  -- 1. Input Validation: Token
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Token parameter is required.');
  END IF;

  v_clean_token := trim(p_token);
  IF length(v_clean_token) < 16 OR length(v_clean_token) > 64 OR v_clean_token !~ '^[a-zA-Z0-9_-]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN_FORMAT', 'message', 'Vehicle token format is invalid.');
  END IF;

  -- 2. Input Validation: Reason
  v_clean_reason := trim(p_reason);
  IF v_clean_reason IS NULL OR v_clean_reason NOT IN ('blocking_entrance', 'wrong_parking', 'blocking_vehicle', 'other') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_REASON', 'message', 'Reason must be one of: blocking_entrance, wrong_parking, blocking_vehicle, other.');
  END IF;

  -- 3. Input Validation: Description Length (max 500 characters)
  v_clean_description := NULLIF(trim(p_description), '');
  IF v_clean_description IS NOT NULL AND length(v_clean_description) > 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'DESCRIPTION_TOO_LONG', 'message', 'Description cannot exceed 500 characters.');
  END IF;

  -- 4. Input Validation: Scanner Contact Length (max 30 characters)
  v_clean_contact := NULLIF(trim(p_scanner_contact), '');
  IF v_clean_contact IS NOT NULL AND length(v_clean_contact) > 30 THEN
    RETURN jsonb_build_object('success', false, 'error', 'CONTACT_TOO_LONG', 'message', 'Contact identifier cannot exceed 30 characters.');
  END IF;

  -- 5. Input Validation: Location Payload Constraints (max 512 bytes, safe numeric check)
  IF p_location IS NOT NULL THEN
    IF jsonb_typeof(p_location) <> 'object' THEN
      RETURN jsonb_build_object('success', false, 'error', 'INVALID_LOCATION_FORMAT', 'message', 'Location payload must be a JSON object.');
    END IF;

    IF pg_column_size(p_location) > 512 THEN
      RETURN jsonb_build_object('success', false, 'error', 'LOCATION_PAYLOAD_TOO_LARGE', 'message', 'Location payload exceeds allowable size.');
    END IF;

    IF (p_location ? 'latitude') OR (p_location ? 'longitude') THEN
      IF NOT (p_location ? 'latitude') OR NOT (p_location ? 'longitude') THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_COORDINATES', 'message', 'Both latitude and longitude are required when location is supplied.');
      END IF;

      IF (p_location->>'latitude') !~ '^-?[0-9]+(\.[0-9]+)?$' OR (p_location->>'longitude') !~ '^-?[0-9]+(\.[0-9]+)?$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_COORDINATES', 'message', 'Latitude and longitude must be valid decimal numbers.');
      END IF;

      IF (p_location->>'latitude')::numeric < -90 OR (p_location->>'latitude')::numeric > 90 OR
         (p_location->>'longitude')::numeric < -180 OR (p_location->>'longitude')::numeric > 180 THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_COORDINATES', 'message', 'Coordinates are outside valid geographical bounds.');
      END IF;
    END IF;
  END IF;

  -- 6. Vehicle Existence & Feature Check
  SELECT * INTO v_vehicle
  FROM public.vehicles
  WHERE qr_token = v_clean_token AND qr_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_OR_INACTIVE_TOKEN', 'message', 'Vehicle QR token is invalid or inactive.');
  END IF;

  IF NOT v_vehicle.allow_parking_reports THEN
    RETURN jsonb_build_object('success', false, 'error', 'FEATURE_DISABLED', 'message', 'Parking reports are currently disabled for this vehicle.');
  END IF;

  -- 7. Anti-Spam / Rate-Limiting
  IF EXISTS (
    SELECT 1 FROM public.parking_reports
    WHERE vehicle_id = v_vehicle.id
      AND created_at > timezone('utc'::text, now()) - INTERVAL '15 seconds'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED', 'message', 'A parking report was recently submitted for this vehicle. Please wait 15 seconds.');
  END IF;

  IF (
    SELECT count(*) FROM public.parking_reports
    WHERE vehicle_id = v_vehicle.id
      AND created_at > timezone('utc'::text, now()) - INTERVAL '5 minutes'
  ) >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED', 'message', 'Too many parking reports submitted for this vehicle. Please try again later.');
  END IF;

  -- 8. Insert Parking Report
  INSERT INTO public.parking_reports (
    vehicle_id,
    reason,
    description,
    scanner_location,
    scanner_contact_opt
  ) VALUES (
    v_vehicle.id,
    v_clean_reason,
    v_clean_description,
    p_location,
    v_clean_contact
  ) RETURNING id INTO v_report_id;

  INSERT INTO public.activity_events (vehicle_id, event_type, details, scanner_location)
  VALUES (
    v_vehicle.id,
    'parking_report',
    jsonb_build_object('report_id', v_report_id, 'reason', v_clean_reason),
    p_location
  );

  RETURN jsonb_build_object('success', true, 'report_id', v_report_id);
END;
$$;

-- Function 4: Submit emergency alert via public QR token
CREATE OR REPLACE FUNCTION public.submit_public_emergency_alert(
  p_token TEXT,
  p_message TEXT DEFAULT NULL,
  p_location JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vehicle RECORD;
  v_alert_id UUID;
  v_configured_count INTEGER := 0;
  v_clean_token TEXT;
  v_clean_message TEXT;
BEGIN
  -- 1. Input Validation: Token
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Token parameter is required.');
  END IF;

  v_clean_token := trim(p_token);
  IF length(v_clean_token) < 16 OR length(v_clean_token) > 64 OR v_clean_token !~ '^[a-zA-Z0-9_-]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN_FORMAT', 'message', 'Vehicle token format is invalid.');
  END IF;

  -- 2. Input Validation: Message Length (max 500 characters)
  v_clean_message := NULLIF(trim(p_message), '');
  IF v_clean_message IS NOT NULL AND length(v_clean_message) > 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'MESSAGE_TOO_LONG', 'message', 'Message cannot exceed 500 characters.');
  END IF;

  -- 3. Input Validation: Location Payload Constraints (max 512 bytes, safe numeric check)
  IF p_location IS NOT NULL THEN
    IF jsonb_typeof(p_location) <> 'object' THEN
      RETURN jsonb_build_object('success', false, 'error', 'INVALID_LOCATION_FORMAT', 'message', 'Location payload must be a JSON object.');
    END IF;

    IF pg_column_size(p_location) > 512 THEN
      RETURN jsonb_build_object('success', false, 'error', 'LOCATION_PAYLOAD_TOO_LARGE', 'message', 'Location payload exceeds allowable size.');
    END IF;

    IF (p_location ? 'latitude') OR (p_location ? 'longitude') THEN
      IF NOT (p_location ? 'latitude') OR NOT (p_location ? 'longitude') THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_COORDINATES', 'message', 'Both latitude and longitude are required when location is supplied.');
      END IF;

      IF (p_location->>'latitude') !~ '^-?[0-9]+(\.[0-9]+)?$' OR (p_location->>'longitude') !~ '^-?[0-9]+(\.[0-9]+)?$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_COORDINATES', 'message', 'Latitude and longitude must be valid decimal numbers.');
      END IF;

      IF (p_location->>'latitude')::numeric < -90 OR (p_location->>'latitude')::numeric > 90 OR
         (p_location->>'longitude')::numeric < -180 OR (p_location->>'longitude')::numeric > 180 THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_COORDINATES', 'message', 'Coordinates are outside valid geographical bounds.');
      END IF;
    END IF;
  END IF;

  -- 4. Vehicle Existence & Feature Check
  SELECT * INTO v_vehicle
  FROM public.vehicles
  WHERE qr_token = v_clean_token AND qr_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_OR_INACTIVE_TOKEN', 'message', 'Vehicle QR token is invalid or inactive.');
  END IF;

  IF NOT v_vehicle.allow_emergency_alerts THEN
    RETURN jsonb_build_object('success', false, 'error', 'FEATURE_DISABLED', 'message', 'Emergency alerts are currently disabled by the owner for this vehicle.');
  END IF;

  -- 5. Anti-Spam / Rate-Limiting: 15-second debounce between emergency triggers
  IF EXISTS (
    SELECT 1 FROM public.emergency_alerts
    WHERE vehicle_id = v_vehicle.id
      AND created_at > timezone('utc'::text, now()) - INTERVAL '15 seconds'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED', 'message', 'An emergency alert was recently recorded for this vehicle. Please allow 15 seconds.');
  END IF;

  -- 6. Retrieve Count of Configured Emergency Contacts
  SELECT count(*) INTO v_configured_count
  FROM public.trusted_contacts
  WHERE (vehicle_id = v_vehicle.id OR (vehicle_id IS NULL AND owner_id = v_vehicle.owner_id))
    AND notify_on_emergency = true;

  -- 7. Insert Emergency Alert Record in Dashboard (contacts_notified_count is strictly 0 because no external SMS provider is active)
  INSERT INTO public.emergency_alerts (
    vehicle_id,
    severity,
    message,
    scanner_location,
    contacts_notified_count
  ) VALUES (
    v_vehicle.id,
    'urgent',
    COALESCE(v_clean_message, 'Urgent assistance requested via vehicle QR code.'),
    p_location,
    0
  ) RETURNING id INTO v_alert_id;

  INSERT INTO public.activity_events (vehicle_id, event_type, details, scanner_location)
  VALUES (
    v_vehicle.id,
    'emergency_alert',
    jsonb_build_object(
      'alert_id', v_alert_id,
      'configured_contacts_count', v_configured_count,
      'contacts_notified_count', 0,
      'notification_status', 'recorded_in_dashboard_only'
    ),
    p_location
  );

  -- 8. Return explicit status: alert was recorded in dashboard, contacts were NOT notified
  RETURN jsonb_build_object(
    'success', true,
    'alert_id', v_alert_id,
    'configured_contacts_count', v_configured_count,
    'contacts_notified_count', 0,
    'message', 'Emergency alert recorded in vehicle owner dashboard. Trusted contacts were NOT notified (external SMS/WhatsApp gateway is not configured). For life safety, dial 112 directly.'
  );
END;
$$;

-- ============================================================================
-- EXPLICIT FUNCTION PERMISSIONS (REVOKE FROM PUBLIC, GRANT TO ANON & AUTHENTICATED)
-- ============================================================================
REVOKE ALL ON FUNCTION public.get_public_vehicle_by_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_contact_request(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_parking_report(TEXT, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_emergency_alert(TEXT, TEXT, JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_public_vehicle_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_contact_request(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_parking_report(TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_emergency_alert(TEXT, TEXT, JSONB) TO anon, authenticated;

-- ============================================================================
-- REALTIME SUBSCRIPTIONS ENABLING (IDEMPOTENT)
-- ============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_requests;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_reports;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
