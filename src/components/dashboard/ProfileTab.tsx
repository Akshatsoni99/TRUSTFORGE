import React, { useState } from 'react';
import { 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { Profile } from '../../types';
import { updateProfile } from '../../lib/storage';

interface ProfileTabProps {
  profile: Profile | null;
  onProfileUpdated: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onProfileUpdated,
}) => {
  if (!profile) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
        Profile data not loaded.
      </div>
    );
  }

  const [fullName, setFullName] = useState(profile.full_name);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.residential_address || '');
  const [dob, setDob] = useState(profile.date_of_birth || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaving(true);
    updateProfile(profile.id, {
      full_name: fullName,
      email,
      residential_address: address,
      date_of_birth: dob,
    });
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onProfileUpdated();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Personal Profile</h2>
        <p className="text-xs text-slate-500">
          Your private account credentials. Kept secure and strictly masked from all public interactions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 space-y-5">
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile successfully updated.</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Registered Mobile Number
                </label>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  profile.phone_verified 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-slate-500 bg-slate-100'
                }`}>
                  {profile.phone_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={profile.phone}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-mono select-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Residential City / Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Never visible to anyone scanning your vehicle QR code.</span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

