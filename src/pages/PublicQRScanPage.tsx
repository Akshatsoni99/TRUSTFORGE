import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Shield, 
  Car, 
  PhoneCall, 
  Phone,
  AlertTriangle, 
  AlertOctagon, 
  MessageSquare, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Lock, 
  ShieldAlert, 
  X, 
  Send, 
  Navigation,
  ZoomIn,
  Info
} from 'lucide-react';
import { 
  getPublicVehicleByToken, 
  submitContactRequest, 
  submitParkingReport, 
  submitEmergencyAlert 
} from '../lib/storage';
import { PublicVehicleData, ParkingReason, ContactRequestCategory } from '../types';
import { checkRateLimit } from '../lib/utils';

export const PublicQRScanPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<PublicVehicleData | null>(null);
  const [errorStatus, setErrorStatus] = useState<'INVALID_TOKEN' | 'INACTIVE_QR' | 'NOT_FOUND' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Active Action Modal State
  const [activeModal, setActiveModal] = useState<'contact' | 'parking' | 'emergency' | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Lightbox Preview State for Vehicle Photograph
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Form states for modals
  const [contactCategory, setContactCategory] = useState<ContactRequestCategory>('general');
  const [contactMessage, setContactMessage] = useState('');
  const [callerPhone, setCallerPhone] = useState('');

  const [parkingReason, setParkingReason] = useState<ParkingReason>('blocking_entrance');
  const [parkingDescription, setParkingDescription] = useState('');
  const [scannerPhoneOpt, setScannerPhoneOpt] = useState('');

  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [scannerLocation, setScannerLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationConsentGranted, setLocationConsentGranted] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorStatus('INVALID_TOKEN');
      setErrorMessage('No QR code token was provided in the URL.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchVehicle = async () => {
      try {
        const res = await getPublicVehicleByToken(token);
        if (!isMounted) return;
        if (res.success && res.vehicle) {
          setVehicle(res.vehicle);
        } else {
          setErrorStatus(res.error || 'INVALID_TOKEN');
          setErrorMessage(res.message || 'Vehicle QR code is not recognized.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorStatus('INVALID_TOKEN');
        setErrorMessage(err.message || 'Failed to retrieve vehicle details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVehicle();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Request browser location with explicit consent
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setScannerLocation({
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
        });
        setLocationConsentGranted(true);
        setRequestingLocation(false);
      },
      (err) => {
        console.warn('Location permission denied or unavailable:', err.message);
        setRequestingLocation(false);
      },
      { timeout: 8000 }
    );
  };

  // Submit Contact Request
  const handleSubmitContact = async () => {
    if (!vehicle || !token || submittingAction) return;
    const rateCheck = checkRateLimit(`contact_${vehicle.id}`, 20);
    if (!rateCheck.allowed) {
      alert(`Please wait ${rateCheck.remainingSeconds}s before sending another contact request to this vehicle.`);
      return;
    }

    setSubmittingAction(true);
    try {
      const result = await submitContactRequest({
        vehicleId: vehicle.id,
        category: contactCategory,
        message: contactMessage,
        callerContact: callerPhone,
        location: scannerLocation,
        token: token,
      });

      setActiveModal(null);
      setContactMessage('');
      setCallerPhone('');
      setActionSuccess(result.message || 'Your message has been dispatched to the vehicle owner.');
    } catch (err: any) {
      alert(err?.message || 'Failed to send contact request. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Parking Report
  const handleSubmitParking = async () => {
    if (!vehicle || !token || submittingAction) return;
    const rateCheck = checkRateLimit(`parking_${vehicle.id}`, 20);
    if (!rateCheck.allowed) {
      alert(`Please wait ${rateCheck.remainingSeconds}s before submitting another parking report.`);
      return;
    }

    setSubmittingAction(true);
    try {
      await submitParkingReport({
        vehicleId: vehicle.id,
        reason: parkingReason,
        description: parkingDescription,
        location: scannerLocation,
        scannerContact: scannerPhoneOpt,
        token: token,
      });

      setActiveModal(null);
      setParkingDescription('');
      setScannerPhoneOpt('');
      setActionSuccess('Parking report submitted. The vehicle owner has been notified in their dashboard.');
    } catch (err: any) {
      alert(err?.message || 'Failed to submit parking report. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Emergency Alert
  const handleSubmitEmergency = async () => {
    if (!vehicle || !token || submittingAction) return;
    const rateCheck = checkRateLimit(`emergency_${vehicle.id}`, 15);
    if (!rateCheck.allowed) {
      alert(`Please wait ${rateCheck.remainingSeconds}s before sending another emergency request.`);
      return;
    }

    setSubmittingAction(true);
    try {
      const result = await submitEmergencyAlert({
        vehicleId: vehicle.id,
        message: emergencyMessage || 'Emergency assistance requested near your vehicle.',
        location: scannerLocation,
        token: token,
      });

      setActiveModal(null);
      setEmergencyMessage('');
      setActionSuccess(
        result.message ||
        'Emergency alert recorded in vehicle owner dashboard. Trusted contacts were NOT notified (external SMS/WhatsApp gateway is not configured). For immediate life safety, call 112 directly.'
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to record emergency alert. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Trigger Mediated Trusted Contacts Request
  const handleNotifyTrustedContacts = async () => {
    if (!vehicle || submittingAction) return;
    const rateCheck = checkRateLimit(`contacts_${vehicle.id}`, 25);
    if (!rateCheck.allowed) {
      alert(`Please wait ${rateCheck.remainingSeconds}s before submitting again.`);
      return;
    }

    setSubmittingAction(true);
    try {
      const result = await submitEmergencyAlert({
        vehicleId: vehicle.id,
        message: 'Citizen requested trusted contacts be notified regarding vehicle status.',
        location: scannerLocation,
        token: token,
      });

      setActionSuccess(
        result.message ||
        'Emergency notification recorded in vehicle dashboard. Trusted contacts were NOT notified because external SMS dispatch is not configured. For immediate emergencies, use the direct 112 call button below.'
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to record notification. Please try again.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Verifying vehicle security token...</p>
        </div>
      </div>
    );
  }

  // Error / Inactive QR State
  if (errorStatus || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 text-center space-y-4">
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
            errorStatus === 'INACTIVE_QR' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
          }`}>
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {errorStatus === 'INACTIVE_QR' ? 'QR Code Inactive' : 'Invalid Vehicle QR Code'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {errorMessage}
          </p>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-brand-600" />
              Need Immediate Roadside Help?
            </p>
            <p>
              For accidents, medical emergencies, or safety hazards in India, call National Emergency 112 directly:
            </p>
            <a
              href="tel:112"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 112 Emergency</span>
            </a>
          </div>

          <div className="pt-2">
            <Link to="/" className="text-xs text-brand-600 hover:underline font-semibold">
              Return to TRUSTFORGE Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Mobile Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 sticky top-0 z-30 shadow-subtle">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            <span className="font-extrabold text-sm tracking-tight">
              TRUST<span className="text-brand-400">FORGE</span>
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            Privacy-Protected Scanner
          </span>
        </div>
      </div>

      {/* Main Scanner Container */}
      <main className="max-w-md w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 shadow-subtle">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed flex-1">
              <strong className="block font-semibold mb-0.5">Status: Recorded</strong>
              {actionSuccess}
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Vehicle Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                Verified Vehicle
              </span>
              <h1 className="text-xl font-black text-slate-900 mt-1">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-xs text-slate-500 capitalize">
                {vehicle.category} • {vehicle.color}
              </p>
            </div>

            {/* Registration Plate Display */}
            <div className="bg-slate-900 text-white font-mono px-3 py-1.5 rounded-lg border border-slate-700 text-right shrink-0">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block -mb-0.5">
                IND
              </span>
              <span className="text-sm font-bold tracking-wider">
                {vehicle.registration_display}
              </span>
            </div>
          </div>

          {/* Real Vehicle Photograph or Neutral Placeholder */}
          {vehicle.photo_url ? (
            <div 
              onClick={() => setLightboxOpen(true)}
              className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group h-52 flex items-center justify-center"
            >
              <img
                src={vehicle.photo_url}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-contain bg-slate-900/5 group-hover:scale-[1.02] transition-transform"
              />
              <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white text-[11px] font-medium px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Tap to expand</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-center space-y-1 text-slate-400">
              <Car className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-500">Neutral Vehicle Profile</p>
              <p className="text-[10px] text-slate-400">No custom photograph uploaded by owner</p>
            </div>
          )}

          {/* Privacy Note: Display Alias & Masked Contacts */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            {vehicle.owner_display_name ? (
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Owner: <strong>{vehicle.owner_display_name}</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Registered Owner</span>
              </div>
            )}

            <div className="text-[11px] text-slate-500">
              {vehicle.trusted_contacts_count} Emergency Contact(s)
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Assistance Options
          </h2>

          {/* Action 1: Contact Vehicle Owner */}
          {vehicle.allow_contact_requests && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      Contact Vehicle Owner
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Send a message or callback request to the owner
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal('contact')}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
                >
                  Send Message
                </button>
              </div>

              {/* Direct Calling Button (ONLY if owner explicitly enabled public phone display) */}
              {vehicle.allow_public_phone_display && vehicle.owner_public_phone ? (
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={`tel:${vehicle.owner_public_phone}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-subtle"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Owner: {vehicle.owner_public_phone}</span>
                  </a>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 bg-slate-50 p-2 rounded-lg flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Owner phone number is kept private. Messages are delivered via mediated notification.</span>
                </div>
              )}
            </div>
          )}

          {/* Action 2: Report Parking Issue */}
          {vehicle.allow_parking_reports && (
            <button
              onClick={() => setActiveModal('parking')}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-subtle text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Report Parking Obstruction
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Vehicle blocking gate, another car, or driveway
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform">
                Report →
              </span>
            </button>
          )}

          {/* Action 3: Notify Trusted Contacts */}
          {vehicle.trusted_contacts_count > 0 && (
            <button
              onClick={handleNotifyTrustedContacts}
              disabled={submittingAction}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-subtle text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Record Incident for Contacts
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Log emergency status for {vehicle.trusted_contacts_count} configured contact(s) in dashboard
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-purple-600 group-hover:translate-x-0.5 transition-transform">
                Log Alert →
              </span>
            </button>
          )}

          {/* Action 4: Emergency Assistance Alert */}
          {vehicle.allow_emergency_alerts && (
            <button
              onClick={() => setActiveModal('emergency')}
              className="w-full flex items-center justify-between p-4 bg-rose-50 hover:bg-rose-100/70 rounded-xl border border-rose-200 shadow-subtle text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-rose-950 block">
                    Emergency Assistance Alert
                  </span>
                  <span className="text-[11px] text-rose-700">
                    Accident, hazard, or urgent vehicle crisis
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-rose-700 group-hover:translate-x-0.5 transition-transform">
                Alert →
              </span>
            </button>
          )}

          {/* Action 5: Call National Emergency 112 (Direct, unhindered phone dialer) */}
          <a
            href="tel:112"
            className="w-full flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-card text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shrink-0 font-black">
                <PhoneCall className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight block text-white">
                  Call National Emergency 112
                </span>
                <span className="text-[11px] text-emerald-100">
                  Direct dial to Police, Ambulance & Fire Dispatch (India)
                </span>
              </div>
            </div>
            <span className="text-xs font-extrabold text-white px-2.5 py-1 rounded-md bg-emerald-800/80">
              112
            </span>
          </a>
        </div>

        {/* Privacy Note */}
        <div className="bg-slate-100 rounded-xl p-3 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Lock className="w-3.5 h-3.5 text-brand-600" />
            <span>Zero-Exposure Privacy Guarantee</span>
          </div>
          <p>
            TRUSTFORGE protects both scanner and vehicle owner. Personal mobile numbers, emails, and home addresses are never exposed during this interaction.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        TRUSTFORGE Vehicle Assistance Network • Privacy-First Architecture
      </footer>

      {/* ======================================================================= */}
      {/* VEHICLE PHOTOGRAPH LIGHTBOX PREVIEW */}
      {/* ======================================================================= */}
      {lightboxOpen && vehicle.photo_url && (
        <div 
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
          >
            <div className="flex items-center justify-between p-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                {vehicle.brand} {vehicle.model} ({vehicle.registration_display})
              </span>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 max-h-[75vh] flex items-center justify-center overflow-auto">
              <img
                src={vehicle.photo_url}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: CONTACT VEHICLE OWNER */}
      {/* ======================================================================= */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                Contact Vehicle Owner
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reason / Category
                </label>
                <select
                  value={contactCategory}
                  onChange={e => setContactCategory(e.target.value as ContactRequestCategory)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="general">General Inquiry</option>
                  <option value="parking">Parking Inconvenience</option>
                  <option value="lights_on">Vehicle Headlights Left On</option>
                  <option value="window_open">Car Window / Sunroof Open</option>
                  <option value="other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Message for Owner
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Hi, your headlights appear to have been left on."
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Your Phone Number <span className="text-slate-400 font-normal">(Optional Callback)</span>
                </label>
                <input
                  type="tel"
                  placeholder="Leave number if you want owner to call you"
                  value={callerPhone}
                  onChange={e => setCallerPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitContact}
                disabled={submittingAction}
                className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingAction ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: REPORT PARKING ISSUE */}
      {/* ======================================================================= */}
      {activeModal === 'parking' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Report Parking Obstruction
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Obstruction Reason *
                </label>
                <select
                  value={parkingReason}
                  onChange={e => setParkingReason(e.target.value as ParkingReason)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="blocking_entrance">Vehicle blocking gate / driveway</option>
                  <option value="blocking_vehicle">Vehicle blocking another vehicle</option>
                  <option value="wrong_parking">Parked in reserved / unauthorized slot</option>
                  <option value="other">Other parking issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Short Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Parked near Gate #2, delivery van cannot enter."
                  value={parkingDescription}
                  onChange={e => setParkingDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Optional GPS Location Attachment */}
              <div className="pt-1">
                {locationConsentGranted ? (
                  <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 p-2 rounded-lg">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Location coordinates attached</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    disabled={requestingLocation}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{requestingLocation ? 'Locating...' : 'Attach incident location (GPS)'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitParking}
                disabled={submittingAction}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{submittingAction ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 3: EMERGENCY ASSISTANCE */}
      {/* ======================================================================= */}
      {activeModal === 'emergency' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Emergency Assistance Alert
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 leading-relaxed">
              <strong>Notice:</strong> This logs an urgent incident in the vehicle owner's emergency dashboard. It does <strong>not</strong> automatically dispatch police, fire, or ambulance. For life-threatening emergencies, use the direct 112 call button.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Describe Incident
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Vehicle involved in a scrape / broken window / urgent owner needed."
                  value={emergencyMessage}
                  onChange={e => setEmergencyMessage(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Optional Geolocation */}
              <div className="pt-1">
                {locationConsentGranted ? (
                  <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 p-2 rounded-lg">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Location coordinates attached</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    disabled={requestingLocation}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{requestingLocation ? 'Locating...' : 'Attach incident location'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEmergency}
                disabled={submittingAction}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{submittingAction ? 'Sending...' : 'Dispatch Alert'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
