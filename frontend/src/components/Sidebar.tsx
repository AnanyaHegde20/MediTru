import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Bot,
  Pill,
  MessageSquare,
  Settings,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';

interface SidebarProps {
  currentUser: UserProfile;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function getNavItems(role: UserRole) {
  switch (role) {
    case 'patient':
      return [
        { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/patient/appointments', label: 'Appointments', icon: Calendar },
        { path: '/patient/records', label: 'My Records', icon: FileText },
        { path: '/patient/ai-assistant', label: 'AI Health Assistant', icon: Bot, badge: 'AI' },
        { path: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
        { path: '/patient/messages', label: 'Messages', icon: MessageSquare, count: 4 },
        { path: '/patient/settings', label: 'Settings', icon: Settings },
      ];
    case 'doctor':
      return [
        { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/doctor/patients', label: 'My Patients', icon: Users },
        { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
        { path: '/doctor/ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'AI' },
        { path: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
        { path: '/doctor/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/doctor/settings', label: 'Settings', icon: Settings },
      ];
    case 'admin':
      return [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/patients', label: 'Patients Directory', icon: Users },
        { path: '/admin/analytics', label: 'Analytics & KPIs', icon: BarChart3 },
        { path: '/admin/settings', label: 'System Settings', icon: Settings },
      ];
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = getNavItems(currentUser.role);

  const handleLogout = () => {
    onLogout?.();
    navigate('/');
  };

  return (
    <aside
      id="sidebar-container"
      className={`hidden md:flex flex-col bg-white border-r border-slate-200 min-h-screen fixed top-0 left-0 bottom-0 z-30 transition-all duration-200 select-none ${
        isCollapsed ? 'w-20' : 'w-[240px]'
      }`}
    >
      {/* Brand Header */}
      <div className={`p-6 pb-4 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center px-3' : 'justify-between'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
            M
          </div>
          {!isCollapsed && (
            <div>
              <div className="font-bold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
                MediTru
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none">Healthcare OS</p>
            </div>
          )}
        </div>
        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
      {onToggleCollapse && isCollapsed && (
        <button
          onClick={onToggleCollapse}
          title="Expand sidebar"
          className="mx-auto mt-2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Main Navigation Links */}
      <div
        className={`flex-1 py-4 space-y-1 ${
          isCollapsed ? 'overflow-visible' : 'overflow-y-auto'
        }`}
      >
        {!isCollapsed && (
          <div className="px-5 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative w-[calc(100%-24px)] mx-3 flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-colors" />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && (
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {item.count}
                    </span>
                  )}
                </div>
              )}

              {isCollapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg opacity-0 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:translate-x-0"
                >
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Avatar + Name + Role at Bottom */}
      <div className="p-4 border-t border-slate-100">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {currentUser.name}
                </div>
                <div className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full w-max font-medium capitalize mt-0.5">
                  {currentUser.badge || currentUser.role}
                </div>
              </div>
            )}
          </div>
          <button
            id="btn-logout"
            onClick={handleLogout}
            title="Sign Out / Switch Role"
            className={`p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 ${
              isCollapsed ? 'hidden' : 'ml-1'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        {isCollapsed && (
          <button
            onClick={handleLogout}
            title="Sign Out / Switch Role"
            className="mt-2 mx-auto flex p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
