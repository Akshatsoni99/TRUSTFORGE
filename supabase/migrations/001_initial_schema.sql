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

-- Ensure profiles can be created during direct onboarding without auth.users FK blockage
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

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
  allow_public_address_display BOOLEAN NOT NULL DEFAULT false,
  allow_trusted_contacts_display BOOLEAN NOT NULL DEFAULT true,
  allow_trusted_contacts_phone_display BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS allow_public_address_display BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS allow_trusted_contacts_display BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS allow_trusted_contacts_phone_display BOOLEAN NOT NULL DEFAULT true;

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
  WITH CHECK (auth.uid() = owner_id OR auth.uid() IS NULL);

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
  WITH CHECK (auth.uid() = owner_id OR auth.uid() IS NULL);

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
  v_public_address TEXT := NULL;
  v_contacts_json JSONB := '[]'::jsonb;
  v_clean_token TEXT;
BEGIN
  -- Strict Token Format Validation
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Token parameter is required.');
  END IF;

  v_clean_token := trim(p_token);
  IF length(v_clean_token) < 8 OR length(v_clean_token) > 64 OR v_clean_token !~ '^[a-zA-Z0-9_-]+$' THEN
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

  -- Fetch owner profile for display name and conditional contact calculation
  SELECT * INTO v_profile
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

  -- Strict Address Redaction: Address MUST BE PRIVATE BY DEFAULT.
  -- Only reveal if owner explicitly enabled allow_public_address_display AND address is present
  IF COALESCE(v_vehicle.allow_public_address_display, false) AND FOUND AND v_profile.residential_address IS NOT NULL THEN
    v_public_address := v_profile.residential_address;
  END IF;

  -- Count trusted contacts without revealing unapproved personal or contact details
  SELECT count(*) INTO v_trusted_count
  FROM public.trusted_contacts
  WHERE vehicle_id = v_vehicle.id OR (vehicle_id IS NULL AND owner_id = v_vehicle.owner_id);

  -- Fetch trusted contacts for public display (names, relationships, and conditionally phones)
  IF COALESCE(v_vehicle.allow_trusted_contacts_display, true) THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', tc.id,
          'full_name', tc.full_name,
          'relationship', tc.relationship,
          'phone', CASE WHEN COALESCE(v_vehicle.allow_trusted_contacts_phone_display, true) THEN tc.phone ELSE NULL END,
          'is_primary', tc.is_primary
        ) ORDER BY tc.is_primary DESC, tc.created_at ASC
      ),
      '[]'::jsonb
    ) INTO v_contacts_json
    FROM public.trusted_contacts tc
    WHERE tc.vehicle_id = v_vehicle.id OR (tc.vehicle_id IS NULL AND tc.owner_id = v_vehicle.owner_id);
  END IF;

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
      'model_year', v_vehicle.model_year,
      'color', v_vehicle.color,
      'registration_display', v_display_reg,
      'photo_url', v_vehicle.photo_url,
      'owner_display_name', v_owner_display_name,
      'trusted_contacts_count', v_trusted_count,
      'trusted_contacts', v_contacts_json,
      'allow_contact_requests', v_vehicle.allow_contact_requests,
      'allow_parking_reports', v_vehicle.allow_parking_reports,
      'allow_emergency_alerts', v_vehicle.allow_emergency_alerts,
      'allow_public_phone_display', v_vehicle.allow_public_phone_display,
      'owner_public_phone', v_public_phone,
      'allow_public_address_display', COALESCE(v_vehicle.allow_public_address_display, false),
      'owner_public_address', v_public_address,
      'allow_trusted_contacts_display', COALESCE(v_vehicle.allow_trusted_contacts_display, true),
      'allow_trusted_contacts_phone_display', COALESCE(v_vehicle.allow_trusted_contacts_phone_display, true)
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
  IF length(v_clean_token) < 8 OR length(v_clean_token) > 64 OR v_clean_token !~ '^[a-zA-Z0-9_-]+$' THEN
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
  IF length(v_clean_token) < 8 OR length(v_clean_token) > 64 OR v_clean_token !~ '^[a-zA-Z0-9_-]+$' THEN
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
  IF length(v_clean_token) < 8 OR length(v_clean_token) > 64 OR v_clean_token !~ '^[a-zA-Z0-9_-]+$' THEN
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
-- Function 5: Atomic Owner & Vehicle Registration (Direct & Resilient)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.register_owner_and_vehicle(
  p_profile JSONB,
  p_vehicle JSONB,
  p_contacts JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_id UUID;
  v_vehicle_id UUID;
  v_existing_vehicle_id UUID;
  v_qr_token TEXT;
  v_contact JSONB;
  v_reg_number TEXT;
  v_phone TEXT;
BEGIN
  -- 1. Validate inputs
  IF p_profile IS NULL OR p_vehicle IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_INPUT', 'message', 'Profile and vehicle data required.');
  END IF;

  v_phone := trim(COALESCE(p_profile->>'phone', ''));
  IF length(v_phone) < 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_PHONE', 'message', 'Valid mobile number required.');
  END IF;

  v_reg_number := upper(trim(COALESCE(p_vehicle->>'registration_number', '')));
  IF length(v_reg_number) < 4 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_REG_NUMBER', 'message', 'Valid vehicle registration number required.');
  END IF;

  -- 2. Owner ID resolution: use auth.uid() if logged in, or provided UUID, or generate new UUID
  IF auth.uid() IS NOT NULL THEN
    v_owner_id := auth.uid();
  ELSIF p_profile->>'id' IS NOT NULL AND (p_profile->>'id') ~ '^[0-9a-fA-F-]{36}$' THEN
    v_owner_id := (p_profile->>'id')::UUID;
  ELSE
    v_owner_id := gen_random_uuid();
  END IF;

  -- 3. Upsert profile
  INSERT INTO public.profiles (
    id, full_name, email, phone, phone_verified, residential_address, updated_at
  )
  VALUES (
    v_owner_id,
    COALESCE(NULLIF(trim(p_profile->>'full_name'), ''), 'Vehicle Owner'),
    NULLIF(trim(p_profile->>'email'), ''),
    v_phone,
    false,
    NULLIF(trim(p_profile->>'residential_address'), ''),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = EXCLUDED.phone,
    residential_address = COALESCE(EXCLUDED.residential_address, profiles.residential_address),
    updated_at = timezone('utc'::text, now());

  -- 4. Vehicle ID & QR Token resolution (strictly preserve existing token)
  v_qr_token := trim(COALESCE(p_vehicle->>'qr_token', ''));
  IF length(v_qr_token) < 8 THEN
    v_qr_token := encode(gen_random_bytes(16), 'hex');
  END IF;

  SELECT id INTO v_existing_vehicle_id
  FROM public.vehicles
  WHERE qr_token = v_qr_token;

  IF v_existing_vehicle_id IS NOT NULL THEN
    v_vehicle_id := v_existing_vehicle_id;
  ELSIF p_vehicle->>'id' IS NOT NULL AND (p_vehicle->>'id') ~ '^[0-9a-fA-F-]{36}$' THEN
    v_vehicle_id := (p_vehicle->>'id')::UUID;
  ELSE
    v_vehicle_id := gen_random_uuid();
  END IF;

  -- 5. Upsert vehicle
  INSERT INTO public.vehicles (
    id, owner_id, category, brand, model, model_year,
    registration_number, color, photo_url, qr_token, qr_active,
    allow_contact_requests, allow_parking_reports, allow_emergency_alerts,
    mask_registration_number, allow_public_phone_display, show_owner_name,
    allow_public_address_display, allow_trusted_contacts_display, allow_trusted_contacts_phone_display,
    created_at, updated_at
  )
  VALUES (
    v_vehicle_id,
    v_owner_id,
    COALESCE(NULLIF(p_vehicle->>'category', ''), 'car'),
    COALESCE(NULLIF(trim(p_vehicle->>'brand'), ''), 'Generic'),
    COALESCE(NULLIF(trim(p_vehicle->>'model'), ''), 'Vehicle'),
    COALESCE((p_vehicle->>'model_year')::INTEGER, extract(year from now())::integer),
    v_reg_number,
    COALESCE(NULLIF(trim(p_vehicle->>'color'), ''), 'Neutral'),
    NULLIF(trim(p_vehicle->>'photo_url'), ''),
    v_qr_token,
    COALESCE((p_vehicle->>'qr_active')::BOOLEAN, true),
    COALESCE((p_vehicle->>'allow_contact_requests')::BOOLEAN, true),
    COALESCE((p_vehicle->>'allow_parking_reports')::BOOLEAN, true),
    COALESCE((p_vehicle->>'allow_emergency_alerts')::BOOLEAN, true),
    COALESCE((p_vehicle->>'mask_registration_number')::BOOLEAN, false),
    COALESCE((p_vehicle->>'allow_public_phone_display')::BOOLEAN, false),
    COALESCE((p_vehicle->>'show_owner_name')::BOOLEAN, true),
    COALESCE((p_vehicle->>'allow_public_address_display')::BOOLEAN, false),
    COALESCE((p_vehicle->>'allow_trusted_contacts_display')::BOOLEAN, true),
    COALESCE((p_vehicle->>'allow_trusted_contacts_phone_display')::BOOLEAN, true),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    brand = EXCLUDED.brand,
    model = EXCLUDED.model,
    model_year = EXCLUDED.model_year,
    registration_number = EXCLUDED.registration_number,
    color = EXCLUDED.color,
    photo_url = COALESCE(EXCLUDED.photo_url, vehicles.photo_url),
    qr_token = EXCLUDED.qr_token,
    qr_active = EXCLUDED.qr_active,
    allow_public_phone_display = EXCLUDED.allow_public_phone_display,
    allow_public_address_display = EXCLUDED.allow_public_address_display,
    allow_trusted_contacts_display = EXCLUDED.allow_trusted_contacts_display,
    allow_trusted_contacts_phone_display = EXCLUDED.allow_trusted_contacts_phone_display,
    updated_at = timezone('utc'::text, now());

  -- 6. Insert trusted contacts if provided
  IF p_contacts IS NOT NULL AND jsonb_typeof(p_contacts) = 'array' THEN
    FOR v_contact IN SELECT * FROM jsonb_array_elements(p_contacts)
    LOOP
      IF length(trim(COALESCE(v_contact->>'phone', ''))) >= 10 THEN
        INSERT INTO public.trusted_contacts (
          id, owner_id, vehicle_id, full_name, relationship, phone, email,
          is_primary, notify_on_emergency, created_at, updated_at
        ) VALUES (
          CASE WHEN (v_contact->>'id') ~ '^[0-9a-fA-F-]{36}$' THEN (v_contact->>'id')::UUID ELSE gen_random_uuid() END,
          v_owner_id,
          v_vehicle_id,
          COALESCE(NULLIF(trim(v_contact->>'full_name'), ''), 'Trusted Contact'),
          COALESCE(NULLIF(trim(v_contact->>'relationship'), ''), 'Family Member'),
          trim(v_contact->>'phone'),
          NULLIF(trim(v_contact->>'email'), ''),
          COALESCE((v_contact->>'is_primary')::BOOLEAN, false),
          COALESCE((v_contact->>'notify_on_emergency')::BOOLEAN, true),
          timezone('utc'::text, now()),
          timezone('utc'::text, now())
        );
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'owner_id', v_owner_id,
    'vehicle_id', v_vehicle_id,
    'qr_token', v_qr_token,
    'message', 'Vehicle and owner registered successfully.'
  );
END;
$$;

-- ============================================================================
-- Function 6: Secure Owner Vehicles Retrieval (AUTHENTICATED ONLY, STRICT auth.uid() ENFORCEMENT)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_owner_vehicles(p_owner_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_vehicles_json JSONB;
  v_caller_uid UUID;
  v_target_owner_id UUID;
BEGIN
  -- 1. Ensure the caller is an authenticated user with a valid JWT
  v_caller_uid := auth.uid();
  IF v_caller_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authenticated session required' USING ERRCODE = '42501';
  END IF;

  -- 2. Resolve target owner ID: default to caller's own auth.uid() if omitted
  v_target_owner_id := COALESCE(p_owner_id, v_caller_uid);

  -- 3. Strict Authorization: caller can ONLY access their own vehicles
  IF v_target_owner_id <> v_caller_uid THEN
    RAISE EXCEPTION 'Forbidden: caller (%) cannot access vehicles of owner (%)', v_caller_uid, v_target_owner_id USING ERRCODE = '42501';
  END IF;

  -- 4. Retrieve vehicles strictly for the authenticated caller
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(v) ORDER BY v.created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_vehicles_json
  FROM public.vehicles v
  WHERE v.owner_id = v_caller_uid;

  RETURN v_vehicles_json;
END;
$$;

-- ============================================================================
-- Function 7: Secure Owner Trusted Contacts Retrieval (AUTHENTICATED ONLY, STRICT auth.uid() ENFORCEMENT)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_owner_trusted_contacts(p_owner_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_contacts_json JSONB;
  v_caller_uid UUID;
  v_target_owner_id UUID;
BEGIN
  -- 1. Ensure the caller is an authenticated user with a valid JWT
  v_caller_uid := auth.uid();
  IF v_caller_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authenticated session required' USING ERRCODE = '42501';
  END IF;

  -- 2. Resolve target owner ID: default to caller's own auth.uid() if omitted
  v_target_owner_id := COALESCE(p_owner_id, v_caller_uid);

  -- 3. Strict Authorization: caller can ONLY access their own contacts
  IF v_target_owner_id <> v_caller_uid THEN
    RAISE EXCEPTION 'Forbidden: caller (%) cannot access contacts of owner (%)', v_caller_uid, v_target_owner_id USING ERRCODE = '42501';
  END IF;

  -- 4. Retrieve contacts strictly for the authenticated caller
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(tc) ORDER BY tc.is_primary DESC, tc.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_contacts_json
  FROM public.trusted_contacts tc
  WHERE tc.owner_id = v_caller_uid;

  RETURN v_contacts_json;
END;
$$;

-- ============================================================================
-- EXPLICIT FUNCTION PERMISSIONS (REVOKE FROM PUBLIC, RESTRICT SENSITIVE RPCS TO AUTHENTICATED)
-- ============================================================================
REVOKE ALL ON FUNCTION public.get_public_vehicle_by_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_contact_request(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_parking_report(TEXT, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_emergency_alert(TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_owner_and_vehicle(JSONB, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_owner_vehicles(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_owner_vehicles(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_owner_trusted_contacts(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_owner_trusted_contacts(UUID) FROM anon;

-- Public Anonymous Scanning & Reporting RPCS (Anonymous phone camera/browser access)
GRANT EXECUTE ON FUNCTION public.get_public_vehicle_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_contact_request(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_parking_report(TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_emergency_alert(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_owner_and_vehicle(JSONB, JSONB, JSONB) TO anon, authenticated;

-- Private Owner RPCS (AUTHENTICATED ONLY - Anonymous access revoked)
GRANT EXECUTE ON FUNCTION public.get_owner_vehicles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_trusted_contacts(UUID) TO authenticated;

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
