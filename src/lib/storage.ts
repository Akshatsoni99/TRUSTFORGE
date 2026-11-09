import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Profile, 
  Vehicle, 
  TrustedContact, 
  ActivityEvent, 
  ParkingReport, 
  EmergencyAlert, 
  ContactRequest,
  ContactRequestCategory,
  NotificationLog, 
  PublicVehicleData, 
  OnboardingData,
  ParkingReason,
  ReportStatus,
  EmergencyStatus
} from '../types';
import { generateSecureToken, maskVehicleNumber } from './utils';

const STORAGE_KEYS = {
  CURRENT_OWNER: 'tf_current_owner_id',
  PROFILES: 'tf_db_profiles',
  VEHICLES: 'tf_db_vehicles',
  TRUSTED_CONTACTS: 'tf_db_trusted_contacts',
  ACTIVITY_EVENTS: 'tf_db_activity_events',
  PARKING_REPORTS: 'tf_db_parking_reports',
  EMERGENCY_ALERTS: 'tf_db_emergency_alerts',
  CONTACT_REQUESTS: 'tf_db_contact_requests',
  NOTIFICATION_LOGS: 'tf_db_notification_logs',
};

// Auto-clean any legacy demo/seed data if found in browser storage
(() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const currentOwner = localStorage.getItem(STORAGE_KEYS.CURRENT_OWNER);
      if (currentOwner === 'usr_demo_owner') {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_OWNER);
      }
      const rawVehicles = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      if (rawVehicles && rawVehicles.includes('veh_demo_car')) {
        const vehicles = JSON.parse(rawVehicles).filter((v: any) => v.id !== 'veh_demo_car');
        localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
      }
      const rawProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (rawProfiles && rawProfiles.includes('usr_demo_owner')) {
        const profiles = JSON.parse(rawProfiles).filter((p: any) => p.id !== 'usr_demo_owner');
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
      }
    }
  } catch {
    // Ignore cleanup errors
  }
})();

// Event dispatcher for reactive dashboard updates when public actions occur in another tab/window
const emitStorageEvent = (eventType: string, data?: any) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trustforge-db-change', { detail: { eventType, data } }));
  }
};

/**
 * Checks backend connectivity status
 */
export function getBackendStatus(): {
  isConfigured: boolean;
  mode: 'supabase' | 'local_storage';
  telephonyConfigured: boolean;
} {
  const telephony = import.meta.env.VITE_TELEPHONY_PROVIDER;
  const isTelephonyActive = Boolean(telephony && telephony !== 'none');
  return {
    isConfigured: isSupabaseConfigured,
    mode: isSupabaseConfigured ? 'supabase' : 'local_storage',
    telephonyConfigured: isTelephonyActive,
  };
}

// ============================================================================
// LOCAL STORAGE ADAPTER
// ============================================================================

