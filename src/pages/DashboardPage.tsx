import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentOwnerId, 
  setCurrentOwnerId, 
  getCurrentProfile, 
  getOwnerVehicles, 
  getOwnerParkingReports, 
  getOwnerEmergencyAlerts, 
  getOwnerContactRequests,
  getOwnerActivityEvents, 
  getOwnerTrustedContacts, 
  getOwnerStats
} from '../lib/storage';
import { 
  Profile, 
  Vehicle, 
  ParkingReport, 
  EmergencyAlert, 
  ContactRequest,
  ActivityEvent, 
  TrustedContact 
} from '../types';
import { Sidebar, DashboardTab } from '../components/dashboard/Sidebar';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { VehiclesTab } from '../components/dashboard/VehiclesTab';
import { QRCodesTab } from '../components/dashboard/QRCodesTab';
import { TrustedContactsTab } from '../components/dashboard/TrustedContactsTab';
import { ContactRequestsTab } from '../components/dashboard/ContactRequestsTab';
import { ParkingAlertsTab } from '../components/dashboard/ParkingAlertsTab';
import { EmergencyAlertsTab } from '../components/dashboard/EmergencyAlertsTab';
import { ActivityHistoryTab } from '../components/dashboard/ActivityHistoryTab';
import { ProfileTab } from '../components/dashboard/ProfileTab';
import { PrivacySettingsTab } from '../components/dashboard/PrivacySettingsTab';
import { SettingsTab } from '../components/dashboard/SettingsTab';
import { Shield, Menu, X, ArrowRight } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [ownerId, setOwnerId] = useState<string | null>(getCurrentOwnerId());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [parkingReports, setParkingReports] = useState<ParkingReport[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    contactRequests: 0,
    parkingReports: 0,
    emergencyAlerts: 0,
    registeredVehiclesCount: 0,
    activeQRCodesCount: 0,
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const loadData = useCallback(() => {
    const currentId = getCurrentOwnerId();
    if (!currentId) {
      setOwnerId(null);
      return;
    }

    setOwnerId(currentId);
    setProfile(getCurrentProfile());
    const vehs = getOwnerVehicles(currentId);
    setVehicles(vehs);
    setContactRequests(getOwnerContactRequests(currentId));
    setParkingReports(getOwnerParkingReports(currentId));
    setEmergencyAlerts(getOwnerEmergencyAlerts(currentId));
    setActivityEvents(getOwnerActivityEvents(currentId));
    setTrustedContacts(getOwnerTrustedContacts(currentId));
    setStats(getOwnerStats(currentId));
  }, []);

  useEffect(() => {
    loadData();

    // Listen to custom DB change events (real-time cross-tab updates when scanner actions occur)
    const handleDbChange = () => {
      loadData();
    };

    window.addEventListener('trustforge-db-change', handleDbChange);
    window.addEventListener('storage', handleDbChange);

    return () => {
      window.removeEventListener('trustforge-db-change', handleDbChange);
      window.removeEventListener('storage', handleDbChange);
    };
  }, [loadData]);

  const handleSignOut = () => {
    setCurrentOwnerId(null);
    setOwnerId(null);
    navigate('/');
  };

  // If user has not registered or logged in
  if (!ownerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">No Owner Account Active</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not currently have a vehicle owner session in this browser. Register your vehicle to generate your secure QR code and access live alerts.
          </p>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/register')}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-subtle transition-colors flex items-center justify-center gap-2"
            >
              <span>Register Your Vehicle & Create QR</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingParkingCount = parkingReports.filter(r => r.status === 'pending').length;
  const activeEmergencyCount = emergencyAlerts.filter(a => a.status === 'active').length;
  const pendingRequestsCount = contactRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Subnav for Dashboard */}
      <div className="md:hidden bg-white border-b border-slate-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Portal: {activeTab}
          </span>
          {(pendingParkingCount > 0 || activeEmergencyCount > 0 || pendingRequestsCount > 0) && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1"
        >
          {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Tabs</span>
        </button>
      </div>

      {/* Desktop Sidebar & Mobile Drawer */}
      <div className={`${mobileSidebarOpen ? 'block' : 'hidden'} md:block`}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          unresolvedParkingCount={pendingParkingCount}
          activeEmergencyCount={activeEmergencyCount}
          pendingRequestsCount={pendingRequestsCount}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Main Dashboard Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl overflow-y-auto">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            vehicles={vehicles}
            recentEvents={activityEvents}
            pendingParking={parkingReports.filter(r => r.status === 'pending')}
            activeEmergencies={emergencyAlerts.filter(a => a.status === 'active')}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehiclesTab
            vehicles={vehicles}
            onVehicleUpdated={loadData}
            onNavigateToQR={() => setActiveTab('qrcodes')}
          />
        )}

        {activeTab === 'qrcodes' && (
          <QRCodesTab
            vehicles={vehicles}
            onVehicleUpdated={loadData}
          />
        )}

        {activeTab === 'contacts' && (
          <TrustedContactsTab
            contacts={trustedContacts}
            ownerId={ownerId}
            onContactsUpdated={loadData}
          />
        )}

        {activeTab === 'requests' && (
          <ContactRequestsTab
            requests={contactRequests}
            onRequestsUpdated={loadData}
          />
        )}

        {activeTab === 'parking' && (
          <ParkingAlertsTab
            reports={parkingReports}
            onReportsUpdated={loadData}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyAlertsTab
            alerts={emergencyAlerts}
            onAlertsUpdated={loadData}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityHistoryTab events={activityEvents} />
        )}

        {activeTab === 'profile' && (
          <ProfileTab profile={profile} onProfileUpdated={loadData} />
        )}

        {activeTab === 'privacy' && (
          <PrivacySettingsTab vehicles={vehicles} onVehicleUpdated={loadData} />
        )}

        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
};
