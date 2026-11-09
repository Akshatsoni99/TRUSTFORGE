import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, PhoneCall, Heart, Lock, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 no-print">
      {/* 112 Advisory Banner */}
      <div className="bg-slate-950 py-3 px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Emergency Helpline Advisory:</strong> For immediate life-threatening emergencies, road accidents, or medical crises in India, always dial <strong>112</strong> directly.
            </span>
          </div>
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600/20 text-rose-300 border border-rose-500/40 rounded-full font-semibold hover:bg-rose-600/30 transition-colors"
          >
            <PhoneCall className="w-3 h-3 text-rose-400" />
            <span>Call 112 Emergency</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Trust<span className="text-brand-400">Fordge</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              "One Scan. The Right Help. At The Right Time."
            </p>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              TrustFordge helps citizens reach vehicle owners responsibly when vehicles obstruct access, parking creates inconvenience, or someone nearby needs emergency assistance — without ever exposing private contact numbers.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-brand-400" />
              <span>Zero-Exposure Masked Architecture</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register Vehicle
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Platform
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Compliance */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">
              Privacy & Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Privacy Charter
                </Link>
              </li>
              <li>
                <span className="text-slate-400">DPDP Act (India) Compliant Architecture</span>
              </li>
              <li>
                <span className="text-slate-400">PostgreSQL Row-Level Security</span>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Support & Assistance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© {new Date().getFullYear()} TrustFordge Mobility Safety Network. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built for vehicle safety, privacy, and community harmony in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

