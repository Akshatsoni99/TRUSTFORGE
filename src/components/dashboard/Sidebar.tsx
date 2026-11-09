import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  QrCode, 
  Users, 
  AlertTriangle, 
  AlertOctagon, 
  MessageSquare,
  History, 
  Shield, 
  Settings, 
  User, 
  LogOut 
} from 'lucide-react';

export type DashboardTab = 
  | 'overview' 
  | 'profile' 
  | 'vehicles' 
  | 'qrcodes' 
  | 'contacts' 
  | 'requests'
  | 'parking' 
  | 'emergency' 
  | 'activity' 
  | 'privacy' 
  | 'settings';

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  unresolvedParkingCount: number;
  activeEmergencyCount: number;
  pendingRequestsCount: number;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  unresolvedParkingCount,
  activeEmergencyCount,
  pendingRequestsCount,
  onSignOut,
}) => {
  const navItems: Array<{
    id: DashboardTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'vehicles', label: 'My Vehicles', icon: Car },
    { id: 'qrcodes', label: 'My QR Codes', icon: QrCode },
    { id: 'contacts', label: 'Trusted Contacts', icon: Users },
    { 
      id: 'requests', 
      label: 'Contact Requests', 
      icon: MessageSquare, 
      badge: pendingRequestsCount, 
      badgeColor: 'bg-brand-100 text-brand-800' 
    },
    { 
      id: 'parking', 
      label: 'Parking Alerts', 
      icon: AlertTriangle, 
      badge: unresolvedParkingCount, 
      badgeColor: 'bg-amber-100 text-amber-800' 
    },
    { 
      id: 'emergency', 
      label: 'Emergency Alerts', 
      icon: AlertOctagon, 
      badge: activeEmergencyCount, 
      badgeColor: 'bg-rose-100 text-rose-800' 
    },
    { id: 'activity', label: 'Activity History', icon: History },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Owner Portal
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {Boolean(item.badge && item.badge > 0) && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sign Out Action at Bottom */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
