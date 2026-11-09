import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  LayoutDashboard, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { getVehicleById } from '../lib/storage';
import { Vehicle } from '../types';
import { QRCodeDisplay } from '../components/qr/QRCodeDisplay';
import { QRCardPrintable } from '../components/qr/QRCardPrintable';

export const QRSuccessPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (vehicleId) {
      const v = getVehicleById(vehicleId);
      setVehicle(v);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#10B981', '#0F172A'],
        });
      } catch {
        // Silently skip confetti errors
      }
    }
  }, [vehicleId]);

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Vehicle Not Found</h2>
          <p className="text-sm text-slate-500">The requested vehicle record could not be located.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold"
          >
            Register a Vehicle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Success Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 shadow-subtle no-print">
          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Registration Complete
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              Your TRUSTFORGE QR is ready.
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              A secure, random public token has been generated for your{' '}
              <strong>{vehicle.brand} {vehicle.model}</strong> ({vehicle.registration_number}).
              Your personal phone number and home address remain completely private.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-subtle shrink-0 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-brand-400" />
            <span>Open Owner Dashboard</span>
          </Link>
        </div>

        {/* QR Display Card */}
        <div className="no-print">
          <QRCodeDisplay
            vehicleId={vehicle.id}
            token={vehicle.qr_token}
            registrationNumber={vehicle.registration_number}
            brand={vehicle.brand}
            model={vehicle.model}
            category={vehicle.category}
            isActive={vehicle.qr_active}
            onTokenUpdated={(newToken: string) => {
              setVehicle({ ...vehicle, qr_token: newToken });
            }}
            onStatusUpdated={(active: boolean) => {
              setVehicle({ ...vehicle, qr_active: active });
            }}
          />
        </div>

        {/* Instructions Steps */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle no-print space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Displaying Your Decal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <span className="font-bold text-slate-900 block">1. Print or Stick on Windshield</span>
              <p>Print the windshield pass or download the PNG to place on your car windshield or bike tank.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <span className="font-bold text-slate-900 block">2. Scan from Another Phone</span>
              <p>Scan using your phone's default camera app to test the real-world assistance experience.</p>
            </div>
          </div>
        </div>

        {/* Printable Card (Hidden on screen, visible during window.print()) */}
        <QRCardPrintable
          token={vehicle.qr_token}
          registrationNumber={vehicle.registration_number}
          brand={vehicle.brand}
          model={vehicle.model}
          category={vehicle.category}
        />
      </div>
    </div>
  );
};
