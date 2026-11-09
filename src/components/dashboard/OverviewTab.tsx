import React from 'react';
import { 
  Eye, 
  MessageSquare, 
  AlertTriangle, 
  AlertOctagon, 
  Car, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Vehicle, ActivityEvent, ParkingReport, EmergencyAlert } from '../../types';
import { formatRelativeTime, formatDateTime } from '../../lib/utils';
import { DashboardTab } from './Sidebar';

interface OverviewTabProps {
  stats: {
    totalScans: number;
    contactRequests: number;
    parkingReports: number;
    emergencyAlerts: number;
    registeredVehiclesCount: number;
    activeQRCodesCount: number;
  };
  vehicles: Vehicle[];
  recentEvents: ActivityEvent[];
  pendingParking: ParkingReport[];
  activeEmergencies: EmergencyAlert[];
  onNavigateTab: (tab: DashboardTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  vehicles,
  recentEvents,
  pendingParking,
  activeEmergencies,
  onNavigateTab,
}) => {
  const primaryVehicle = vehicles[0];

  // Only calculate chart data if real events actually exist
  const hasRealActivity = stats.totalScans > 0 || stats.parkingReports > 0 || stats.emergencyAlerts > 0 || stats.contactRequests > 0;

  // Real aggregate days from actual recentEvents if any
  const chartData = hasRealActivity ? [
    { label: 'Scans', count: stats.totalScans },
    { label: 'Contacts', count: stats.contactRequests },
    { label: 'Parking', count: stats.parkingReports },
    { label: 'Emergency', count: stats.emergencyAlerts },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Active Emergencies Banner if any exist */}
      {activeEmergencies.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                {activeEmergencies.length} Active Emergency Alert Requiring Attention
              </h4>
              <p className="text-xs text-rose-700">
                Someone nearby scanned your vehicle QR requesting urgent assistance.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('emergency')}
            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 shrink-0"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Pending Parking Reports Banner if any exist */}
      {pendingParking.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                {pendingParking.length} Pending Parking Obstruction Report(s)
              </h4>
              <p className="text-xs text-amber-700">
                A citizen or security guard reported your vehicle obstructing a path or gate.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('parking')}
            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 shrink-0"
          >
            Review Report
          </button>
        </div>
      )}

      {/* KPI Stats Grid (Real Data Only) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total QR Scans */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Scans</span>
            <Eye className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalScans}</div>
          <p className="text-[11px] text-slate-400">
            {stats.totalScans === 0 ? 'No QR scans recorded yet.' : 'Total physical decal scans'}
          </p>
        </div>

        {/* Contact Requests */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Contact Requests</span>
            <MessageSquare className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.contactRequests}</div>
          <p className="text-[11px] text-slate-400">
            {stats.contactRequests === 0 ? 'No contact requests yet.' : 'Owner contact pings'}
          </p>
        </div>

        {/* Parking Reports */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Parking Reports</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.parkingReports}</div>
          <p className="text-[11px] text-slate-400">
            {stats.parkingReports === 0 ? 'No parking reports yet.' : `${pendingParking.length} pending resolution`}
          </p>
        </div>

        {/* Emergency Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Emergency Requests</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.emergencyAlerts}</div>
          <p className="text-[11px] text-slate-400">
            {stats.emergencyAlerts === 0 ? 'No emergency requests yet.' : 'Logged in owner dashboard'}
          </p>
        </div>

        {/* Registered Vehicles */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Vehicles</span>
            <Car className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{vehicles.length}</div>
          <p className="text-[11px] text-emerald-600 font-medium">
            {stats.activeQRCodesCount} active QR code(s)
          </p>
        </div>
      </div>

      {/* Main Grid: Chart & Vehicle Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Velocity or Honest Empty State */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-subtle p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">QR Scan & Assistance Velocity</h3>
              <p className="text-xs text-slate-500">Activity insights from physical QR scans</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              Real Metrics
            </span>
          </div>

          {!hasRealActivity ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
              <BarChart2 className="w-10 h-10 text-slate-300" />
              <h4 className="text-xs font-semibold text-slate-700">
                Activity insights will appear after your QR receives scans.
              </h4>
              <p className="text-[11px] text-slate-400 max-w-sm">
                When someone scans your physical windshield decal or submits a report from another phone, the velocity chart will populate with real event telemetry.
              </p>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#FFF',
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#scanGradient)" name="Events" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Primary Vehicle Card */}
        {primaryVehicle ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Vehicle</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  primaryVehicle.qr_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {primaryVehicle.qr_active ? 'QR Active' : 'QR Inactive'}
                </span>
              </div>

              <div className="pt-3 space-y-1">
                <h4 className="text-base font-black text-slate-900">
                  {primaryVehicle.brand} {primaryVehicle.model}
                </h4>
                <p className="font-mono text-xs font-bold text-brand-600">
                  {primaryVehicle.registration_number}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {primaryVehicle.category} • {primaryVehicle.color} • {primaryVehicle.model_year}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>Scans recorded:</span>
                  <span className="font-semibold text-slate-900">{primaryVehicle.qr_scans_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plate masked on scan:</span>
                  <span className="font-semibold text-slate-900">
                    {primaryVehicle.mask_registration_number ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Direct phone calling:</span>
                  <span className="font-semibold text-slate-900">
                    {primaryVehicle.allow_public_phone_display ? 'Enabled' : 'Private (Mediated)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('qrcodes')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Manage QR & Windshield Pass</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <Car className="w-10 h-10 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-800">No vehicles registered yet.</h4>
            <p className="text-xs text-slate-500">Register your vehicle to generate your secure public QR pass.</p>
            <button
              onClick={() => onNavigateTab('vehicles')}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold"
            >
              Add Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Recent Activity Feed (Real Events Only) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent Activity Trail</h3>
          {recentEvents.length > 0 && (
            <button
              onClick={() => onNavigateTab('activity')}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              View Full History →
            </button>
          )}
        </div>

        {recentEvents.length === 0 ? (
          <div className="py-10 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No activity recorded yet.</p>
            <p className="text-[11px] text-slate-400">
              When a citizen or guard scans your QR or submits a parking report, it will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentEvents.slice(0, 5).map(event => {
              const typeIcons: Record<string, any> = {
                qr_scan: { icon: Eye, color: 'text-brand-500 bg-brand-50', label: 'Vehicle QR Code Scanned' },
                contact_request: { icon: MessageSquare, color: 'text-purple-500 bg-purple-50', label: 'Contact Request Received' },
                parking_report: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', label: 'Parking Obstruction Reported' },
                emergency_alert: { icon: AlertOctagon, color: 'text-rose-500 bg-rose-50', label: 'Emergency Assistance Alert' },
                qr_token_regenerated: { icon: ShieldCheck, color: 'text-blue-500 bg-blue-50', label: 'QR Token Regenerated' },
                qr_status_changed: { icon: ShieldCheck, color: 'text-slate-500 bg-slate-50', label: 'QR Status Toggled' },
              };

              const meta = typeIcons[event.event_type] || { icon: Clock, color: 'text-slate-500 bg-slate-50', label: event.event_type };
              const Icon = meta.icon;

              return (
                <div key={event.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {event.details?.reason ? `Reason: ${event.details.reason}` : event.details?.message || 'Logged via TRUSTFORGE gateway'}
                      </span>
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
    </div>
  );
};
