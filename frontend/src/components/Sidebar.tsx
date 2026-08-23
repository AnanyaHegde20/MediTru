import React from 'react';
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
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab, UserRole, UserProfile } from '../types';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserProfile;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const getNavItems = (role: UserRole) => {
    switch (role) {
      case 'patient':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
          { id: 'appointments' as ActiveTab, label: 'Appointments', icon: Calendar },
          { id: 'records' as ActiveTab, label: 'My Records', icon: FileText },
          { id: 'ai-assistant' as ActiveTab, label: 'AI Health Assistant', icon: Bot, badge: 'AI' },
          { id: 'prescriptions' as ActiveTab, label: 'Prescriptions', icon: Pill },
          { id: 'messages' as ActiveTab, label: 'Messages', icon: MessageSquare, count: 4 },
          { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
        ];
      case 'doctor':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
          { id: 'patients' as ActiveTab, label: 'My Patients', icon: Users },
          { id: 'appointments' as ActiveTab, label: 'Appointments', icon: Calendar },
          { id: 'ai-assistant' as ActiveTab, label: 'AI Assistant', icon: Bot, badge: 'AI' },
          { id: 'prescriptions' as ActiveTab, label: 'Prescriptions', icon: Pill },
          { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
          { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
        ];
      case 'admin':
        return [
          { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
          { id: 'patients' as ActiveTab, label: 'Patients Directory', icon: Users },
          { id: 'appointments' as ActiveTab, label: 'All Appointments', icon: Calendar },
          { id: 'analytics' as ActiveTab, label: 'Analytics & KPIs', icon: BarChart3 },
          { id: 'records' as ActiveTab, label: 'Audit & Records', icon: FileText },
          { id: 'settings' as ActiveTab, label: 'System Settings', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems(currentUser.role);

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
      <div className="flex-1 py-4 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-5 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-[calc(100%-24px)] mx-3 flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isCollapsed ? 'justify-center' : 'justify-between'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
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
            </button>
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
            onClick={() => onLogout?.()}
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
            onClick={() => onLogout?.()}
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
