import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  ArrowRight, 
  Check, 
  Lock, 
  PhoneCall, 
  AlertTriangle, 
  Users, 
  EyeOff, 
  Smartphone,
  ShieldCheck
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* ======================================================================= */}
      {/* HERO SECTION */}
      {/* ======================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-subtle mx-auto">
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span>Privacy-First Vehicle Communication Network</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Your Vehicle. <br />
              Your Privacy. <br />
              <span className="text-brand-600">Your Connection.</span>
            </h1>
            <p className="text-lg sm:text-xl font-bold text-slate-800 pt-2">
              "One Scan. The Right Help. At The Right Time."
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Making vehicle communication simpler, safer, and more accessible through intelligent QR-based assistance. Reach vehicle owners responsibly when parking creates obstruction or when someone needs emergency assistance — without exposing personal telephone numbers or home addresses.
          </p>

          {/* EXACTLY ONE PRIMARY ACTION BUTTON */}
          <div className="pt-2 flex justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-card hover:shadow-elevated transition-all"
            >
              <span>GET STARTED — CREATE YOUR QR</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Core Guarantees */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 border-t border-slate-200/80 max-w-2xl mx-auto">
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              No App Required for Scanners
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              100% Masked Phone Numbers
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              Instant 112 Helpline Access
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================================= */}
      {/* MISSION STATEMENT SECTION */}
      {/* ======================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-elevated relative overflow-hidden text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
            Our Core Mission
          </span>
          <blockquote className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-relaxed">
            "To create a connected vehicle assistance network where people can reach vehicle owners responsibly, protect personal information and make emergency communication easier."
          </blockquote>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed pt-2">
            Leaving handwritten phone slips on dashboards exposes families to spam, telemarketing, and harassment. TrustFordge replaces paper slips with secure mediated digital communication.
          </p>
        </div>
      </section>

      {/* ======================================================================= */}
      {/* HOW IT WORKS (THREE STEPS) */}
      {/* ======================================================================= */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How TrustFordge Works
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Register your vehicle, print your secure decal, and receive assistance alerts in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 font-extrabold text-lg flex items-center justify-center shadow-subtle">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Register Your Vehicle
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your vehicle details (car, bike, or scooter) and designate your trusted emergency contacts. Your personal telephone number and home address remain completely confidential.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 font-extrabold text-lg flex items-center justify-center shadow-subtle">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Generate & Display QR
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instantly receive a cryptographic, unguessable public QR code. Download high-resolution PNG or print the official windshield pass to place on your vehicle glass.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 font-extrabold text-lg flex items-center justify-center shadow-subtle">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Receive Assistance Alerts
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anyone scanning your QR from their smartphone camera can alert you of parking blocks, unattended lights, or medical emergencies without seeing your phone number.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================================= */}
      {/* SECURITY & PRIVACY PILLARS */}
      {/* ======================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Privacy First Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Built for Privacy and Real-World Mobility
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Zero PII Leakage</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Personal telephone numbers, emails, and residential addresses are never encoded inside the QR matrix.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Parking Obstruction Alerts</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Passersby and security guards can report blocked gates or vehicles, resolving blockages peacefully.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Trusted Emergency Contacts</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              In case of a road emergency, scanner requests are forwarded to your designated emergency contacts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Direct 112 Safety Net</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              One-touch direct calling to India's national emergency number 112 is always directly accessible.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================================= */}
      {/* BOTTOM CTA */}
      {/* ======================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100 rounded-3xl p-8 sm:p-12 border border-slate-200 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Ready to protect your vehicle?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Create your account, register your vehicle, and generate your printable QR decal.
            </p>
          </div>

          <div className="flex justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-card transition-all"
            >
              <span>GET STARTED — CREATE YOUR QR</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
