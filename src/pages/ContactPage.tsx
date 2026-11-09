import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle,
  PhoneCall 
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      alert('Please fill out all required fields.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <div className="space-y-3 text-center sm:text-left">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
          Support & Assistance
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Contact TrustFordge
        </h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-xl">
          Have questions about QR passes, fleet integration, or need help managing your account? Reach out to our technical team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Contact Form */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-5">
          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Message Dispatched</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thank you for reaching out. A TrustFordge support engineer will follow up at <strong>{email}</strong> within 1 business day.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Send an Inquiry</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Patel"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ananya@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Inquiry Topic
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="General Inquiry">General Platform Inquiry</option>
                  <option value="QR Pass Technical Help">QR Pass Technical Help</option>
                  <option value="Apartment Society / Fleet Setup">Apartment Society / Fleet Integration</option>
                  <option value="Privacy Concern">Privacy & Security Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we assist you?"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>

        {/* Contact Info Card */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-5">
            <h3 className="text-base font-bold text-white">Platform Headquarters</h3>
            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>TrustFordge Mobility Technologies, Tech Park Hub, Bengaluru, Karnataka, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>support@trustfordge.network</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Emergency Contact Hotline
              </span>
              <p className="text-xs text-slate-300">
                For immediate life-threatening roadside assistance in India:
              </p>
              <a
                href="tel:112"
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-subtle"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Dial 112 Directly</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

