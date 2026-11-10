import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Profile, 
  Vehicle, 
  TrustedContact, 
  ContactRequest, 
  ParkingReport, 
  EmergencyAlert, 
  ActivityEvent,
  PublicVehicleData,
  ParkingReason,
  ContactRequestCategory
} from '../types';

/**
 * Normalizes identifier (phone or email) into an auth-compliant email string.
 * For phone-first users: converts 10-digit number into `${cleanPhone}@users.trustfordge.com`
 */
export function formatAuthEmail(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const cleanPhone = trimmed.replace(/[\s\-\(\)]/g, '').replace(/^\+91|^91|^0/, '');
  return `${cleanPhone}@users.trustfordge.com`;
}

// ============================================================================
// SUPABASE AUTHENTICATION
// ============================================================================

export async function signUpOwnerWithSupabase(params: {
  fullName: string;
  phone: string;
  email?: string;
  password?: string;
  address?: string;
}): Promise<{ user: any; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: 'Supabase is not configured' };
  }

  const cleanPhone = params.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91|^91|^0/, '');
  const authEmail = params.email?.trim() 
    ? params.email.trim().toLowerCase() 
    : `${cleanPhone}@users.trustfordge.com`;
  
  // Default fallback password for non-blocking onboarding if omitted
  const authPassword = params.password && params.password.length >= 6 
    ? params.password 
    : `TF#${cleanPhone}`;

  try {
    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: {
        data: {
          full_name: params.fullName.trim(),
          phone: params.phone.trim(),
        },
      },
    });

    if (authError) {
      // If user already registered, attempt sign-in
      if (authError.message.toLowerCase().includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (signInError) {
          return { user: null, error: signInError.message };
        }
        return { user: signInData.user, error: null };
      }
      return { user: null, error: authError.message };
    }

    const user = authData.user;
    if (!user) {
      return { user: null, error: 'No user returned from authentication.' };
    }

    // Ensure an active session is established with a valid auth JWT
    if (!authData.session) {
      try {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (signInData?.user) {
          await supabase.from('profiles').upsert({
            id: signInData.user.id,
            full_name: params.fullName.trim(),
            email: params.email?.trim() || null,
            phone: params.phone.trim(),
            phone_verified: false,
            residential_address: params.address?.trim() || null,
            updated_at: new Date().toISOString(),
          });
          return { user: signInData.user, error: null };
        }
      } catch (signInErr) {
        console.warn('Auto sign-in post-signup notice:', signInErr);
      }
    }

    // 2. Upsert profile in public.profiles table
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: params.fullName.trim(),
      email: params.email?.trim() || null,
      phone: params.phone.trim(),
      phone_verified: false,
      residential_address: params.address?.trim() || null,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.warn('Profile upsert warning:', profileError);
    }

    return { user, error: null };
  } catch (err: any) {
    console.error('Supabase signup error:', err);
    return { user: null, error: err.message || 'Authentication failed' };
  }
}

export async function signInOwnerWithSupabase(params: {
  identifier: string;
  password?: string;
}): Promise<{ user: any; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: 'Supabase is not configured' };
  }

  const authEmail = formatAuthEmail(params.identifier);
  const cleanPhone = params.identifier.replace(/[\s\-\(\)]/g, '').replace(/^\+91|^91|^0/, '');
  const authPassword = params.password || `TF#${cleanPhone}`;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Sign in failed' };
  }
}

export async function signOutOwnerFromSupabase(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
}

export async function getSupabaseSession(): Promise<any> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ============================================================================
// OWNER DATABASE OPERATIONS (STRICT RLS COMPLIANT)
// ============================================================================

export async function fetchOwnerProfileFromDb(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching profile from db:', error);
      return null;
    }
    return data as Profile;
  } catch (err) {
    console.warn('Profile fetch exception:', err);
    return null;
  }
}

export async function fetchOwnerVehiclesFromDb(userId: string): Promise<Vehicle[]> {
  if (!isSupabaseConfigured || !supabase || !userId) return [];
  try {
    // 1. Try secure SECURITY DEFINER RPC first (works without requiring active auth JWT)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_owner_vehicles', {
      p_owner_id: userId,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      return rpcData as Vehicle[];
    }

    // 2. Direct table fallback
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching vehicles from db:', error);
      return [];
    }
    return (data || []) as Vehicle[];
  } catch (err) {
    console.warn('Vehicles fetch exception:', err);
    return [];
  }
}

