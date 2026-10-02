import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  Moon,
  Sun,
  X,
  LogOut,
  Stethoscope,
  Calendar,
  FileText,
  Users,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDataStore } from '../store/useDataStore';
import { apiFetch } from '../lib/api';
import { mapSearchResults, SearchResult } from '../lib/search';
import {
  buildNotifications,
  combineNotifications,
  readSeenIds,
  writeSeenIds,
} from '../lib/notifications';
import { useEscapeKey } from './ui/Dialog';

interface NavbarProps {
  currentUser: import('../types').UserProfile;
}

const RESULT_ICONS = {
  doctor: Stethoscope,
  patient: Users,
  user: UserCog,
  appointment: Calendar,
  lab: FileText,
} as const;

const RESULT_LABELS: Record<SearchResult['type'], string> = {
  doctor: 'Doctor',
  patient: 'Patient',
  user: 'Account',
  appointment: 'Visit',
  lab: 'Record',
};

export const Navbar: React.FC<NavbarProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const [internalQuery, setInternalQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('meditru-theme', next ? 'dark' : 'light');
    } catch {
      /* ignore storage errors */
    }
    setIsDark(next);
  };

  const mappedResults = useMemo(
    () => mapSearchResults(searchResults, currentUser.role),
    [searchResults, currentUser.role]
  );

  useEffect(() => {
    const q = internalQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setActiveIndex(-1);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      (async () => {
        try {
          const res = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (cancelled) return;
          setSearchResults(Array.isArray(data) ? (data as SearchResult[]) : []);
          setActiveIndex(0);
          setShowResults(true);
        } catch {
          if (!cancelled) setSearchResults([]);
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [internalQuery]);

  const selectResult = (index: number) => {
    const target = mappedResults[index];
    if (!target) return;
    setInternalQuery('');
    setSearchResults([]);
    setShowResults(false);
    setActiveIndex(-1);
    navigate(target.path);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || mappedResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % mappedResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + mappedResults.length) % mappedResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectResult(activeIndex >= 0 ? activeIndex : 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setShowResults(false);
      setActiveIndex(-1);
    }
  };

  const labReports = useDataStore((state) => state.labReports);
  const prescriptions = useDataStore((state) => state.prescriptions);
  const messageThreads = useDataStore((state) => state.messageThreads);
  const serverNotifications = useDataStore((state) => state.serverNotifications);
  const fetchLabReports = useDataStore((state) => state.fetchLabReports);
  const fetchPrescriptions = useDataStore((state) => state.fetchPrescriptions);
  const fetchMessageThreads = useDataStore((state) => state.fetchMessageThreads);
  const fetchServerNotifications = useDataStore((state) => state.fetchServerNotifications);
  const markServerNotificationsRead = useDataStore((state) => state.markServerNotificationsRead);

  const [seenIds, setSeenIds] = useState<string[]>(() => readSeenIds(currentUser.email ?? ''));

  const anyPopoverOpen = showNotifications || showRoleMenu;
  useEscapeKey(anyPopoverOpen, () => {
    setShowNotifications(false);
    setShowRoleMenu(false);
  });

  useEffect(() => {
    if (!anyPopoverOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#notifications-popover, #role-switch-dropdown')) return;
      if (target.closest('#btn-notifications-bell, #btn-role-switcher')) return;
      setShowNotifications(false);
      setShowRoleMenu(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [anyPopoverOpen]);

  useEffect(() => {
    fetchLabReports();
    fetchPrescriptions();
    fetchMessageThreads();
    fetchServerNotifications();
  }, [fetchLabReports, fetchPrescriptions, fetchMessageThreads, fetchServerNotifications]);

  useEffect(() => {
    setSeenIds(readSeenIds(currentUser.email ?? ''));
    fetchServerNotifications();
  }, [currentUser.email, fetchServerNotifications]);

  const notifications = useMemo(
    () =>
      combineNotifications(
        serverNotifications,
        buildNotifications(currentUser.role, currentUser, {
          labReports,
          prescriptions,
          messageThreads,
        }),
        seenIds
      ),
    [currentUser, serverNotifications, labReports, prescriptions, messageThreads, seenIds]
  );

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = async () => {
    const ids = notifications.map((n) => n.id);
    writeSeenIds(currentUser.email ?? '', ids);
    setSeenIds(ids);
    try {
      await markServerNotificationsRead();
    } catch (err) {
      console.warn('Failed to persist server-side notification read state', err);
    }
  };

  const handleSignOut = () => {
    handleLogout();
    setShowRoleMenu(false);
    navigate('/login');
  };

  const getSearchPlaceholder = () => {
    if (currentUser.role === 'patient') return 'Search records, vitals, doctors...';
    if (currentUser.role === 'doctor') return 'Search patient records, labs, schedules...';
    return 'Search patients, doctors, analytics, logs...';
  };

  return (
    <header
      id="top-navbar"
      className="sticky top-0 z-20 bg-white dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-2.5 transition-all"
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Mobile menu trigger */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              +
            </div>
            MediTru
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden sm:flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            role="combobox"
            value={internalQuery}
            onChange={(e) => setInternalQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => setShowResults(false)}
            placeholder={getSearchPlaceholder()}
            aria-expanded={showResults}
            aria-controls={showResults ? 'global-search-results' : undefined}
            aria-autocomplete="list"
            aria-label="Search"
            aria-activedescendant={
              showResults && activeIndex >= 0 ? `global-search-option-${activeIndex}` : undefined
            }
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
          />
          {internalQuery && (
            <button
              onClick={() => setInternalQuery('')}
              aria-label="Clear search"
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showResults && (
            <div
              id="global-search-results"
              role="listbox"
              aria-label="Search results"
              className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden max-h-80 overflow-y-auto"
            >
              {mappedResults.length === 0 ? (
                <div
                  id="global-search-option-empty"
                  role="option"
                  aria-disabled="true"
                  aria-selected="false"
                  className="px-3 py-3 text-xs text-slate-400"
                >
                  No results for “{internalQuery.trim()}”.
                </div>
              ) : (
                mappedResults.map((result, index) => {
                  const Icon = RESULT_ICONS[result.type];
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={result.key}
                      id={`global-search-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectResult(index)}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs cursor-pointer ${
                        isActive ? 'bg-blue-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-800 truncate">
                          {result.title}
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate">
                          {result.subtitle}
                        </span>
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 shrink-0">
                        {RESULT_LABELS[result.type]}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2 md:gap-2.5">
          {/* Theme Toggle */}
          <button
            id="btn-toggle-theme"
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-slate-700"
          >
            {isDark ? (
              <Sun className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Moon className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications-bell"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowRoleMenu(false);
                fetchServerNotifications();
              }}
              className="relative p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
              aria-label="Notifications"
              aria-haspopup="true"
              aria-expanded={showNotifications}
              aria-controls={showNotifications ? 'notifications-popover' : undefined}
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              {unreadCount > 0 && (
                <span
                  id="notification-unread-dot"
                  className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"
                />
              )}
            </button>

            {showNotifications && (
              <div
                id="notifications-popover"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
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

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-2">
                  {notifications.length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-400">
                      You&apos;re all caught up.
                    </p>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-2.5 px-2 rounded-lg transition-colors ${
                        n.unread ? 'bg-blue-50/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{n.desc}</p>
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
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs cursor-pointer"
              aria-haspopup="true"
              aria-expanded={showRoleMenu}
              aria-controls={showRoleMenu ? 'role-switch-dropdown' : undefined}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
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
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-400">Signed in as</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wide capitalize">
                    {currentUser.role}
                  </span>
                </div>

                <div className="p-1 mt-1">
                  <button
                    id="btn-navbar-signout"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
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
