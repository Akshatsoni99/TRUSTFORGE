import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Server, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { getBackendStatus, purgeAllLocalData } from '../../lib/storage';

export const SettingsTab: React.FC = () => {
  const backend = getBackendStatus();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleExportData = () => {
    try {
      const allData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tf_')) {
          allData[key] = JSON.parse(localStorage.getItem(key) || '{}');
        }
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trustforge-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (err) {
      alert('Could not export database: ' + err);
    }
  };

  const handlePurgeData = () => {
    if (confirm('Are you sure you want to purge all local account records from this browser? This will reset the application to a fresh state.')) {
      purgeAllLocalData();
      setActionMessage('Local database cleared. Reloading...');
      setTimeout(() => {
        window.location.href = '/';
      }, 600);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">System & Database Settings</h2>
        <p className="text-xs text-slate-500">
          Backend integration architecture, external provider status, and data management.
        </p>
      </div>

      {actionMessage && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Backend Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-600" />
          Backend Connection Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Database</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${backend.isConfigured ? 'bg-emerald-500' : 'bg-brand-500'}`} />
              <strong className="text-slate-800">
                {backend.isConfigured ? 'Supabase PostgreSQL Cloud' : 'Local Persistent Storage Engine'}
              </strong>
            </div>
            <p className="text-[11px] text-slate-500">
              {backend.isConfigured
                ? 'Connected to production cloud database.'
                : 'Zero-config local persistent engine active. All user registrations and alerts persist in your browser.'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">External Telephony Gateway</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${backend.telephonyConfigured ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <strong className="text-slate-800">
                {backend.telephonyConfigured ? 'Live SMS Provider' : 'Not Configured (Optional)'}
              </strong>
            </div>
            <p className="text-[11px] text-slate-500">
              {backend.telephonyConfigured
                ? 'External SMS delivery enabled.'
                : 'Alerts are recorded and visible in real time in the Owner Dashboard.'}
            </p>
          </div>
        </div>
      </div>

      {/* Data Management Utilities */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-600" />
          Data Management Utilities
        </h3>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <strong className="text-xs font-semibold text-slate-800 block">
                Export Database Backup
              </strong>
              <span className="text-[11px] text-slate-500">
                Download a clean JSON archive of all your registered vehicles, contacts, and reports.
              </span>
            </div>
            <button
              onClick={handleExportData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <strong className="text-xs font-semibold text-rose-800 block">
                Reset / Purge Local Account Data
              </strong>
              <span className="text-[11px] text-slate-500">
                Completely clear local vehicles and profile to start a new clean onboarding journey.
              </span>
            </div>
            <button
              onClick={handlePurgeData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Account Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
