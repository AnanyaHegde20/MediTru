import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Bot,
  Pill,
  MessageSquare,
  Users,
  BarChart3,
} from 'lucide-react';
import { ActiveTab, UserRole } from '../types';

interface MobileNavProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  role: UserRole;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab, role }) => {
  const getTabs = () => {
    switch (role) {
      case 'patient':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
          { id: 'appointments' as ActiveTab, label: 'Book', icon: Calendar },
          { id: 'records' as ActiveTab, label: 'Records', icon: FileText },
          { id: 'ai-assistant' as ActiveTab, label: 'AI Health', icon: Bot },
          { id: 'messages' as ActiveTab, label: 'Messages', icon: MessageSquare },
        ];
      case 'doctor':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Schedule', icon: LayoutDashboard },
          { id: 'patients' as ActiveTab, label: 'Patients', icon: Users },
          { id: 'appointments' as ActiveTab, label: 'Calendar', icon: Calendar },
          { id: 'ai-assistant' as ActiveTab, label: 'AI Scribe', icon: Bot },
          { id: 'prescriptions' as ActiveTab, label: 'Rx', icon: Pill },
        ];
      case 'admin':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Overview', icon: LayoutDashboard },
          { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
          { id: 'patients' as ActiveTab, label: 'Users', icon: Users },
          { id: 'appointments' as ActiveTab, label: 'Schedule', icon: Calendar },
          { id: 'records' as ActiveTab, label: 'Audit', icon: FileText },
        ];
    }
  };

  const tabs = getTabs();

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex justify-around items-center"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`mobile-tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2px]' : ''}`} />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-blue-600 absolute -bottom-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
