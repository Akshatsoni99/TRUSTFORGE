export type VehicleCategory = 'car' | 'bike' | 'scooter' | 'other';

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  phone: string;
  phone_verified: boolean;
  date_of_birth?: string;
  residential_address?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  category: VehicleCategory;
  brand: string;
  model: string;
  model_year: number;
  registration_number: string;
  color: string;
  photo_url?: string;
  qr_token: string;
  qr_active: boolean;
  qr_scans_count: number;
  allow_contact_requests: boolean;
  allow_parking_reports: boolean;
  allow_emergency_alerts: boolean;
  mask_registration_number: boolean;
  allow_public_phone_display: boolean;
  show_owner_name: boolean;
  allow_public_address_display?: boolean;
  allow_trusted_contacts_display?: boolean;
  allow_trusted_contacts_phone_display?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrustedContact {
  id: string;
  owner_id: string;
  vehicle_id?: string;
  full_name: string;
  relationship: string;
  phone: string;
  email?: string;
  phone_verified: boolean;
  is_primary: boolean;
  notify_on_emergency: boolean;
  created_at: string;
}

export type ActivityEventType = 
  | 'qr_scan' 
  | 'contact_request' 
  | 'parking_report' 
  | 'emergency_alert' 
  | 'qr_token_regenerated' 
  | 'qr_status_changed';

export interface ActivityEvent {
  id: string;
  vehicle_id: string;
  event_type: ActivityEventType;
  details: Record<string, any>;
  client_ip_hash?: string;
  user_agent?: string;
  scanner_location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  created_at: string;
}

export type ParkingReason = 'blocking_entrance' | 'wrong_parking' | 'blocking_vehicle' | 'other';
export type ReportStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';

export interface ParkingReport {
  id: string;
  vehicle_id: string;
  reason: ParkingReason;
  description?: string;
  status: ReportStatus;
  scanner_location?: {
    latitude: number;
    longitude: number;
  };
  scanner_contact_opt?: string;
  created_at: string;
  resolved_at?: string;
}

export type ContactRequestCategory = 'general' | 'parking' | 'lights_on' | 'window_open' | 'other';

export interface ContactRequest {
  id: string;
  vehicle_id: string;
  category: ContactRequestCategory;
  message?: string;
  caller_phone?: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  scanner_location?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
  resolved_at?: string;
}

export type EmergencySeverity = 'urgent' | 'critical';
export type EmergencyStatus = 'active' | 'acknowledged' | 'resolved';

export interface EmergencyAlert {
  id: string;
  vehicle_id: string;
  severity: EmergencySeverity;
  message?: string;
  scanner_location?: {
    latitude: number;
    longitude: number;
  };
  contacts_notified_count: number;
  status: EmergencyStatus;
  created_at: string;
  resolved_at?: string;
}

export interface NotificationLog {
  id: string;
  vehicle_id: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'in_app' | 'push';
  recipient_type: 'owner' | 'trusted_contact' | 'emergency_services';
  recipient_masked: string;
  status: 'sent' | 'delivered' | 'failed' | 'not_configured';
  error_message?: string;
  created_at: string;
}

export interface PublicTrustedContact {
  id: string;
  full_name: string;
  relationship: string;
  phone?: string | null;
  is_primary?: boolean;
}

// Public vehicle details returned by secure token lookup
export interface PublicVehicleData {
  id: string;
  category: VehicleCategory;
  brand: string;
  model: string;
  model_year?: number;
  color: string;
  registration_display: string;
  photo_url?: string;
  owner_display_name?: string;
  trusted_contacts_count: number;
  trusted_contacts?: PublicTrustedContact[];
  allow_contact_requests: boolean;
  allow_parking_reports: boolean;
  allow_emergency_alerts: boolean;
  allow_public_phone_display: boolean;
  owner_public_phone?: string; // ONLY populated if owner explicitly enabled allow_public_phone_display
  allow_public_address_display?: boolean;
  owner_public_address?: string; // ONLY populated if owner explicitly enabled allow_public_address_display
  allow_trusted_contacts_display?: boolean;
  allow_trusted_contacts_phone_display?: boolean;
}

// Registration Onboarding Form State
export interface OnboardingData {
  // Step 1: Personal & Authentication
  fullName: string;
  phone: string;
  email?: string;
  password?: string;
  address?: string;

  // Step 2: Vehicle
  category: VehicleCategory;
  brand: string;
  model: string;
  modelYear: number;
  registrationNumber: string;
  color: string;
  photoUrl?: string;

  // Step 3: Contacts (at least 2 required)
  contacts: Array<{
    fullName: string;
    relationship: string;
    phone: string;
    email?: string;
    notifyOnEmergency: boolean;
  }>;

  // Privacy Options
  maskRegistrationNumber: boolean;
  allowPublicPhoneDisplay: boolean;
  showOwnerName: boolean;
  allowPublicAddressDisplay?: boolean;
  allowTrustedContactsDisplay?: boolean;
  consentAgreed: boolean;
}