export async function fetchOwnerTrustedContactsFromDb(userId: string): Promise<TrustedContact[]> {
  if (!isSupabaseConfigured || !supabase || !userId) return [];
  try {
    // 1. Try secure SECURITY DEFINER RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_owner_trusted_contacts', {
      p_owner_id: userId,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      return rpcData as TrustedContact[];
    }

    // 2. Direct table fallback
    const { data, error } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching contacts from db:', error);
      return [];
    }
    return (data || []) as TrustedContact[];
  } catch (err) {
    console.warn('Contacts fetch exception:', err);
    return [];
  }
}

export async function fetchOwnerContactRequestsFromDb(vehicleIds: string[]): Promise<ContactRequest[]> {
  if (!isSupabaseConfigured || !supabase || vehicleIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('contact_requests')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching contact requests:', error);
      return [];
    }
    return (data || []) as ContactRequest[];
  } catch (err) {
    return [];
  }
}

export async function fetchOwnerParkingReportsFromDb(vehicleIds: string[]): Promise<ParkingReport[]> {
  if (!isSupabaseConfigured || !supabase || vehicleIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('parking_reports')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching parking reports:', error);
      return [];
    }
    return (data || []) as ParkingReport[];
  } catch (err) {
    return [];
  }
}

export async function fetchOwnerEmergencyAlertsFromDb(vehicleIds: string[]): Promise<EmergencyAlert[]> {
  if (!isSupabaseConfigured || !supabase || vehicleIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching emergency alerts:', error);
      return [];
    }
    return (data || []) as EmergencyAlert[];
  } catch (err) {
    return [];
  }
}

export async function fetchOwnerActivityEventsFromDb(vehicleIds: string[]): Promise<ActivityEvent[]> {
  if (!isSupabaseConfigured || !supabase || vehicleIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('activity_events')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching activity events:', error);
      return [];
    }
    return (data || []) as ActivityEvent[];
  } catch (err) {
    return [];
  }
}

export async function updateVehicleSettingsInDb(
  vehicleId: string, 
  updates: Partial<Vehicle>
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('vehicles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicleId);

    return !error;
  } catch {
    return false;
  }
}