function getLocalTable<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalTable<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to write to localStorage for key ${key}:`, err);
  }
}

// Current logged in owner ID
export function getCurrentOwnerId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_OWNER);
}

export function setCurrentOwnerId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_OWNER, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_OWNER);
  }
}

export function getCurrentProfile(): Profile | null {
  const ownerId = getCurrentOwnerId();
  if (!ownerId) return null;
  const profiles = getLocalTable<Profile>(STORAGE_KEYS.PROFILES);
  return profiles.find(p => p.id === ownerId) || null;
}

// ============================================================================
// REGISTRATION & ONBOARDING (REAL USER DATA ONLY)
// ============================================================================

export async function registerOwnerAndVehicle(data: OnboardingData): Promise<{
  owner: Profile;
  vehicle: Vehicle;
  trustedContacts: TrustedContact[];
}> {
  const now = new Date().toISOString();
  const ownerId = `usr_${generateSecureToken(8)}`;
  const vehicleId = `veh_${generateSecureToken(8)}`;
  const qrToken = generateSecureToken(16);

  // 1. Profile Record
  const newProfile: Profile = {
    id: ownerId,
    full_name: data.fullName.trim(),
    email: data.email?.trim() ? data.email.trim().toLowerCase() : undefined,
    phone: data.phone.trim(),
    phone_verified: false, // OTP is optional in MVP; stored as unverified
    residential_address: data.address?.trim() || undefined,
    created_at: now,
    updated_at: now,
  };

  // 2. Vehicle Record
  const newVehicle: Vehicle = {
    id: vehicleId,
    owner_id: ownerId,
    category: data.category,
    brand: data.brand.trim(),
    model: data.model.trim(),
    model_year: Number(data.modelYear),
    registration_number: data.registrationNumber.trim().toUpperCase(),
    color: data.color.trim(),
    photo_url: data.photoUrl?.trim() || undefined,
    qr_token: qrToken,
    qr_active: true,
    qr_scans_count: 0,
    allow_contact_requests: true,
    allow_parking_reports: true,
    allow_emergency_alerts: true,
    mask_registration_number: Boolean(data.maskRegistrationNumber),
    allow_public_phone_display: Boolean(data.allowPublicPhoneDisplay),
    show_owner_name: Boolean(data.showOwnerName ?? true),
    created_at: now,
    updated_at: now,
  };

  // 3. Trusted Contacts
  const newContacts: TrustedContact[] = data.contacts.map((c, index) => ({
    id: `cnt_${generateSecureToken(8)}`,
    owner_id: ownerId,
    vehicle_id: vehicleId,
    full_name: c.fullName.trim(),
    relationship: c.relationship.trim(),
    phone: c.phone.trim(),
    email: c.email?.trim() || undefined,
    phone_verified: false,
    is_primary: index === 0,
    notify_on_emergency: Boolean(c.notifyOnEmergency),
    created_at: now,
  }));

  // If Supabase is configured, write to cloud
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').insert({
        id: ownerId,
        full_name: newProfile.full_name,
        email: newProfile.email || null,
        phone: newProfile.phone,
        phone_verified: false,
        residential_address: newProfile.residential_address || null,
      });

      await supabase.from('vehicles').insert({
        id: newVehicle.id,
        owner_id: ownerId,
        category: newVehicle.category,
        brand: newVehicle.brand,
        model: newVehicle.model,
        model_year: newVehicle.model_year,
        registration_number: newVehicle.registration_number,
        color: newVehicle.color,
        photo_url: newVehicle.photo_url || null,
        qr_token: newVehicle.qr_token,
        qr_active: newVehicle.qr_active,
        mask_registration_number: newVehicle.mask_registration_number,
        allow_public_phone_display: newVehicle.allow_public_phone_display,
        show_owner_name: newVehicle.show_owner_name,
      });

      if (newContacts.length > 0) {
        await supabase.from('trusted_contacts').insert(
          newContacts.map(c => ({
            id: c.id,
            owner_id: ownerId,
            vehicle_id: vehicleId,
            full_name: c.full_name,
            relationship: c.relationship,
            phone: c.phone,
            email: c.email || null,
            phone_verified: false,
            is_primary: c.is_primary,
            notify_on_emergency: c.notify_on_emergency,
          }))
        );
      }
    } catch (err) {
      console.warn('Supabase insert issue; local persistent fallback active:', err);
    }
  }

  // Always sync to local persistent store for seamless offline/browser persistence
  const profiles = getLocalTable<Profile>(STORAGE_KEYS.PROFILES);
  profiles.push(newProfile);
  setLocalTable(STORAGE_KEYS.PROFILES, profiles);

  const vehicles = getLocalTable<Vehicle>(STORAGE_KEYS.VEHICLES);
  vehicles.push(newVehicle);
  setLocalTable(STORAGE_KEYS.VEHICLES, vehicles);

  const contacts = getLocalTable<TrustedContact>(STORAGE_KEYS.TRUSTED_CONTACTS);
  contacts.push(...newContacts);
  setLocalTable(STORAGE_KEYS.TRUSTED_CONTACTS, contacts);

  // Set session owner
  setCurrentOwnerId(ownerId);
  emitStorageEvent('registered', { ownerId, vehicleId });

  return {
    owner: newProfile,
    vehicle: newVehicle,
    trustedContacts: newContacts,
  };
}

// ============================================================================
// VEHICLE & QR MANAGEMENT
// ============================================================================

export function getOwnerVehicles(ownerId: string): Vehicle[] {
  const vehicles = getLocalTable<Vehicle>(STORAGE_KEYS.VEHICLES);
  return vehicles.filter(v => v.owner_id === ownerId);
}

export function getVehicleById(vehicleId: string): Vehicle | null {
  const vehicles = getLocalTable<Vehicle>(STORAGE_KEYS.VEHICLES);
  return vehicles.find(v => v.id === vehicleId) || null;
}

export function updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Vehicle | null {
  const vehicles = getLocalTable<Vehicle>(STORAGE_KEYS.VEHICLES);
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index === -1) return null;

  vehicles[index] = {
    ...vehicles[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  setLocalTable(STORAGE_KEYS.VEHICLES, vehicles);
  emitStorageEvent('vehicle_updated', { vehicleId });
  return vehicles[index];
}

export function regenerateQRToken(vehicleId: string): { success: boolean; newToken?: string; error?: string } {
  const vehicles = getLocalTable<Vehicle>(STORAGE_KEYS.VEHICLES);
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index === -1) return { success: false, error: 'Vehicle not found' };

  const newToken = generateSecureToken(16);
  vehicles[index].qr_token = newToken;
  vehicles[index].updated_at = new Date().toISOString();
  setLocalTable(STORAGE_KEYS.VEHICLES, vehicles);

  logActivityEvent(vehicleId, 'qr_token_regenerated', {
    note: 'Previous QR token was invalidated and replaced with a new secure token.',
    timestamp: new Date().toISOString(),
  });

  emitStorageEvent('qr_token_regenerated', { vehicleId, newToken });
  return { success: true, newToken };
}

export function toggleQRStatus(vehicleId: string, active: boolean): { success: boolean; active?: boolean } {
  const vehicles = getLocalTable<Vehicle>(STORAGE_KEYS.VEHICLES);
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index === -1) return { success: false };

  vehicles[index].qr_active = active;
  vehicles[index].updated_at = new Date().toISOString();
  setLocalTable(STORAGE_KEYS.VEHICLES, vehicles);

  logActivityEvent(vehicleId, 'qr_status_changed', {
    status: active ? 'activated' : 'deactivated',
    timestamp: new Date().toISOString(),
  });

  emitStorageEvent('qr_status_changed', { vehicleId, active });
  return { success: true, active };
}

// ============================================================================
// PUBLIC QR LOOKUP & SAFE DATA RETRIEVAL (NO PRIVATE DATA EXPOSURE)
// ============================================================================

export function getPublicVehicleByToken(token: string): {
  success: boolean;
  vehicle?: PublicVehicleData;
  error?: 'INVALID_TOKEN' | 'INACTIVE_QR' | 'NOT_FOUND';
  message?: string;
} {
  const vehicles = getLocalTable<Vehicle>(STORAGE_KEYS.VEHICLES);
  const vehicle = vehicles.find(v => v.qr_token === token);

  if (!vehicle) {
    return {
      success: false,
      error: 'INVALID_TOKEN',
      message: 'This vehicle QR code is not recognized or has been invalidated.',
    };
  }

  if (!vehicle.qr_active) {
    return {
      success: false,
      error: 'INACTIVE_QR',
      message: 'This vehicle QR code has been temporarily deactivated by the owner.',
    };
  }

  // Increment scan count and log scan event
  vehicle.qr_scans_count = (vehicle.qr_scans_count || 0) + 1;
  setLocalTable(STORAGE_KEYS.VEHICLES, vehicles);

  logActivityEvent(vehicle.id, 'qr_scan', {
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    timestamp: new Date().toISOString(),
  });

  const profiles = getLocalTable<Profile>(STORAGE_KEYS.PROFILES);
  const owner = profiles.find(p => p.id === vehicle.owner_id);

  let ownerDisplayName: string | undefined = undefined;
  if (vehicle.show_owner_name !== false && owner?.full_name) {
    const parts = owner.full_name.trim().split(' ');
    ownerDisplayName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
  }

  // Count trusted contacts without revealing any personal contact info
  const contacts = getLocalTable<TrustedContact>(STORAGE_KEYS.TRUSTED_CONTACTS);
  const trustedCount = contacts.filter(c => c.vehicle_id === vehicle.id || c.owner_id === vehicle.owner_id).length;

  const displayReg = vehicle.mask_registration_number
    ? maskVehicleNumber(vehicle.registration_number)
    : vehicle.registration_number;

  const publicData: PublicVehicleData = {
    id: vehicle.id,
    category: vehicle.category,
    brand: vehicle.brand,
    model: vehicle.model,
    color: vehicle.color,
    registration_display: displayReg,
    photo_url: vehicle.photo_url,
    owner_display_name: ownerDisplayName,
    trusted_contacts_count: trustedCount,
    allow_contact_requests: vehicle.allow_contact_requests ?? true,
    allow_parking_reports: vehicle.allow_parking_reports ?? true,
    allow_emergency_alerts: vehicle.allow_emergency_alerts ?? true,
    allow_public_phone_display: Boolean(vehicle.allow_public_phone_display),
    // Only reveal phone if owner explicitly opted in via privacy settings
    owner_public_phone: vehicle.allow_public_phone_display && owner?.phone ? owner.phone : undefined,
  };

  return {
    success: true,
    vehicle: publicData,
  };
}

// ============================================================================
// PUBLIC ACTIONS & NOTIFICATIONS (REAL EVENT RECORDING)
// ============================================================================

export function submitContactRequest(params: {
  vehicleId: string;
  category: ContactRequestCategory;
  message?: string;
  callerContact?: string;
  location?: { latitude: number; longitude: number };
}): { success: boolean; message: string; requestId: string } {
  const vehicle = getVehicleById(params.vehicleId);
  if (!vehicle || !vehicle.qr_active) {
    return { success: false, message: 'Vehicle is currently inactive.', requestId: '' };
  }

  const now = new Date().toISOString();
  const requestId = `cr_${generateSecureToken(8)}`;

  const newRequest: ContactRequest = {
    id: requestId,
    vehicle_id: params.vehicleId,
    category: params.category,
    message: params.message?.trim(),
    caller_phone: params.callerContact?.trim(),
    status: 'pending',
    scanner_location: params.location,
    created_at: now,
  };

  const requests = getLocalTable<ContactRequest>(STORAGE_KEYS.CONTACT_REQUESTS);
  requests.unshift(newRequest);
  setLocalTable(STORAGE_KEYS.CONTACT_REQUESTS, requests);

  logActivityEvent(params.vehicleId, 'contact_request', {
    request_id: requestId,
    category: params.category,
    message: params.message || 'Contact request submitted by scanner.',
    contact_provided: Boolean(params.callerContact),
  }, params.location);

  emitStorageEvent('contact_requested', { vehicleId: params.vehicleId, requestId });
  return {
    success: true,
    message: 'Your message has been sent to the vehicle owner.',
    requestId,
  };
}

export function submitParkingReport(params: {
  vehicleId: string;
  reason: ParkingReason;
  description?: string;
  location?: { latitude: number; longitude: number };
  scannerContact?: string;
}): { success: boolean; reportId: string } {
  const now = new Date().toISOString();
  const reportId = `prk_${generateSecureToken(8)}`;

  const newReport: ParkingReport = {
    id: reportId,
    vehicle_id: params.vehicleId,
    reason: params.reason,
    description: params.description?.trim(),
    status: 'pending',
    scanner_location: params.location,
    scanner_contact_opt: params.scannerContact?.trim(),
    created_at: now,
  };

  const reports = getLocalTable<ParkingReport>(STORAGE_KEYS.PARKING_REPORTS);
  reports.unshift(newReport);
  setLocalTable(STORAGE_KEYS.PARKING_REPORTS, reports);

  logActivityEvent(params.vehicleId, 'parking_report', {
    report_id: reportId,
    reason: params.reason,
  }, params.location);

  emitStorageEvent('parking_reported', { vehicleId: params.vehicleId, reportId });
  return { success: true, reportId };
}

export function submitEmergencyAlert(params: {
  vehicleId: string;
  message?: string;
  location?: { latitude: number; longitude: number };
}): { success: boolean; alertId: string; contactsNotified: number } {
  const now = new Date().toISOString();
  const alertId = `emg_${generateSecureToken(8)}`;

  const contacts = getLocalTable<TrustedContact>(STORAGE_KEYS.TRUSTED_CONTACTS);
  const vehicle = getVehicleById(params.vehicleId);
  const eligibleContacts = contacts.filter(
    c => (c.vehicle_id === params.vehicleId || (vehicle && c.owner_id === vehicle.owner_id)) && c.notify_on_emergency
  );

  const newAlert: EmergencyAlert = {
    id: alertId,
    vehicle_id: params.vehicleId,
    severity: 'urgent',
    message: params.message?.trim() || 'Urgent assistance requested via vehicle QR code.',
    scanner_location: params.location,
    contacts_notified_count: eligibleContacts.length,
    status: 'active',
    created_at: now,
  };

  const alerts = getLocalTable<EmergencyAlert>(STORAGE_KEYS.EMERGENCY_ALERTS);
  alerts.unshift(newAlert);
  setLocalTable(STORAGE_KEYS.EMERGENCY_ALERTS, alerts);

  logActivityEvent(params.vehicleId, 'emergency_alert', {
    alert_id: alertId,
    contacts_notified_count: eligibleContacts.length,
    message: newAlert.message,
  }, params.location);

  emitStorageEvent('emergency_alerted', { vehicleId: params.vehicleId, alertId });
  return {
    success: true,
    alertId,
    contactsNotified: eligibleContacts.length,
  };
}

// ============================================================================
// DASHBOARD QUERIES & REAL STATUS UPDATES
// ============================================================================

export function getOwnerStats(ownerId: string): {
  totalScans: number;
  contactRequests: number;
  parkingReports: number;
  emergencyAlerts: number;
  registeredVehiclesCount: number;
  activeQRCodesCount: number;
} {
  const vehicles = getOwnerVehicles(ownerId);
  const vehicleIds = new Set(vehicles.map(v => v.id));

  const totalScans = vehicles.reduce((sum, v) => sum + (v.qr_scans_count || 0), 0);

  const contactRequests = getLocalTable<ContactRequest>(STORAGE_KEYS.CONTACT_REQUESTS)
    .filter(r => vehicleIds.has(r.vehicle_id)).length;

  const parkingReports = getLocalTable<ParkingReport>(STORAGE_KEYS.PARKING_REPORTS)
    .filter(p => vehicleIds.has(p.vehicle_id)).length;

  const emergencyAlerts = getLocalTable<EmergencyAlert>(STORAGE_KEYS.EMERGENCY_ALERTS)
    .filter(a => vehicleIds.has(a.vehicle_id)).length;

  const registeredVehiclesCount = vehicles.length;
  const activeQRCodesCount = vehicles.filter(v => v.qr_active).length;

  return {
    totalScans,
    contactRequests,
    parkingReports,
    emergencyAlerts,
    registeredVehiclesCount,
    activeQRCodesCount,
  };
}

export function getOwnerContactRequests(ownerId: string): ContactRequest[] {
  const vehicleIds = new Set(getOwnerVehicles(ownerId).map(v => v.id));
  return getLocalTable<ContactRequest>(STORAGE_KEYS.CONTACT_REQUESTS)
    .filter(r => vehicleIds.has(r.vehicle_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function updateContactRequestStatus(requestId: string, status: 'pending' | 'acknowledged' | 'resolved'): boolean {
  const requests = getLocalTable<ContactRequest>(STORAGE_KEYS.CONTACT_REQUESTS);
  const index = requests.findIndex(r => r.id === requestId);
  if (index === -1) return false;

  requests[index].status = status;
  if (status === 'resolved') {
    requests[index].resolved_at = new Date().toISOString();
  }
  setLocalTable(STORAGE_KEYS.CONTACT_REQUESTS, requests);
  emitStorageEvent('contact_request_updated', { requestId, status });
  return true;
}

export function getOwnerParkingReports(ownerId: string): ParkingReport[] {
  const vehicleIds = new Set(getOwnerVehicles(ownerId).map(v => v.id));
  return getLocalTable<ParkingReport>(STORAGE_KEYS.PARKING_REPORTS)
    .filter(r => vehicleIds.has(r.vehicle_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function updateParkingReportStatus(reportId: string, status: ReportStatus): boolean {
  const reports = getLocalTable<ParkingReport>(STORAGE_KEYS.PARKING_REPORTS);
  const index = reports.findIndex(r => r.id === reportId);
  if (index === -1) return false;

  reports[index].status = status;
  if (status === 'resolved') {
    reports[index].resolved_at = new Date().toISOString();
  }
  setLocalTable(STORAGE_KEYS.PARKING_REPORTS, reports);
  emitStorageEvent('report_updated', { reportId, status });
  return true;
}

export function getOwnerEmergencyAlerts(ownerId: string): EmergencyAlert[] {
  const vehicleIds = new Set(getOwnerVehicles(ownerId).map(v => v.id));
  return getLocalTable<EmergencyAlert>(STORAGE_KEYS.EMERGENCY_ALERTS)
    .filter(a => vehicleIds.has(a.vehicle_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function updateEmergencyAlertStatus(alertId: string, status: EmergencyStatus): boolean {
  const alerts = getLocalTable<EmergencyAlert>(STORAGE_KEYS.EMERGENCY_ALERTS);
  const index = alerts.findIndex(a => a.id === alertId);
  if (index === -1) return false;

  alerts[index].status = status;
  if (status === 'resolved') {
    alerts[index].resolved_at = new Date().toISOString();
  }
  setLocalTable(STORAGE_KEYS.EMERGENCY_ALERTS, alerts);
  emitStorageEvent('alert_updated', { alertId, status });
  return true;
}

export function getOwnerActivityEvents(ownerId: string): ActivityEvent[] {
  const vehicleIds = new Set(getOwnerVehicles(ownerId).map(v => v.id));
  return getLocalTable<ActivityEvent>(STORAGE_KEYS.ACTIVITY_EVENTS)
    .filter(e => vehicleIds.has(e.vehicle_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getOwnerTrustedContacts(ownerId: string): TrustedContact[] {
  return getLocalTable<TrustedContact>(STORAGE_KEYS.TRUSTED_CONTACTS)
    .filter(c => c.owner_id === ownerId);
}

export function saveTrustedContact(contact: TrustedContact): void {
  const contacts = getLocalTable<TrustedContact>(STORAGE_KEYS.TRUSTED_CONTACTS);
  const index = contacts.findIndex(c => c.id === contact.id);
  if (index >= 0) {
    contacts[index] = contact;
  } else {
    contacts.push(contact);
  }
  setLocalTable(STORAGE_KEYS.TRUSTED_CONTACTS, contacts);
  emitStorageEvent('contacts_updated', { contactId: contact.id });
}

export function deleteTrustedContact(contactId: string): void {
  const contacts = getLocalTable<TrustedContact>(STORAGE_KEYS.TRUSTED_CONTACTS);
  const filtered = contacts.filter(c => c.id !== contactId);
  setLocalTable(STORAGE_KEYS.TRUSTED_CONTACTS, filtered);
  emitStorageEvent('contacts_updated', { contactId });
}

export function updateProfile(ownerId: string, updates: Partial<Profile>): Profile | null {
  const profiles = getLocalTable<Profile>(STORAGE_KEYS.PROFILES);
  const index = profiles.findIndex(p => p.id === ownerId);
  if (index === -1) return null;

  profiles[index] = {
    ...profiles[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  setLocalTable(STORAGE_KEYS.PROFILES, profiles);
  emitStorageEvent('profile_updated', { ownerId });
  return profiles[index];
}

export function purgeAllLocalData(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    emitStorageEvent('db_purged');
  }
}

// Helpers
function logActivityEvent(
  vehicleId: string,
  eventType: ActivityEvent['event_type'],
  details: Record<string, any>,
  location?: { latitude: number; longitude: number }
) {
  const events = getLocalTable<ActivityEvent>(STORAGE_KEYS.ACTIVITY_EVENTS);
  const newEvent: ActivityEvent = {
    id: `act_${generateSecureToken(8)}`,
    vehicle_id: vehicleId,
    event_type: eventType,
    details,
    scanner_location: location,
    created_at: new Date().toISOString(),
  };
  events.unshift(newEvent);
  setLocalTable(STORAGE_KEYS.ACTIVITY_EVENTS, events);
}
