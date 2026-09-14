import React from 'react';
import { NavLink } from 'react-router-dom';
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
import { UserRole } from '../types';

interface MobileNavProps {
  role: UserRole;
}

function getTabs(role: UserRole) {
  switch (role) {
    case 'patient':
      return [
        { path: '/patient/dashboard', label: 'Home', icon: LayoutDashboard },
        { path: '/patient/appointments', label: 'Book', icon: Calendar },
        { path: '/patient/records', label: 'Records', icon: FileText },
        { path: '/patient/ai-assistant', label: 'AI Health', icon: Bot },
        { path: '/patient/messages', label: 'Messages', icon: MessageSquare },
      ];
    case 'doctor':
      return [
        { path: '/doctor/dashboard', label: 'Schedule', icon: LayoutDashboard },
        { path: '/doctor/patients', label: 'Patients', icon: Users },
        { path: '/doctor/appointments', label: 'Calendar', icon: Calendar },
        { path: '/doctor/ai-assistant', label: 'AI Scribe', icon: Bot },
        { path: '/doctor/prescriptions', label: 'Rx', icon: Pill },
      ];
    case 'admin':
      return [
        { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/admin/patients', label: 'Users', icon: Users },
        { path: '/admin/appointments', label: 'Schedule', icon: Calendar },
      ];
  }
}

export const MobileNav: React.FC<MobileNavProps> = ({ role }) => {
  const tabs = getTabs(role);

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex justify-around items-center"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2px]' : ''}`} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-blue-600 absolute -bottom-0.5" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
