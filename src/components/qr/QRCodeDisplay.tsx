import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Copy, Check, ExternalLink, RefreshCw, Power, AlertTriangle, ShieldCheck } from 'lucide-react';
import { regenerateQRToken, toggleQRStatus } from '../../lib/storage';
import { getPublicQrUrl } from '../../lib/utils';

interface QRCodeDisplayProps {
  vehicleId: string;
  token: string;
  registrationNumber: string;
  brand: string;
  model: string;
  category: string;
  isActive: boolean;
  onTokenUpdated?: (newToken: string) => void;
  onStatusUpdated?: (active: boolean) => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  vehicleId,
  token,
  registrationNumber,
  brand,
  model,
  category,
  isActive,
  onTokenUpdated,
  onStatusUpdated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const publicUrl = getPublicQrUrl(token);

  useEffect(() => {
    if (canvasRef.current && token) {
      QRCode.toCanvas(
        canvasRef.current,
        publicUrl,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#0F172A', // Slate 900
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error('Failed to generate QR code canvas:', error);
        }
      );
    }
  }, [publicUrl, token]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `TrustFordge-QR-${registrationNumber.replace(/\s+/g, '-')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmRegenerate = () => {
    setIsRegenerating(true);
    const result = regenerateQRToken(vehicleId);
    if (result.success && result.newToken) {
      if (onTokenUpdated) onTokenUpdated(result.newToken);
    }
    setIsRegenerating(false);
    setShowConfirmRegenerate(false);
  };

  const handleToggleActive = () => {
    setIsTogglingStatus(true);
    const newStatus = !isActive;
    const result = toggleQRStatus(vehicleId, newStatus);
    if (result.success && onStatusUpdated) {
      onStatusUpdated(newStatus);
    }
    setIsTogglingStatus(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              {brand} {model}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
              {category}
            </span>
          </div>
          <p className="text-sm font-mono font-medium text-brand-600 mt-1">
            {registrationNumber}
          </p>
        </div>

        {/* QR Activation Status Badge & Toggle */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
            />
            {isActive ? 'QR Active & Scannable' : 'QR Deactivated'}
          </span>

          <button
            onClick={handleToggleActive}
            disabled={isTogglingStatus}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                : 'text-brand-600 hover:bg-brand-50'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isActive ? 'Deactivate' : 'Activate QR'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Canvas Display */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="bg-white p-4 rounded-xl shadow-subtle border border-slate-200 relative">
            <canvas ref={canvasRef} className="max-w-[200px] w-full h-auto block" />
            {!isActive && (
              <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center text-white text-center p-4">
                <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                <span className="text-xs font-semibold">QR Deactivated</span>
                <span className="text-[10px] text-slate-300 mt-0.5">Scanners will see an inactive message</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-3 text-center flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
            <span>Token: {token.slice(0, 8)}••••••••{token.slice(-4)}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Public Vehicle QR URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Never reveals your phone, email, address, or DOB. Only connects through TrustFordge secure mediation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownloadPNG}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors shadow-subtle"
            >
              <Download className="w-4 h-4 text-brand-400" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Windshield Pass</span>
            </button>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setShowConfirmRegenerate(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate & Invalidate Old QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Regenerating Token */}
      {showConfirmRegenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-slate-900 text-base">Invalidate Old QR Code?</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Regenerating your QR token will immediately invalidate any printed stickers or physical badges using the current code. Scanners scanning the old QR will receive an invalid token error.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowConfirmRegenerate(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegenerate}
                disabled={isRegenerating}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                {isRegenerating ? 'Regenerating...' : 'Yes, Invalidate & Generate New QR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

