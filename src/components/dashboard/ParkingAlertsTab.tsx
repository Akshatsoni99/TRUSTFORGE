import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Check, 
  Filter,
  CheckCheck,
  Ban
} from 'lucide-react';
import { ParkingReport, ReportStatus } from '../../types';
import { formatDateTime, formatRelativeTime } from '../../lib/utils';
import { updateParkingReportStatus } from '../../lib/storage';

interface ParkingAlertsTabProps {
  reports: ParkingReport[];
  onReportsUpdated: () => void;
}

export const ParkingAlertsTab: React.FC<ParkingAlertsTabProps> = ({
  reports,
  onReportsUpdated,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const filteredReports = reports.filter(r => {
    if (filter === 'pending') return r.status === 'pending' || r.status === 'acknowledged';
    if (filter === 'resolved') return r.status === 'resolved' || r.status === 'dismissed';
    return true;
  });

  const handleStatusChange = (reportId: string, status: ReportStatus) => {
    updateParkingReportStatus(reportId, status);
    onReportsUpdated();
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'blocking_entrance': return 'Blocking Entrance / Gate';
      case 'wrong_parking': return 'Wrong / Unauthorized Parking';
      case 'blocking_vehicle': return 'Blocking Another Vehicle';
      default: return 'Other Parking Issue';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Parking Obstruction Reports</h2>
          <p className="text-xs text-slate-500">
            Real-time reports submitted by passersby or guards who scanned your vehicle QR.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
          {(['all', 'pending', 'resolved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                filter === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Parking Reports</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filter === 'all'
              ? 'Your vehicle has zero parking obstruction reports. Clean record!'
              : `No ${filter} parking reports found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div
              key={report.id}
              className={`bg-white rounded-xl border p-5 shadow-subtle space-y-4 transition-all ${
                report.status === 'pending'
                  ? 'border-amber-300 ring-1 ring-amber-200/50'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      report.status === 'pending'
                        ? 'bg-amber-500 animate-pulse'
                        : report.status === 'acknowledged'
                        ? 'bg-brand-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <h3 className="text-sm font-bold text-slate-900">
                    {getReasonLabel(report.reason)}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      report.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : report.status === 'acknowledged'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {report.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {formatRelativeTime(report.created_at)}
                  </span>
                </div>
              </div>

              {report.description && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed border border-slate-100">
                  "{report.description}"
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  {report.scanner_location && (
                    <span className="flex items-center gap-1 text-slate-600 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      <span>
                        GPS: {report.scanner_location.latitude}, {report.scanner_location.longitude}
                      </span>
                    </span>
                  )}

                  {report.scanner_contact_opt && (
                    <span className="flex items-center gap-1 text-slate-600 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Callback: {report.scanner_contact_opt}</span>
                    </span>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  {report.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(report.id, 'acknowledged')}
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusChange(report.id, 'resolved')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark Resolved / Moved Vehicle</span>
                    </button>
                  )}

                  {report.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(report.id, 'dismissed')}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Dismiss false report"
                    >
                      <Ban className="w-3.5 h-3.5" />
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

