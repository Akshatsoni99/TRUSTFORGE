import React, { useState } from 'react';
import { getBackendStatus } from '../../lib/storage';
import { Database, ShieldCheck, X, Info } from 'lucide-react';

export const StatusBanner: React.FC = () => {
  const status = getBackendStatus();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 font-medium border border-slate-700">
            {status.isConfigured ? (
              <>
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Supabase PostgreSQL Live</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-brand-400" />
                <span>Local Sandbox Mode</span>
              </>
            )}
          </span>

          <span className="text-slate-400">
            {status.isConfigured ? (
              'Connected to production database & auth services.'
            ) : (
              <span>
                Supabase credentials not configured in <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">.env</code>. Operating with browser persistent storage for your registered vehicle and alerts.
              </span>
            )}
          </span>
        </div>

        <button 
          onClick={() => setDismissed(true)} 
          className="text-slate-400 hover:text-white p-1 transition-colors"
          title="Dismiss notification"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

