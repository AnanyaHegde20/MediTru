import React, { useState } from 'react';
import {
  Search,
  Bell,
  Check,
  ChevronDown,
  Sparkles,
  User,
  Shield,
  Stethoscope,
  X,
  Menu,
} from 'lucide-react';
import { UserProfile, UserRole, ActiveTab } from '../types';

interface NavbarProps {
  currentUser: UserProfile;
  onSwitchRole?: (role: UserRole) => void;
  onRoleChange?: (role: UserRole) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchRole,
  onRoleChange,
  onNavigateTab,
  searchQuery = '',
  onSearchChange,
  onOpenMobileMenu,
}) => {
  const handleSwitchRole = (role: UserRole) => {
    if (onSwitchRole) onSwitchRole(role);
    else if (onRoleChange) onRoleChange(role);
  };
  const handleSearchChange = (value: string) => {
    if (onSearchChange) onSearchChange(value);
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Lipid Panel Ready',
      desc: 'Dr. Alan Stone uploaded your latest lab results.',
      time: '15m ago',
      unread: true,
      type: 'lab',
    },
    {
      id: '2',
      title: 'Appointment Reminder',
      desc: 'Cardiology consultation tomorrow at 10:00 AM.',
      time: '2h ago',
      unread: true,
      type: 'appointment',
    },
    {
      id: '3',
      title: 'Prescription Refill',
      desc: 'Atorvastatin 20mg renewal approved.',
      time: '1d ago',
      unread: false,
      type: 'rx',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const getSearchPlaceholder = () => {
    if (currentUser.role === 'patient') return 'Search records, vitals, doctors...';
    if (currentUser.role === 'doctor') return 'Search patient records, labs, schedules...';
    return 'Search patients, doctors, analytics, logs...';
  };

  return (
    <header
      id="top-navbar"
      className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 md:px-6 py-2.5 transition-all"
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Mobile menu trigger */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            id="btn-mobile-menu"
            onClick={() => onOpenMobileMenu?.()}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              +
            </div>
            MediCare
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden sm:flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={getSearchPlaceholder()}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2 md:gap-2.5">
          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications-bell"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowRoleMenu(false);
              }}
              className="relative p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div
                id="notifications-popover"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="badge-clean badge-clean-info">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-2.5 px-2 rounded-lg transition-colors ${
                        n.unread ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile + Role Switcher Menu */}
          <div className="relative">
            <button
              id="btn-role-switcher"
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1]?.[0]}.
                </div>
                <div className="text-[10px] font-medium text-slate-400 capitalize">
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div
                id="role-switch-dropdown"
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-400">Switch Demo Persona</p>
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    Currently: {currentUser.name} ({currentUser.role})
                  </p>
                </div>

                <div className="p-1 space-y-1 mt-1">
                  <button
                    id="switch-role-patient"
                    onClick={() => {
                      handleSwitchRole('patient');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentUser.role === 'patient'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-blue-600" />
                      <div className="text-left">
                        <div>Priya Sharma</div>
                        <div className="text-[10px] text-slate-400">Patient Dashboard</div>
                      </div>
                    </div>
                    {currentUser.role === 'patient' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    id="switch-role-doctor"
                    onClick={() => {
                      handleSwitchRole('doctor');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentUser.role === 'doctor'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      <div className="text-left">
                        <div>Dr. Rajesh Kumar</div>
                        <div className="text-[10px] text-slate-400">Doctor Dashboard</div>
                      </div>
                    </div>
                    {currentUser.role === 'doctor' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    id="switch-role-admin"
                    onClick={() => {
                      handleSwitchRole('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      currentUser.role === 'admin'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <div className="text-left">
                        <div>Sarah Jenkins</div>
                        <div className="text-[10px] text-slate-400">Admin & Analytics</div>
                      </div>
                    </div>
                    {currentUser.role === 'admin' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
