import React, { useState } from 'react';
import { 
  Eye, 
  MessageSquare, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Filter 
} from 'lucide-react';
import { ActivityEvent, ActivityEventType } from '../../types';
import { formatDateTime, formatRelativeTime } from '../../lib/utils';

interface ActivityHistoryTabProps {
  events: ActivityEvent[];
}

export const ActivityHistoryTab: React.FC<ActivityHistoryTabProps> = ({ events }) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    return e.event_type === filter;
  });

  const getEventBadge = (type: ActivityEventType) => {
    switch (type) {
      case 'qr_scan':
        return { label: 'QR Scan', icon: Eye, color: 'text-brand-600 bg-brand-50' };
      case 'contact_request':
        return { label: 'Contact Request', icon: MessageSquare, color: 'text-purple-600 bg-purple-50' };
      case 'parking_report':
        return { label: 'Parking Report', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' };
      case 'emergency_alert':
        return { label: 'Emergency Alert', icon: AlertOctagon, color: 'text-rose-600 bg-rose-50' };
      case 'qr_token_regenerated':
        return { label: 'Token Regenerated', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' };
      case 'qr_status_changed':
        return { label: 'QR Status Toggled', icon: ShieldCheck, color: 'text-slate-600 bg-slate-100' };
      default:
        return { label: type, icon: Clock, color: 'text-slate-600 bg-slate-100' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Activity History & Audit Trail</h2>
          <p className="text-xs text-slate-500">
            Immutable log of all interactions and physical scans recorded for your vehicle.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Events ({events.length})</option>
            <option value="qr_scan">QR Scans</option>
            <option value="contact_request">Contact Requests</option>
            <option value="parking_report">Parking Reports</option>
            <option value="emergency_alert">Emergency Alerts</option>
            <option value="qr_token_regenerated">Token Rotations</option>
          </select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Events Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filter === 'all'
              ? 'No activity recorded yet for your vehicle.'
              : `No events matching "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden divide-y divide-slate-100">
          {filteredEvents.map(event => {
            const badge = getEventBadge(event.event_type);
            const Icon = badge.icon;

            return (
              <div key={event.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${badge.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ID: {event.id.slice(0, 10)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {event.details?.message || 
                       (event.details?.reason ? `Parking obstruction reason: ${event.details.reason}` : '') ||
                       (event.details?.note ? event.details.note : '') ||
                       'Direct scan from mobile camera via TRUSTFORGE gateway.'}
                    </p>

                    {event.scanner_location && (
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 pt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Coords: {event.scanner_location.latitude}, {event.scanner_location.longitude}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-medium text-slate-700 block">
                    {formatRelativeTime(event.created_at)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDateTime(event.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

