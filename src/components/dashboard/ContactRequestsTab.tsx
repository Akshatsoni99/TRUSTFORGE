import React from 'react';
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Phone, 
  CheckCheck, 
  MapPin,
  Tag
} from 'lucide-react';
import { ContactRequest } from '../../types';
import { formatDateTime, formatRelativeTime } from '../../lib/utils';
import { updateContactRequestStatus } from '../../lib/storage';

interface ContactRequestsTabProps {
  requests: ContactRequest[];
  onRequestsUpdated: () => void;
}

export const ContactRequestsTab: React.FC<ContactRequestsTabProps> = ({
  requests,
  onRequestsUpdated,
}) => {
  const handleStatusChange = (requestId: string, status: 'acknowledged' | 'resolved') => {
    updateContactRequestStatus(requestId, status);
    onRequestsUpdated();
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'parking': return 'Parking Inconvenience';
      case 'lights_on': return 'Headlights Left On';
      case 'window_open': return 'Window / Sunroof Open';
      case 'general': return 'General Inquiry';
      default: return 'Contact Request';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Owner Contact Requests</h2>
          <p className="text-xs text-slate-500">
            Messages and callback requests submitted by citizens who scanned your vehicle QR.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Contact Requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Zero messages received from scanners. All is quiet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div
              key={req.id}
              className={`bg-white rounded-xl border p-5 shadow-subtle space-y-3.5 transition-all ${
                req.status === 'pending'
                  ? 'border-brand-300 ring-1 ring-brand-200/50'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    req.status === 'pending' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {getCategoryLabel(req.category)}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {req.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : req.status === 'acknowledged'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {req.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {formatRelativeTime(req.created_at)}
                  </span>
                </div>
              </div>

              {req.message && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed border border-slate-100">
                  "{req.message}"
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  {req.caller_phone && (
                    <a
                      href={`tel:${req.caller_phone}`}
                      className="inline-flex items-center gap-1.5 text-brand-600 font-semibold hover:underline font-mono"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Callback: {req.caller_phone}</span>
                    </a>
                  )}

                  <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(req.created_at)}</span>
                  </span>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  {req.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(req.id, 'acknowledged')}
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {req.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusChange(req.id, 'resolved')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

