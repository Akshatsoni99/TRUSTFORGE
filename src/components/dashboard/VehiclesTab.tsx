import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Check, 
  ShieldCheck, 
  Eye, 
  QrCode, 
  X,
  ExternalLink 
} from 'lucide-react';
import { Vehicle, VehicleCategory } from '../../types';
import { formatVehicleNumber, validateIndianVehicleNumber } from '../../lib/utils';
import { updateVehicle } from '../../lib/storage';

interface VehiclesTabProps {
  vehicles: Vehicle[];
  onVehicleUpdated: () => void;
  onNavigateToQR: (vehicleId: string) => void;
}

export const VehiclesTab: React.FC<VehiclesTabProps> = ({
  vehicles,
  onVehicleUpdated,
  onNavigateToQR,
}) => {
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit form state
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editMaskReg, setEditMaskReg] = useState(false);

  const startEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setEditBrand(v.brand);
    setEditModel(v.model);
    setEditColor(v.color);
    setEditPhoto(v.photo_url || '');
    setEditMaskReg(v.mask_registration_number);
  };

  const handleSaveEdit = () => {
    if (!editingVehicle) return;
    updateVehicle(editingVehicle.id, {
      brand: editBrand,
      model: editModel,
      color: editColor,
      photo_url: editPhoto || undefined,
      mask_registration_number: editMaskReg,
    });
    setEditingVehicle(null);
    onVehicleUpdated();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Registered Vehicles</h2>
          <p className="text-xs text-slate-500">
            Manage your vehicles and their associated QR security profiles.
          </p>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Car className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Registered Vehicles Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any vehicles associated with this account yet. Register one to generate a QR pass.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map(v => (
            <div
              key={v.id}
              className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {v.category}
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      {v.brand} {v.model}
                    </h3>
                    <p className="font-mono text-xs font-bold text-brand-600">
                      {formatVehicleNumber(v.registration_number)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      v.qr_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${v.qr_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {v.qr_active ? 'QR Active' : 'QR Inactive'}
                  </span>
                </div>

                {v.photo_url ? (
                  <div className="rounded-lg overflow-hidden h-36 bg-slate-100 border border-slate-200">
                    <img src={v.photo_url} alt={v.model} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-28 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Car className="w-8 h-8 mb-1" />
                    <span className="text-xs">No photograph added</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Colour</span>
                    <span className="font-medium text-slate-800">{v.color}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Scans Logged</span>
                    <span className="font-medium text-slate-800">{v.qr_scans_count}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => startEdit(v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToQR(v.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR Pass</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Edit Vehicle Information</h3>
              <button onClick={() => setEditingVehicle(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={e => setEditBrand(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Model</label>
                  <input
                    type="text"
                    value={editModel}
                    onChange={e => setEditModel(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Colour</label>
                <input
                  type="text"
                  value={editColor}
                  onChange={e => setEditColor(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Vehicle Photograph
                </label>
                {editPhoto ? (
                  <div className="flex items-center gap-3">
                    <img src={editPhoto} alt="Preview" className="w-16 h-12 rounded object-cover border" />
                    <button
                      type="button"
                      onClick={() => setEditPhoto('')}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border rounded-lg text-xs font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={editMaskReg}
                    onChange={e => setEditMaskReg(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>Mask registration number on public QR scanner page</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingVehicle(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

