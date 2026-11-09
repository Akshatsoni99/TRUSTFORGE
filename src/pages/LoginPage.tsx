import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { validateIndianMobile } from '../lib/utils';
import { setCurrentOwnerId } from '../lib/storage';
import { isSupabaseConfigured } from '../lib/supabase';
import { signInOwnerWithSupabase } from '../lib/supabaseService';
import { Profile } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setError('Please enter your registered mobile number or email.');
      return;
    }

    if (!cleanInput.includes('@') && !validateIndianMobile(cleanInput)) {
      setError('Please enter a valid 10-digit Indian mobile number or email.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. If Supabase is configured, authenticate with Supabase Auth
      if (isSupabaseConfigured) {
        const { user, error: authError } = await signInOwnerWithSupabase({
          identifier: cleanInput,
          password: password || undefined,
        });

        if (user) {
          setCurrentOwnerId(user.id);
          navigate('/dashboard');
          return;
        }

        if (authError) {
          console.warn('Supabase auth failed; checking local cache fallback:', authError);
        }
      }

      // 2. Local fallback check
      const rawProfiles = localStorage.getItem('tf_db_profiles');
      const profiles: Profile[] = rawProfiles ? JSON.parse(rawProfiles) : [];
      const cleanPhone = cleanInput.replace(/[\s\-\(\)]/g, '').replace(/^\+91|^91|^0/, '');

      const found = profiles.find(p => {
        const pClean = p.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91|^91|^0/, '');
        return pClean === cleanPhone || (p.email && p.email.toLowerCase() === cleanInput.toLowerCase());
      });

      if (found) {
        setCurrentOwnerId(found.id);
        navigate('/dashboard');
      } else {
        setError('No registered vehicle owner found with these credentials. Please check your details or create a new account.');
      }
    } catch {
      setError('An error occurred during sign-in. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
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
              Registered Mobile Number or Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="9876543210 or owner@example.com"
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  setError(null);
                }}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full text-sm pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-subtle transition-colors flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Access Owner Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
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
