import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Lock } from 'lucide-react';
import { validateIndianMobile } from '../lib/utils';
import { setCurrentOwnerId } from '../lib/storage';
import { Profile } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !validateIndianMobile(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      const rawProfiles = localStorage.getItem('tf_db_profiles');
      const profiles: Profile[] = rawProfiles ? JSON.parse(rawProfiles) : [];
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91|^91|^0/, '');

      const found = profiles.find(p => {
        const pClean = p.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91|^91|^0/, '');
        return pClean === cleanPhone;
      });

      if (found) {
        setCurrentOwnerId(found.id);
        navigate('/dashboard');
      } else {
        setError('No registered vehicle owner found with this mobile number. Please create your account first.');
      }
    } catch {
      setError('An error occurred during sign-in. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-card">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-brand-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Vehicle Owner Portal
          </h2>
          <p className="text-xs text-slate-500">
            Sign in to inspect QR scans, manage trusted contacts, and review assistance alerts.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Registered Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                required
                placeholder="9876543210"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                className="w-full text-sm pl-12 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-subtle transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Access Owner Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">
            New vehicle owner?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Register Vehicle & Create QR
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
