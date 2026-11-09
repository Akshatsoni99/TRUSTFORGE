import React from 'react';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  CheckCheck, 
  PhoneCall, 
  ShieldAlert 
} from 'lucide-react';
import { EmergencyAlert, EmergencyStatus } from '../../types';
import { formatDateTime, formatRelativeTime } from '../../lib/utils';
import { updateEmergencyAlertStatus } from '../../lib/storage';

interface EmergencyAlertsTabProps {
  alerts: EmergencyAlert[];
  onAlertsUpdated: () => void;
}

export const EmergencyAlertsTab: React.FC<EmergencyAlertsTabProps> = ({
  alerts,
  onAlertsUpdated,
}) => {
  const handleStatusChange = (alertId: string, status: EmergencyStatus) => {
    updateEmergencyAlertStatus(alertId, status);
    onAlertsUpdated();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Emergency Assistance Alerts</h2>
          <p className="text-xs text-slate-500">
            Urgent safety alerts triggered via your vehicle QR code.
          </p>
        </div>

        <a
          href="tel:112"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-subtle shrink-0"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call 112 Emergency</span>
        </a>
      </div>

      <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-1">
        <div className="flex items-center gap-2 text-rose-400 font-semibold">
          <ShieldAlert className="w-4 h-4" />
          <span>Protocol Notice</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          TRUSTFORGE alerts you and your designated emergency contacts immediately. In case of serious physical injury, collision, or criminal hazard, always confirm that local authorities (112) have been dispatched.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Emergency Alerts</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Zero emergency alerts logged. Your vehicle network is secure and all is clear.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl border p-5 shadow-subtle space-y-4 transition-all ${
                alert.status === 'active'
                  ? 'border-rose-400 ring-2 ring-rose-200/50'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    alert.status === 'active' ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
                  }`}>
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Emergency Assistance Triggered
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Dispatched to {alert.contacts_notified_count} trusted emergency contact(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      alert.status === 'active'
                        ? 'bg-rose-100 text-rose-800'
                        : alert.status === 'acknowledged'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {alert.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {formatRelativeTime(alert.created_at)}
                  </span>
                </div>
              </div>

              {alert.message && (
                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg text-xs text-rose-950 font-medium leading-relaxed">
                  "{alert.message}"
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  {alert.scanner_location && (
                    <span className="flex items-center gap-1 font-mono text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>GPS: {alert.scanner_location.latitude}, {alert.scanner_location.longitude}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Logged at {formatDateTime(alert.created_at)}</span>
                  </span>
                </div>

                {/* Status Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(alert.id, 'acknowledged')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusChange(alert.id, 'resolved')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark Emergency Resolved</span>
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

