import React, { useState } from 'react';
import { Vehicle } from '../../types';
import { QRCodeDisplay } from '../qr/QRCodeDisplay';
import { QRCardPrintable } from '../qr/QRCardPrintable';
import { ShieldCheck, Info, Car } from 'lucide-react';

interface QRCodesTabProps {
  vehicles: Vehicle[];
  onVehicleUpdated: () => void;
}

export const QRCodesTab: React.FC<QRCodesTabProps> = ({
  vehicles,
  onVehicleUpdated,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.id || ''
  );

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  if (!selectedVehicle) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
        <Car className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">No Vehicles Available</h3>
        <p className="text-xs text-slate-500">Register a vehicle to generate your secure QR code.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">QR Code & Windshield Pass Management</h2>
          <p className="text-xs text-slate-500">
            Download, print, or regenerate your privacy-preserving public QR code.
          </p>
        </div>

        {/* Multi-vehicle Selector if user has multiple cars */}
        {vehicles.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Vehicle:</span>
            <select
              value={selectedVehicle.id}
              onChange={e => setSelectedVehicleId(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-brand-500"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.registration_number})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main QR Display */}
      <QRCodeDisplay
        vehicleId={selectedVehicle.id}
        token={selectedVehicle.qr_token}
        registrationNumber={selectedVehicle.registration_number}
        brand={selectedVehicle.brand}
        model={selectedVehicle.model}
        category={selectedVehicle.category}
        isActive={selectedVehicle.qr_active}
        onTokenUpdated={() => onVehicleUpdated()}
        onStatusUpdated={() => onVehicleUpdated()}
      />

      {/* Security Architecture Explanatory Card */}
      <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-brand-400">
          <ShieldCheck className="w-5 h-5" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            Zero-Exposure Cryptographic Architecture
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
            <strong className="text-white block font-semibold">No PII Inside the QR Code</strong>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The QR code embeds only an unguessable 128-bit random token. No phone numbers, home addresses, or full legal names are stored inside the physical matrix.
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
            <strong className="text-white block font-semibold">Instant Token Revocation</strong>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              If you sell your car or lose a printed decal, click "Regenerate Token". The previous QR is instantly invalidated at the database level.
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
            <strong className="text-white block font-semibold">Mediated Dispatch</strong>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              All parking obstruction alerts and emergency pings are routed through the TRUSTFORGE server layer. Scanners cannot inspect or harvest recipient phone numbers.
            </p>
          </div>
        </div>
      </div>

      {/* Printable Component for window.print() */}
      <QRCardPrintable
        token={selectedVehicle.qr_token}
        registrationNumber={selectedVehicle.registration_number}
        brand={selectedVehicle.brand}
        model={selectedVehicle.model}
        category={selectedVehicle.category}
      />
    </div>
  );
};

