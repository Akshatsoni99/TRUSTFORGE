import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Shield, 
  Car, 
  PhoneCall, 
  Phone,
  AlertTriangle, 
  AlertOctagon, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Lock, 
  ShieldAlert, 
  X, 
  Send, 
  Navigation,
  ZoomIn,
  MessageCircle,
  Flame,
  Ambulance,
  BadgeAlert,
  Calendar,
  Palette,
  UserCheck
} from 'lucide-react';
import { 
  getPublicVehicleByToken, 
  submitContactRequest, 
  submitParkingReport, 
  submitEmergencyAlert 
} from '../lib/storage';
import { PublicVehicleData, PublicTrustedContact } from '../types';
import { checkRateLimit, formatVehicleNumber, normalizeIndianMobile } from '../lib/utils';

export const PublicQRScanPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<PublicVehicleData | null>(null);
  const [errorStatus, setErrorStatus] = useState<'INVALID_TOKEN' | 'INACTIVE_QR' | 'NOT_FOUND' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Lightbox Preview State for Vehicle Photograph
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Feature Three: Report a Vehicle Issue Form State
  const [issueType, setIssueType] = useState<'parking' | 'blocking' | 'damage' | 'other'>('parking');
  const [issueDescription, setIssueDescription] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [scannerLocation, setScannerLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationConsentGranted, setLocationConsentGranted] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);

  // Feature Two: Direct contact notify modal state
  const [notifyingContactId, setNotifyingContactId] = useState<string | null>(null);
  const [notifiedMessage, setNotifiedMessage] = useState<string | null>(null);

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
          setErrorMessage(res.message || 'This vehicle QR code is not recognized or has been invalidated.');
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

  // Request browser location with explicit user consent
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

  // Submit Feature Three: Report a Vehicle Issue Form
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !token || submittingIssue) return;

    if (!issueDescription.trim()) {
      alert('Please enter a brief description of the issue.');
      return;
    }

    const rateCheck = checkRateLimit(`issue_${vehicle.id}`, 15);
    if (!rateCheck.allowed) {
      alert(`Please wait ${rateCheck.remainingSeconds}s before submitting another report.`);
      return;
    }

    setSubmittingIssue(true);
    try {
      // Map UI issueType to backend reason/category
      const reasonMapping: Record<string, any> = {
        parking: 'wrong_parking',
        blocking: 'blocking_entrance',
        damage: 'other',
        other: 'other',
      };

      await submitParkingReport({
        vehicleId: vehicle.id,
        reason: reasonMapping[issueType] || 'other',
        description: `[${issueType.toUpperCase()}] ${issueDescription.trim()}`,
        location: scannerLocation,
        scannerContact: reporterPhone.trim() || undefined,
        token: token,
      });

      setIssueSuccess('Your vehicle issue report has been logged in the owner’s dashboard. (UI note: No external SMS or WhatsApp was delivered for this demo).');
      setIssueDescription('');
      setReporterPhone('');
    } catch (err: any) {
      alert(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmittingIssue(false);
    }
  };

  // Dispatch emergency notification to a masked trusted contact
  const handleNotifyContact = async (contact: PublicTrustedContact) => {
    if (!vehicle || !token) return;
    setNotifyingContactId(contact.id);
    try {
      await submitEmergencyAlert({
        vehicleId: vehicle.id,
        message: `Assistance ping for trusted contact: ${contact.full_name} (${contact.relationship})`,
        token: token,
      });
      setNotifiedMessage(`Incident logged in dashboard for ${contact.full_name} (${contact.relationship}). External SMS dispatch is unconfigured for this demo.`);
    } catch (err: any) {
      alert(err?.message || 'Could not record notification.');
    } finally {
      setNotifyingContactId(null);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-800">Verifying vehicle security token...</p>
          <p className="text-xs text-slate-500">Connecting to TrustFordge Safety Network</p>
        </div>
      </div>
    );
  }

  // Error / Inactive Token Screen
  if (errorStatus || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 text-center space-y-5">
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
            errorStatus === 'INACTIVE_QR' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
          }`}>
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900">
              {errorStatus === 'INACTIVE_QR' ? 'QR Code Inactive' : 'INVALID Vehicle QR Code'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {errorMessage || 'This vehicle QR code is not recognized or has been invalidated.'}
            </p>
          </div>

          {/* Emergency fallback */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-brand-600" />
              Need Immediate Emergency Help?
            </p>
            <p>
              For accidents, road hazards, or medical emergencies in India, dial the National Emergency Helpline directly:
            </p>
            <a
              href="tel:112"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-colors shadow-subtle"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 112 National Emergency</span>
            </a>
          </div>

          <div className="pt-1">
            <Link to="/" className="text-xs text-brand-600 hover:underline font-semibold">
              Return to TrustFordge Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registered Trusted Contacts list
  const trustedContactsList = vehicle.trusted_contacts || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Mobile Bar */}
      <header className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 sticky top-0 z-30 shadow-subtle">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-black text-xs">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Trust<span className="text-brand-400">Fordge</span>
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            Zero-Leakage Pass
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto p-4 sm:p-5 space-y-5 flex-1">
        {/* Global Notifications */}
        {notifiedMessage && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start justify-between gap-2 shadow-subtle">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>{notifiedMessage}</span>
            </div>
            <button onClick={() => setNotifiedMessage(null)} className="text-purple-700 p-0.5 hover:text-purple-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECTION A — VEHICLE INFORMATION */}
        {/* ======================================================================= */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 block">
                Verified Vehicle Profile
              </span>
              <h1 className="text-lg font-black tracking-tight text-white">
                {vehicle.brand} {vehicle.model}
              </h1>
            </div>

            {/* Indian High-Security Plate Style */}
            <div className="bg-white text-slate-900 font-mono px-3 py-1.5 rounded-md border-2 border-slate-300 shadow-sm flex items-center gap-2">
              <div className="flex flex-col items-center justify-center leading-none text-[8px] font-bold text-blue-700 border-r border-slate-300 pr-1.5">
                <span>IN</span>
                <span className="text-[6px]">🇮🇳</span>
              </div>
              <span className="text-xs sm:text-sm font-black tracking-wider uppercase">
                {formatVehicleNumber(vehicle.registration_display)}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Real Vehicle Photograph or Clean Neutral Placeholder */}
            {vehicle.photo_url ? (
              <div 
                onClick={() => setLightboxOpen(true)}
                className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 cursor-pointer group h-52 flex items-center justify-center"
              >
                <img
                  src={vehicle.photo_url}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform"
                />
                <div className="absolute bottom-2 right-2 bg-slate-900/75 text-white text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
                  <ZoomIn className="w-3 h-3" />
                  <span>Tap to enlarge</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-1.5 text-slate-400">
                <Car className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">Standard Vehicle Profile</p>
                <p className="text-[10px] text-slate-400">No custom photograph uploaded by owner</p>
              </div>
            )}

            {/* Vehicle Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Owner</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">{vehicle.owner_display_name || 'Verified Owner'}</span>
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Make & Model</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {vehicle.brand} {vehicle.model}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Model Year</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{vehicle.model_year || 'Current'}</span>
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Colour</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5 capitalize">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span>{vehicle.color || 'Unspecified'}</span>
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                <span className="font-bold text-slate-800 capitalize mt-0.5 block">
                  {vehicle.category}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                  {vehicle.registration_display}
                </span>
              </div>
            </div>

            {/* Owner Contact Number (Privacy Gated) */}
            <div className="pt-2 border-t border-slate-100">
              {vehicle.allow_public_phone_display && vehicle.owner_public_phone ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      Owner Contact Number (Publicly Shared)
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-950">
                      {vehicle.owner_public_phone}
                    </span>
                  </div>
                  <a
                    href={`tel:${normalizeIndianMobile(vehicle.owner_public_phone)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-subtle shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Owner</span>
                  </a>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Owner contact number is kept private under TrustFordge privacy shield.</span>
                </div>
              )}
            </div>

            {/* Owner Address (Strictly Private by Default — Opt-in Only) */}
            {vehicle.allow_public_address_display && vehicle.owner_public_address ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Owner Address (Publicly Shared by Owner)
                  </span>
                  <span className="text-xs text-slate-800 font-medium">
                    {vehicle.owner_public_address}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 px-1">
                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Owner residential address is kept strictly private by default.</span>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================================= */}
        {/* SECTION B — FEATURE TWO: CONTACT TRUSTED FAMILY MEMBERS */}
        {/* ======================================================================= */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  Contact Trusted Family Members
                </h2>
                <p className="text-[11px] text-slate-500">
                  Verified emergency contacts configured by the vehicle owner
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {trustedContactsList.length}
            </span>
          </div>

          {trustedContactsList.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-1">
              <Users className="w-6 h-6 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">No Trusted Contacts Registered</p>
              <p className="text-[11px] text-slate-400">The owner has not attached family emergency contacts yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trustedContactsList.map((contact, idx) => {
                const hasPhone = Boolean(contact.phone);
                const cleanPhone = contact.phone ? contact.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91|^91|^0/, '') : '';

                return (
                  <div
                    key={contact.id || idx}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {contact.full_name}
                        </span>
                        <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                          {contact.relationship}
                        </span>
                        {contact.is_primary && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {hasPhone ? (
                          <span className="font-mono text-slate-700 font-semibold">{contact.phone}</span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Direct number hidden by privacy shield
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action button: Green WhatsApp/Phone call button if phone is public, or mediated alert dispatch */}
                    {hasPhone ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://wa.me/91${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-subtle"
                          title="WhatsApp Message"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${normalizeIndianMobile(contact.phone)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-subtle"
                          title="Call Phone"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Call</span>
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleNotifyContact(contact)}
                        disabled={notifyingContactId === contact.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors shadow-subtle shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{notifyingContactId === contact.id ? 'Logging...' : 'Notify Contact'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ======================================================================= */}
        {/* SECTION C — FEATURE THREE: REPORT A VEHICLE ISSUE */}
        {/* ======================================================================= */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Report a Vehicle Issue
              </h2>
              <p className="text-[11px] text-slate-500">
                Describe parking obstructions, blockages, or minor vehicle issues to the owner
              </p>
            </div>
          </div>

          {/* Form success banner */}
          {issueSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start justify-between gap-2 shadow-subtle">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{issueSuccess}</span>
              </div>
              <button onClick={() => setIssueSuccess(null)} className="text-emerald-700 p-0.5 hover:text-emerald-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmitIssue} className="space-y-3.5">
            {/* Issue Category Radio Chips */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                Issue Category *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'parking', label: 'Parking Issue' },
                  { key: 'blocking', label: 'Vehicle Blocking Access' },
                  { key: 'damage', label: 'Vehicle Damage' },
                  { key: 'other', label: 'Other Issue' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setIssueType(item.key as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all border ${
                      issueType === item.key
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description / Message */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Description / Message *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Your vehicle is blocking the society driveway / gate entrance. Please adjust when possible."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            {/* Optional Callback Phone */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Your Contact Number <span className="text-slate-400 font-normal">(Optional Callback)</span>
              </label>
              <input
                type="tel"
                placeholder="Leave phone number if you wish the owner to call you"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            {/* GPS Location Attachment */}
            <div className="flex items-center justify-between pt-1">
              {locationConsentGranted ? (
                <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>GPS location attached ({scannerLocation?.latitude}, {scannerLocation?.longitude})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  disabled={requestingLocation}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{requestingLocation ? 'Fetching GPS...' : 'Attach current location'}</span>
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submittingIssue}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-subtle"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingIssue ? 'Submitting Report...' : 'Submit Issue Report'}</span>
            </button>
          </form>
        </section>

        {/* ======================================================================= */}
        {/* SECTION D — FEATURE FOUR: EMERGENCY ASSISTANCE */}
        {/* ======================================================================= */}
        <section className="bg-white rounded-2xl border border-rose-200 shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-rose-100">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-rose-950 tracking-tight">
                Emergency Assistance
              </h2>
              <p className="text-[11px] text-rose-700">
                Critical life-safety & national emergency hotlines (India)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Emergency Helpline — 112 */}
            <a
              href="tel:112"
              className="p-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <PhoneCall className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black text-rose-800 font-mono">112</span>
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold text-slate-900 block group-hover:text-rose-900">
                  Emergency Helpline
                </span>
                <span className="text-[10px] text-slate-500">Universal Help (India)</span>
              </div>
            </a>

            {/* 2. Ambulance — 108 */}
            <a
              href="tel:108"
              className="p-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Ambulance className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black text-emerald-800 font-mono">108</span>
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-900">
                  Ambulance
                </span>
                <span className="text-[10px] text-slate-500">Medical Emergency</span>
              </div>
            </a>

            {/* 3. Fire Brigade — 101 */}
            <a
              href="tel:101"
              className="p-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black text-orange-800 font-mono">101</span>
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold text-slate-900 block group-hover:text-orange-900">
                  Fire Brigade
                </span>
                <span className="text-[10px] text-slate-500">Fire & Rescue</span>
              </div>
            </a>

            {/* 4. Police / Emergency — 112 */}
            <a
              href="tel:112"
              className="p-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <BadgeAlert className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black text-blue-800 font-mono">112</span>
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-900">
                  Police / Emergency
                </span>
                <span className="text-[10px] text-slate-500">Law Enforcement</span>
              </div>
            </a>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500">
            For critical road collisions, serious injuries, or criminal activity, dial 112 directly. TrustFordge facilitates mediated owner notification and does not replace emergency dispatch services.
          </div>
        </section>

        {/* Zero-Leakage Privacy Banner */}
        <div className="bg-slate-900 text-white rounded-xl p-4 text-xs space-y-1 shadow-subtle">
          <div className="flex items-center gap-1.5 font-bold text-brand-400">
            <Lock className="w-3.5 h-3.5" />
            <span>TrustFordge Zero-Leakage Guarantee</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Your personal identity is safe. Neither the scanner nor the vehicle owner’s private mobile numbers or home addresses are harvested or exposed during this interaction.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        TrustFordge Vehicle Assistance Network • Privacy-First Architecture
      </footer>

      {/* Photo Lightbox Preview */}
      {lightboxOpen && vehicle.photo_url && (
        <div 
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
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
    </div>
  );
};