export async function updateContactRequestStatusInDb(
  requestId: string, 
  status: 'pending' | 'acknowledged' | 'resolved'
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('contact_requests')
      .update({
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', requestId);

    return !error;
  } catch {
    return false;
  }
}

export async function updateParkingReportStatusInDb(
  reportId: string, 
  status: 'pending' | 'acknowledged' | 'resolved' | 'dismissed'
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('parking_reports')
      .update({
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', reportId);

    return !error;
  } catch {
    return false;
  }
}

export async function updateEmergencyAlertStatusInDb(
  alertId: string, 
  status: 'active' | 'acknowledged' | 'resolved'
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('emergency_alerts')
      .update({
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', alertId);

    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// ATOMIC OWNER & VEHICLE REGISTRATION RPC
// ============================================================================

export async function registerOwnerAndVehicleRpc(params: {
  profile: Partial<Profile>;
  vehicle: Partial<Vehicle>;
  contacts: Partial<TrustedContact>[];
}): Promise<{
  success: boolean;
  ownerId?: string;
  vehicleId?: string;
  qrToken?: string;
  error?: string;
  message?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'NOT_CONFIGURED', message: 'Backend is offline.' };
  }

  try {
    const { data, error } = await supabase.rpc('register_owner_and_vehicle', {
      p_profile: params.profile,
      p_vehicle: params.vehicle,
      p_contacts: params.contacts,
    });

    if (error) {
      console.warn('RPC register_owner_and_vehicle error:', error);
      return { success: false, error: 'RPC_ERROR', message: error.message };
    }

    if (data && data.success) {
      return {
        success: true,
        ownerId: data.owner_id,
        vehicleId: data.vehicle_id,
        qrToken: data.qr_token,
        message: data.message,
      };
    }

    return {
      success: false,
      error: data?.error || 'REGISTRATION_FAILED',
      message: data?.message || 'Could not register vehicle.',
    };
  } catch (err: any) {
    console.warn('registerOwnerAndVehicleRpc exception:', err);
    return { success: false, error: 'EXCEPTION', message: err.message };
  }
}

// ============================================================================
// PUBLIC RPC REPO (SECURITY DEFINER CALLS FOR SCANNERS)
// ============================================================================

export async function fetchPublicVehicleRpc(token: string): Promise<{
  success: boolean;
  vehicle?: PublicVehicleData;
  error?: string;
  message?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'NOT_CONFIGURED', message: 'Backend is offline.' };
  }

  try {
    const { data, error } = await supabase.rpc('get_public_vehicle_by_token', {
      p_token: token,
    });

    if (error) {
      console.error('RPC get_public_vehicle_by_token error:', error);
      return { success: false, error: 'RPC_ERROR', message: error.message };
    }

    if (data && typeof data === 'object') {
      if (data.success && data.vehicle) {
        return { success: true, vehicle: data.vehicle as PublicVehicleData };
      }
      return {
        success: false,
        error: data.error || 'INVALID_TOKEN',
        message: data.message || 'Vehicle QR code is not recognized.',
      };
    }

    return { success: false, error: 'INVALID_TOKEN', message: 'No vehicle record found.' };
  } catch (err: any) {
    console.error('fetchPublicVehicleRpc exception:', err);
    return { success: false, error: 'NETWORK_ERROR', message: err.message || 'Connection failed.' };
  }
}

export async function submitPublicContactRequestRpc(params: {
  token: string;
  category: ContactRequestCategory;
  message?: string;
  callerContact?: string;
  location?: { latitude: number; longitude: number };
}): Promise<{ success: boolean; message?: string; requestId?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'NOT_CONFIGURED' };
  }

  try {
    const { data, error } = await supabase.rpc('submit_public_contact_request', {
      p_token: params.token,
      p_category: params.category,
      p_message: params.message || null,
      p_caller_contact: params.callerContact || null,
      p_location: params.location || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && data.success) {
      return {
        success: true,
        requestId: data.request_id,
        message: data.message || 'Your message has been dispatched to the vehicle owner.',
      };
    }

    return { 
      success: false, 
      error: data?.error || 'Failed to submit contact request.',
      message: data?.message || 'Failed to submit contact request.'
    };
  } catch (err: any) {
    return { success: false, error: err.message, message: err.message };
  }
}

export async function submitPublicParkingReportRpc(params: {
  token: string;
  reason: ParkingReason;
  description?: string;
  location?: { latitude: number; longitude: number };
  scannerContact?: string;
}): Promise<{ success: boolean; reportId?: string; error?: string; message?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'NOT_CONFIGURED', message: 'Backend is offline.' };
  }

  try {
    const { data, error } = await supabase.rpc('submit_public_parking_report', {
      p_token: params.token,
      p_reason: params.reason,
      p_description: params.description || null,
      p_location: params.location || null,
      p_scanner_contact: params.scannerContact || null,
    });

    if (error) {
      return { success: false, error: error.message, message: error.message };
    }

    if (data && data.success) {
      return { success: true, reportId: data.report_id, message: data.message };
    }

    return { 
      success: false, 
      error: data?.error || 'Failed to submit parking report.',
      message: data?.message || 'Failed to submit parking report.'
    };
  } catch (err: any) {
    return { success: false, error: err.message, message: err.message };
  }
}

export async function submitPublicEmergencyAlertRpc(params: {
  token: string;
  message?: string;
  location?: { latitude: number; longitude: number };
}): Promise<{ 
  success: boolean; 
  alertId?: string; 
  contactsNotifiedCount?: number; 
  configuredContactsCount?: number; 
  error?: string; 
  message?: string; 
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'NOT_CONFIGURED', message: 'Backend is offline.' };
  }

  try {
    const { data, error } = await supabase.rpc('submit_public_emergency_alert', {
      p_token: params.token,
      p_message: params.message || null,
      p_location: params.location || null,
    });

    if (error) {
      return { success: false, error: error.message, message: error.message };
    }

    if (data && data.success) {
      return { 
        success: true, 
        alertId: data.alert_id,
        contactsNotifiedCount: 0,
        configuredContactsCount: data.configured_contacts_count || 0,
        message: data.message
      };
    }

    return { 
      success: false, 
      error: data?.error || 'Failed to dispatch emergency alert.',
      message: data?.message || 'Failed to dispatch emergency alert.'
    };
  } catch (err: any) {
    return { success: false, error: err.message, message: err.message };
  }
}

