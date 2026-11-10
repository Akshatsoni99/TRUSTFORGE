import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Shield } from 'lucide-react';
import { formatVehicleNumber, getPublicQrUrl } from '../../lib/utils';

interface QRCardPrintableProps {
  token: string;
  registrationNumber: string;
  brand: string;
  model: string;
  category: string;
}

export const QRCardPrintable: React.FC<QRCardPrintableProps> = ({
  token,
  registrationNumber,
  brand,
  model,
  category,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const publicUrl = getPublicQrUrl(token);

  useEffect(() => {
    if (!token) return;

    QRCode.toDataURL(
      publicUrl,
      {
        width: 600,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );

    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        publicUrl,
        {
          width: 500,
          margin: 4,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        }
      );
    }
  }, [publicUrl, token]);

  return (
    <div id="printable-qr-card" className="hidden print:block p-8 bg-white max-w-md mx-auto">
      <div className="border-4 border-slate-900 rounded-3xl p-6 text-center space-y-4 shadow-none">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 border-b-2 border-slate-200 pb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <div className="font-extrabold text-xl tracking-tight text-slate-900">
              Trust<span className="text-blue-600">Fordge</span>
            </div>
            <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-500 -mt-1">
              Vehicle Safety Network
            </div>
          </div>
        </div>

        {/* Vehicle Badge */}
        <div className="bg-slate-100 rounded-xl py-2 px-4 inline-block mx-auto border border-slate-300">
          <div className="text-xs uppercase font-medium text-slate-600">
            {brand} {model} ({category})
          </div>
          <div className="text-xl font-black font-mono tracking-wider text-slate-900">
            {formatVehicleNumber(registrationNumber)}
          </div>
        </div>

        {/* QR Display */}
        <div className="flex justify-center py-2">
          <div className="p-2 border-2 border-slate-300 rounded-2xl bg-white">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`TrustFordge Pass QR Code for ${registrationNumber}`}
                className="block w-[200px] h-[200px]"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <canvas ref={canvasRef} className="block w-[200px] h-[200px]" />
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-1 text-slate-800">
          <p className="font-bold text-sm tracking-tight">
            SCAN FOR VEHICLE ASSISTANCE
          </p>
          <p className="text-xs text-slate-600 leading-snug max-w-xs mx-auto">
            Vehicle obstructing parking, blocking passage, or in need of emergency owner contact?
            Scan using any mobile camera — no app required.
          </p>
        </div>

        {/* Privacy & 112 notice */}
        <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
          <div className="flex items-center justify-center gap-1 font-medium text-slate-700">
            <span>🔒 Direct Masked Mediation • Zero Personal Number Leak</span>
          </div>
          <div className="text-slate-600 font-semibold">
            For critical road accidents & medical emergencies, always dial 112 directly.
          </div>
        </div>
      </div>
    </div>
  );
};

