import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Car, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Upload, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Info, 
  Check, 
  Eye, 
  Lock,
  Phone,
  Image as ImageIcon
} from 'lucide-react';
import { OnboardingData, VehicleCategory } from '../types';
import { 
  validateIndianMobile, 
  validateIndianVehicleNumber, 
  formatVehicleNumber, 
  normalizeIndianMobile,
  maskPhoneNumber 
} from '../lib/utils';
import { registerOwnerAndVehicle } from '../lib/storage';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    category: 'car',
    brand: '',
    model: '',
    modelYear: currentYear,
    registrationNumber: '',
    color: '',
    photoUrl: '',
    contacts: [
      {
        fullName: '',
        relationship: 'Spouse',
        phone: '',
        email: '',
        notifyOnEmergency: true,
      },
      {
        fullName: '',
        relationship: 'Sibling',
        phone: '',
        email: '',
        notifyOnEmergency: true,
      },
    ],
    maskRegistrationNumber: false,
    allowPublicPhoneDisplay: false,
    showOwnerName: true,
    consentAgreed: false,
  });

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real Vehicle Photo Upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('File size must be under 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!formData.phone.trim() || !validateIndianMobile(formData.phone)) {
      newErrors.phone = 'A valid 10-digit Indian mobile number is required.';
    }
    if (formData.email?.trim() && !formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.brand.trim()) newErrors.brand = 'Vehicle manufacturer/brand is required.';
    if (!formData.model.trim()) newErrors.model = 'Vehicle model/name is required.';
    if (!formData.modelYear || formData.modelYear < 1980 || formData.modelYear > currentYear + 1) {
      newErrors.modelYear = `Enter a valid manufacturing year (1980 - ${currentYear + 1}).`;
    }
    if (!formData.registrationNumber.trim() || !validateIndianVehicleNumber(formData.registrationNumber)) {
      newErrors.registrationNumber = 'Enter a valid Indian vehicle registration number (e.g., DL01AB1234 or 22BH1234AA).';
    }
    if (!formData.color.trim()) newErrors.color = 'Vehicle colour is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (formData.contacts.length < 2) {
      newErrors.contacts = 'At least 2 trusted emergency contacts are required.';
    }

    formData.contacts.forEach((contact, idx) => {
      if (!contact.fullName.trim()) {
        newErrors[`contact_${idx}_name`] = `Contact #${idx + 1} name is required.`;
      }
      if (!contact.phone.trim() || !validateIndianMobile(contact.phone)) {
        newErrors[`contact_${idx}_phone`] = `Contact #${idx + 1} valid mobile number is required.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as any);
  };

  const handleFinalSubmit = async () => {
    if (!formData.consentAgreed) {
      setErrors({ consent: 'You must confirm that you are the authorized owner/driver and agree to privacy terms.' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerOwnerAndVehicle(formData);
      navigate(`/qr-success/${result.vehicle.id}`);
    } catch (err) {
      console.error('Registration failed:', err);
      alert('An error occurred during registration. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addContact = () => {
    if (formData.contacts.length >= 5) return;
    setFormData(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          fullName: '',
          relationship: 'Friend',
          phone: '',
          email: '',
          notifyOnEmergency: true,
        },
      ],
    }));
  };

  const removeContact = (index: number) => {
    if (formData.contacts.length <= 2) {
      alert('A minimum of 2 trusted contacts is required for emergency safety coverage.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Form Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            Vehicle Owner Registration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Register Your Vehicle & Generate QR
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real user registration. Takes under 2 minutes.
          </p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'Owner Info', icon: User },
              { num: 2, label: 'Vehicle', icon: Car },
              { num: 3, label: 'Contacts', icon: Users },
              { num: 4, label: 'Review & QR', icon: CheckCircle2 },
            ].map(item => {
              const isActive = step === item.num;
              const isPast = step > item.num;

              return (
                <div
                  key={item.num}
                  className={`flex flex-col sm:flex-row items-center gap-2 p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : isPast
                      ? 'text-emerald-700 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : item.num}
                  </div>
                  <span className="text-xs tracking-tight text-center sm:text-left">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-10">
          {/* ========================================================================= */}
          {/* STEP 1: OWNER PERSONAL INFORMATION */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 1: Vehicle Owner Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your private account credentials. Kept secure and never published to strangers scanning your vehicle.
                </p>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Patel"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.fullName && <p className="text-xs text-rose-500 mt-1">{errors.fullName}</p>}
                </div>

                {/* Mobile Number (Non-blocking OTP) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Status: Unverified (OTP optional)
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={formData.phone.replace(/^\+91/, '')}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-sm pl-12 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                    />
                  </div>
                  {errors.phone ? (
                    <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>SMS OTP verification is optional for this MVP and does not block registration.</span>
                    </p>
                  )}
                </div>

                {/* Email Address (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ananya@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                </div>

                {/* Address (Optional Profile Information) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Residential City / Address <span className="text-slate-400 font-normal">(Optional — Private)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, Karnataka"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Never exposed on the public QR scan page. Stored only in your private owner profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: VEHICLE INFORMATION */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 2: Vehicle Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your real vehicle information. These details identify your car or bike when someone scans the QR.
                </p>
              </div>

              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Vehicle Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['car', 'bike', 'scooter', 'other'] as VehicleCategory[]).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          formData.category === cat
                            ? 'border-brand-600 bg-brand-50 text-brand-700 font-semibold shadow-subtle'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="capitalize text-sm">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Manufacturer / Brand <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tata, Mahindra, Honda"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {errors.brand && <p className="text-xs text-rose-500 mt-1">{errors.brand}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Vehicle Model / Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nexon, Thar, Activa"
                      value={formData.model}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {errors.model && <p className="text-xs text-rose-500 mt-1">{errors.model}</p>}
                  </div>
                </div>

                {/* Manufacturing Year & Registration Plate & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Manufacturing Year <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1980}
                      max={currentYear + 1}
                      placeholder={currentYear.toString()}
                      value={formData.modelYear}
                      onChange={e => setFormData({ ...formData, modelYear: Number(e.target.value) })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {errors.modelYear && <p className="text-xs text-rose-500 mt-1">{errors.modelYear}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Registration Plate <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="DL01AB1234"
                      value={formData.registrationNumber}
                      onChange={e => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                      className="w-full text-sm font-mono uppercase px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {errors.registrationNumber && (
                      <p className="text-xs text-rose-500 mt-1">{errors.registrationNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Vehicle Colour <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pearl White"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {errors.color && <p className="text-xs text-rose-500 mt-1">{errors.color}</p>}
                  </div>
                </div>

                {/* Optional Photograph Upload */}
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                      Optional Vehicle Photograph
                    </label>
                    <p className="text-xs text-slate-500">
                      Upload an actual photo of your vehicle so people scanning can visually confirm it. (If omitted, a neutral category graphic is shown).
                    </p>
                  </div>

                  {formData.photoUrl ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={formData.photoUrl}
                        alt="Vehicle preview"
                        className="w-24 h-16 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Remove photo
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-subtle">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Choose File (PNG/JPG, max 4MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: TRUSTED EMERGENCY CONTACTS */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 3: Trusted Emergency Contacts
                </h2>
                <div className="mt-2 p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900 leading-relaxed">
                  "Add your trusted family members or close contacts. If someone scans your vehicle QR during an emergency, they can send an assistance notification to your selected contacts. Their personal information will remain protected."
                </div>
              </div>

              {errors.contacts && <p className="text-xs text-rose-500">{errors.contacts}</p>}

              <div className="space-y-4">
                {formData.contacts.map((contact, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {idx < 2 ? `Mandatory Contact #${idx + 1}` : `Additional Contact #${idx + 1}`}
                      </span>
                      {idx >= 2 && (
                        <button
                          type="button"
                          onClick={() => removeContact(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Contact Name"
                          value={contact.fullName}
                          onChange={e => {
                            const updated = [...formData.contacts];
                            updated[idx].fullName = e.target.value;
                            setFormData({ ...formData, contacts: updated });
                          }}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        {errors[`contact_${idx}_name`] && (
                          <p className="text-[10px] text-rose-500 mt-0.5">{errors[`contact_${idx}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                          Relationship *
                        </label>
                        <select
                          value={contact.relationship}
                          onChange={e => {
                            const updated = [...formData.contacts];
                            updated[idx].relationship = e.target.value;
                            setFormData({ ...formData, contacts: updated });
                          }}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Child">Child</option>
                          <option value="Friend">Friend</option>
                          <option value="Colleague">Colleague</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit mobile"
                          value={contact.phone.replace(/^\+91/, '')}
                          onChange={e => {
                            const updated = [...formData.contacts];
                            updated[idx].phone = e.target.value;
                            setFormData({ ...formData, contacts: updated });
                          }}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                        />
                        {errors[`contact_${idx}_phone`] && (
                          <p className="text-[10px] text-rose-500 mt-0.5">{errors[`contact_${idx}_phone`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={contact.notifyOnEmergency}
                          onChange={e => {
                            const updated = [...formData.contacts];
                            updated[idx].notifyOnEmergency = e.target.checked;
                            setFormData({ ...formData, contacts: updated });
                          }}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span>Notify this contact when someone triggers an emergency alert for this vehicle</span>
                      </label>
                    </div>
                  </div>
                ))}

                {formData.contacts.length < 5 && (
                  <button
                    type="button"
                    onClick={addContact}
                    className="w-full py-2.5 border border-dashed border-slate-300 hover:border-slate-400 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Emergency Contact (Up to 5)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: REVIEW, PRIVACY SETTINGS & CONFIRM */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 4: Review and Generate QR Code
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm your details. A unique cryptographic public QR token will be generated upon confirmation.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Profile</span>
                    <button onClick={() => setStep(1)} className="text-xs text-brand-600 hover:underline">Edit</button>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formData.fullName}</p>
                  <p className="text-xs text-slate-600 font-mono">+91 {formData.phone.replace(/^\+91/, '')}</p>
                  {formData.email && <p className="text-xs text-slate-600">{formData.email}</p>}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</span>
                    <button onClick={() => setStep(2)} className="text-xs text-brand-600 hover:underline">Edit</button>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formData.brand} {formData.model} ({formData.modelYear})</p>
                  <p className="text-xs text-brand-600 font-mono font-bold">{formatVehicleNumber(formData.registrationNumber)}</p>
                  <p className="text-xs text-slate-600 capitalize">{formData.category} • {formData.color}</p>
                </div>
              </div>

              {/* Emergency Contacts Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Emergency Contacts ({formData.contacts.length})
                  </span>
                  <button onClick={() => setStep(3)} className="text-xs text-brand-600 hover:underline">Edit</button>
                </div>
                <div className="space-y-1.5 pt-1">
                  {formData.contacts.map((c, i) => (
                    <div key={i} className="text-xs flex items-center justify-between text-slate-700">
                      <span>{c.fullName} ({c.relationship})</span>
                      <span className="font-mono text-slate-500">{maskPhoneNumber(c.phone)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Preferences */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-200">
                    Public QR Privacy Settings
                  </span>
                </div>

                <label className="flex items-start gap-3 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formData.maskRegistrationNumber}
                    onChange={e => setFormData({ ...formData, maskRegistrationNumber: e.target.checked })}
                    className="mt-0.5 rounded text-brand-500 focus:ring-brand-400"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">
                      Mask registration plate on public QR page
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Displays as "{formatVehicleNumber(formData.registrationNumber).slice(0, 2)} •••• {formatVehicleNumber(formData.registrationNumber).slice(-4)}" for additional privacy.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer text-xs pt-2 border-t border-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.allowPublicPhoneDisplay}
                    onChange={e => setFormData({ ...formData, allowPublicPhoneDisplay: e.target.checked })}
                    className="mt-0.5 rounded text-brand-500 focus:ring-brand-400"
                  />
                  <div>
                    <span className="font-semibold block text-slate-200">
                      Allow direct phone call button on public QR page
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      (Disabled by default). If enabled, your number will be visible to callers. If left disabled, all contact requests remain strictly mediated without exposing your phone number.
                    </span>
                  </div>
                </label>
              </div>

              {/* Consent Agreement */}
              <div className="space-y-2 pt-2">
                <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.consentAgreed}
                    onChange={e => setFormData({ ...formData, consentAgreed: e.target.checked })}
                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    I confirm that I am the authorized owner or primary driver of this vehicle. I consent to TRUSTFORGE mediating contact requests and emergency notifications without exposing my personal contact numbers.
                  </span>
                </label>
                {errors.consent && <p className="text-xs text-rose-500">{errors.consent}</p>}
              </div>
            </div>
          )}

          {/* Form Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors shadow-subtle ml-auto"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-subtle ml-auto disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Generating Secure QR...' : 'Confirm & Generate QR Code'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
