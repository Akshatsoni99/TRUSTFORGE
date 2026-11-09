import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Heart, 
  EyeOff, 
  PhoneCall, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      {/* Title */}
      <div className="space-y-3 text-center sm:text-left">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
          About The Platform
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Privacy-First Vehicle Communication
        </h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
          TrustFordge was built to eliminate the safety risks of displaying personal phone numbers on vehicles while ensuring owners can be reached during parking obstructions or critical emergencies.
        </p>
      </div>

      {/* The Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            The Danger of Paper Phone Slips
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            Many drivers leave handwritten notes or business cards on their dashboards. In dense cities, these numbers are frequently harvested for telemarketing spam, WhatsApp harassment, or stalking — especially affecting women and families.
          </p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            The TrustFordge Solution
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            A single tamper-resistant QR code backed by mediated server architecture. Scanners interact with an intuitive web application to report parking blocks or trigger emergency alerts, while all personal contact data remains 100% hidden.
          </p>
        </div>
      </div>

      {/* DPDP Act Privacy Charter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-brand-600" />
          <h3 className="text-lg font-bold text-slate-900">
            Privacy Charter & DPDP Act Alignment
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
          <div className="space-y-1.5">
            <strong className="text-slate-900 font-semibold block">1. Cryptographic Isolation</strong>
            <p className="leading-relaxed">
              Public QR codes use cryptographically random 128-bit tokens. It is mathematically impossible to reverse-engineer an owner's identity from the public URL.
            </p>
          </div>

          <div className="space-y-1.5">
            <strong className="text-slate-900 font-semibold block">2. Row Level Security (RLS)</strong>
            <p className="leading-relaxed">
              Every profile and contact record is protected with PostgreSQL policies. Unauthorized clients cannot query foreign private data even with direct database connections.
            </p>
          </div>

          <div className="space-y-1.5">
            <strong className="text-slate-900 font-semibold block">3. Consent-Based Geolocation</strong>
            <p className="leading-relaxed">
              Scanner location is never silently harvested. The browser explicitly prompts the scanner, and coordinates are used solely to clarify incident reports.
            </p>
          </div>

          <div className="space-y-1.5">
            <strong className="text-slate-900 font-semibold block">4. Direct 112 Safety Net</strong>
            <p className="leading-relaxed">
              We never restrict or intermediate emergency calling. Dialing 112 is always a single tap away without captcha or rate limiting.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-lg font-bold text-white">Ready to protect your vehicle?</h4>
          <p className="text-xs text-slate-400 mt-1">Generate your official QR windshield pass now.</p>
        </div>
        <Link
          to="/register"
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-subtle"
        >
          Create Your QR Pass
        </Link>
      </div>
    </div>
  );
};

