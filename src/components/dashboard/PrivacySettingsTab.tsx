import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Database, 
  Check, 
  PhoneCall 
} from 'lucide-react';
import { Vehicle } from '../../types';
import { updateVehicle } from '../../lib/storage';

interface PrivacySettingsTabProps {
  vehicles: Vehicle[];
  onVehicleUpdated: () => void;
}

export const PrivacySettingsTab: React.FC<PrivacySettingsTabProps> = ({
  vehicles,
  onVehicleUpdated,
}) => {
  const primaryVehicle = vehicles[0];
  const [savedMessage, setSavedMessage] = useState(false);

  if (!primaryVehicle) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
        No vehicles registered yet to configure privacy settings.
      </div>
    );
  }

  const handleToggle = (key: keyof Vehicle, currentVal: boolean) => {
    updateVehicle(primaryVehicle.id, { [key]: !currentVal });
    onVehicleUpdated();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Privacy & Public Exposure Controls</h2>
        <p className="text-xs text-slate-500">
          Fine-tune what information is visible to strangers scanning your vehicle QR decal.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Privacy preferences updated successfully.</span>
        </div>
      )}

      {/* Feature Toggles */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle divide-y divide-slate-100">
        {/* Mask Registration Number */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block">
              Mask Vehicle Number Plate on Public QR Page
            </span>
            <p className="text-xs text-slate-500 max-w-lg">
              When enabled, your plate is displayed with obfuscated middle characters (e.g., DL 01 •• 1234) on the public scan screen.
            </p>
          </div>
          <button
            onClick={() => handleToggle('mask_registration_number', primaryVehicle.mask_registration_number)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              primaryVehicle.mask_registration_number ? 'bg-brand-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                primaryVehicle.mask_registration_number ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Allow Direct Public Phone Display */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block">
              Allow Direct Phone Calling on Public QR Page
            </span>
            <p className="text-xs text-slate-500 max-w-lg">
              (Disabled by default for privacy). If enabled, a green call button showing your registered mobile number will appear on the scanner page. If disabled, all communications are strictly mediated without exposing your phone number.
            </p>
          </div>
          <button
            onClick={() => handleToggle('allow_public_phone_display', primaryVehicle.allow_public_phone_display)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              primaryVehicle.allow_public_phone_display ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                primaryVehicle.allow_public_phone_display ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Allow Direct Contact Requests */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block">
              Allow Contact Requests
            </span>
            <p className="text-xs text-slate-500 max-w-lg">
              Permits individuals near your vehicle to submit a mediated contact request.
            </p>
          </div>
          <button
            onClick={() => handleToggle('allow_contact_requests', primaryVehicle.allow_contact_requests)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              primaryVehicle.allow_contact_requests ? 'bg-brand-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                primaryVehicle.allow_contact_requests ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Allow Parking Reports */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block">
              Allow Parking Obstruction Reports
            </span>
            <p className="text-xs text-slate-500 max-w-lg">
              Enables security guards and residents to notify you if your car is blocking a gate or driveway.
            </p>
          </div>
          <button
            onClick={() => handleToggle('allow_parking_reports', primaryVehicle.allow_parking_reports)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              primaryVehicle.allow_parking_reports ? 'bg-brand-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                primaryVehicle.allow_parking_reports ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Allow Emergency Alerts */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block">
              Allow Emergency Assistance Alerts
            </span>
            <p className="text-xs text-slate-500 max-w-lg">
              Permits scanners to send urgent alerts to you and your designated emergency contacts.
            </p>
          </div>
          <button
            onClick={() => handleToggle('allow_emergency_alerts', primaryVehicle.allow_emergency_alerts)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              primaryVehicle.allow_emergency_alerts ? 'bg-brand-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                primaryVehicle.allow_emergency_alerts ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {/* Allow Public Address Display */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block">
              Allow Public Address Sharing on QR Scanner Page
            </span>
            <p className="text-xs text-slate-500 max-w-lg">
              (Private by default). If enabled, your residential address will be shown to people scanning your QR code. If disabled, your address is strictly withheld.
            </p>
          </div>
          <button
            onClick={() => handleToggle('allow_public_address_display', Boolean(primaryVehicle.allow_public_address_display))}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              primaryVehicle.allow_public_address_display ? 'bg-amber-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                primaryVehicle.allow_public_address_display ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Allow Trusted Contacts Display */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block">
              Allow Contacting Trusted Family Members
            </span>
            <p className="text-xs text-slate-500 max-w-lg">
              Permits individuals scanning the QR code to see verified emergency contacts and call them if needed.
            </p>
          </div>
          <button
            onClick={() => handleToggle('allow_trusted_contacts_display', primaryVehicle.allow_trusted_contacts_display ?? true)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              (primaryVehicle.allow_trusted_contacts_display ?? true) ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                (primaryVehicle.allow_trusted_contacts_display ?? true) ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Security Architecture Statement */}
      <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-brand-400">
          <Database className="w-4 h-4" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            Row Level Security (RLS) Protection
          </h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          TrustFordge enforces database-level Row Level Security in Supabase PostgreSQL. Your residential address, private email, personal phone, and trusted contacts are completely inaccessible without your cryptographic session credentials.
        </p>
      </div>
    </div>
  );
};
