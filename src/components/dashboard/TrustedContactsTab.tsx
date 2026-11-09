import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  X,
  Phone,
  Mail 
} from 'lucide-react';
import { TrustedContact } from '../../types';
import { maskPhoneNumber, validateIndianMobile, generateSecureToken } from '../../lib/utils';
import { saveTrustedContact, deleteTrustedContact } from '../../lib/storage';

interface TrustedContactsTabProps {
  contacts: TrustedContact[];
  ownerId: string;
  onContactsUpdated: () => void;
}

export const TrustedContactsTab: React.FC<TrustedContactsTabProps> = ({
  contacts,
  ownerId,
  onContactsUpdated,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('Parent');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [notifyEmergency, setNotifyEmergency] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!newPhone.trim() || !validateIndianMobile(newPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const newContact: TrustedContact = {
      id: `cnt_${generateSecureToken(8)}`,
      owner_id: ownerId,
      full_name: newName.trim(),
      relationship: newRelationship,
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      phone_verified: false,
      is_primary: contacts.length === 0,
      notify_on_emergency: notifyEmergency,
      created_at: new Date().toISOString(),
    };

    saveTrustedContact(newContact);
    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setError(null);
    onContactsUpdated();
  };

  const handleDelete = (contactId: string) => {
    if (contacts.length <= 2) {
      alert('A minimum of 2 trusted contacts must be maintained for emergency safety coverage.');
      return;
    }
    if (confirm('Are you sure you want to remove this emergency contact?')) {
      deleteTrustedContact(contactId);
      onContactsUpdated();
    }
  };

  const handleToggleEmergency = (contact: TrustedContact) => {
    saveTrustedContact({
      ...contact,
      notify_on_emergency: !contact.notify_on_emergency,
    });
    onContactsUpdated();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Trusted Emergency Contacts</h2>
          <p className="text-xs text-slate-500">
            Contacts who receive mediated alerts when someone triggers emergency assistance for your vehicle.
          </p>
        </div>

        {contacts.length < 5 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Emergency Contact</span>
          </button>
        )}
      </div>

      <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900 leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold">Privacy Protection Guarantee:</strong>
          Your trusted contacts' phone numbers and emails are securely stored and will <strong>never</strong> be displayed on the public vehicle QR scanner page.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact, idx) => (
          <div
            key={contact.id}
            className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {contact.relationship}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {contact.full_name}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  {contact.phone_verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                  {contacts.length > 2 && (
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-2 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{maskPhoneNumber(contact.phone)}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Notify on emergency:</span>
              <button
                onClick={() => handleToggleEmergency(contact)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                  contact.notify_on_emergency
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {contact.notify_on_emergency ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Emergency Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Contact Name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Relationship *</label>
                <select
                  value={newRelationship}
                  onChange={e => setNewRelationship(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="contact@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {error && <p className="text-xs text-rose-500">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

