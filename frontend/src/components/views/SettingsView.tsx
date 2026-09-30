import React, { useEffect, useState } from 'react';
import { CalendarClock, Lock, Plus, User, X } from 'lucide-react';
import { Doctor } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getToken } from '../../lib/api';
import { useDataStore } from '../../store/useDataStore';
import { useToast } from '../Toast';

type SlotPeriod = 'morning' | 'afternoon' | 'evening';
type Slots = Record<SlotPeriod, string[]>;

const EMPTY_SLOTS: Slots = { morning: [], afternoon: [], evening: [] };
const PERIODS: SlotPeriod[] = ['morning', 'afternoon', 'evening'];

const PERIOD_LABELS: Record<SlotPeriod, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

interface HealthStatus {
  status: string;
  hasGeminiKey: boolean;
  database: string;
}

const STATUS_STYLES = {
  good: 'text-emerald-700 bg-emerald-100',
  info: 'text-blue-700 bg-blue-100',
  bad: 'text-rose-700 bg-rose-100',
  neutral: 'text-slate-500 bg-slate-100',
} as const;

const statusPill = (kind: keyof typeof STATUS_STYLES, label: string) => (
  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${STATUS_STYLES[kind]}`}>
    {label}
  </span>
);

function toDisplayTime(hhmm: string): string {
  const [hourStr, minute] = hhmm.split(':');
  let hour = Number(hourStr);
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${minute} ${meridiem}`;
}

export const SettingsView: React.FC = () => {
  const { currentUser, updateProfile, handleLogout } = useAuth();
  const doctors = useDataStore((state) => state.doctors);
  const fetchDoctors = useDataStore((state) => state.fetchDoctors);
  const updateDoctor = useDataStore((state) => state.updateDoctor);
  const createDoctorProfile = useDataStore((state) => state.createDoctorProfile);
  const { showToast } = useToast();

  const isDoctor = currentUser?.role === 'doctor';
  const profileId = isDoctor
    ? doctors.find((d) => d.email && currentUser && d.email === currentUser.email)?.id
    : undefined;
  const myProfile = profileId ? doctors.find((d) => d.id === profileId) : undefined;

  const [slots, setSlots] = useState<Slots>(EMPTY_SLOTS);
  const [newTime, setNewTime] = useState('');
  const [newPeriod, setNewPeriod] = useState<SlotPeriod>('morning');
  const [isSaving, setIsSaving] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);

  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileBadge, setProfileBadge] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileBloodGroup, setProfileBloodGroup] = useState('');
  const [profileAllergies, setProfileAllergies] = useState('');
  const [profileCondition, setProfileCondition] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setProfileName(currentUser.name ?? '');
    setProfilePhone(currentUser.phone ?? '');
    setProfileAvatar(currentUser.avatar ?? '');
    setProfileBadge(currentUser.badge ?? '');
    setProfileAge(currentUser.age != null ? String(currentUser.age) : '');
    setProfileGender(currentUser.gender ?? '');
    setProfileBloodGroup(currentUser.bloodGroup ?? '');
    setProfileAllergies((currentUser.allergies ?? []).join(', '));
    setProfileCondition(currentUser.medicalCondition ?? '');
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error(`health check failed: ${res.status}`);
        const data: HealthStatus = await res.json();
        if (!cancelled) {
          setApiReachable(true);
          setHealth(data);
        }
      } catch {
        if (!cancelled) setApiReachable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isDoctor) fetchDoctors();
  }, [isDoctor, fetchDoctors]);

  useEffect(() => {
    if (myProfile) setSlots(myProfile.slots ?? EMPTY_SLOTS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const totalSlots = slots.morning.length + slots.afternoon.length + slots.evening.length;

  const handleAddSlot = () => {
    if (!newTime) return;
    const formatted = toDisplayTime(newTime);
    if (slots[newPeriod].includes(formatted)) {
      showToast('That time slot is already listed.', 'error');
      return;
    }
    if (slots[newPeriod].length >= 10) {
      showToast('Maximum of 10 slots per period.', 'error');
      return;
    }
    setSlots((prev) => ({ ...prev, [newPeriod]: [...prev[newPeriod], formatted] }));
    setNewTime('');
  };

  const handleRemoveSlot = (period: SlotPeriod, time: string) => {
    setSlots((prev) => ({ ...prev, [period]: prev[period].filter((t) => t !== time) }));
  };

  const firstSlot = [...slots.morning, ...slots.afternoon, ...slots.evening][0];
  const nextAvailable = firstSlot ? `Tomorrow, ${firstSlot}` : 'By appointment';

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      if (myProfile) {
        await updateDoctor(myProfile.id, { ...myProfile, slots, nextAvailable });
        showToast('Availability saved.', 'success');
      } else {
        const badge = currentUser.badge;
        const specialty = badge && badge !== 'Doctor' ? badge : 'General Medicine';
        const created = await createDoctorProfile({
          name: currentUser.name,
          email: currentUser.email,
          specialty,
          rating: 4.5,
          reviewCount: 0,
          experienceYears: 0,
          consultationFee: 0,
          nextAvailable,
          avatar: currentUser.avatar || '',
          bio: '',
          hospital: '',
          education: '',
          slots,
        });
        showToast(`Availability profile created for ${created.name}.`, 'success');
      }
      setNewTime('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save availability.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Name is required.', 'error');
      return;
    }
    setIsSavingProfile(true);
    try {
      const age = profileAge.trim() === '' ? undefined : Number(profileAge);
      if (age != null && (Number.isNaN(age) || age < 0 || age > 150)) {
        showToast('Age must be a number between 0 and 150.', 'error');
        return;
      }
      const result = await updateProfile({
        name: profileName.trim(),
        phone: profilePhone,
        avatar: profileAvatar,
        badge: profileBadge,
        age,
        gender: profileGender,
        bloodGroup: profileBloodGroup,
        allergies: profileAllergies
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        medicalCondition: profileCondition,
      });
      if (result.error) {
        showToast(result.error, 'error');
        return;
      }
      showToast('Profile saved.', 'success');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Current and new password are required.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    setIsSavingPassword(true);
    try {
      const token = getToken();
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Could not change password.', 'error');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated. Please sign in again.', 'success');
      handleLogout();
    } catch {
      showToast('Cannot reach the server. Is the backend running?', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Application & Service Settings</h2>
            <p className="text-xs text-slate-400">Configure notifications and security protocols</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Integrations</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span>Gemini AI Health Engine</span>
                {!health
                  ? statusPill('neutral', 'Checking…')
                  : health.hasGeminiKey
                    ? statusPill('good', 'Active')
                    : statusPill('bad', 'Unavailable')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span>REST API Integration</span>
                {apiReachable === null
                  ? statusPill('neutral', 'Checking…')
                  : apiReachable
                    ? statusPill('info', 'Connected')
                    : statusPill('bad', 'Offline')}
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>H2 Database – File Persistence</span>
                {!health
                  ? statusPill('neutral', 'Checking…')
                  : health.database === 'up'
                    ? statusPill('good', 'Persistent')
                    : statusPill('bad', 'Unavailable')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form
        id="profile-settings"
        onSubmit={handleSaveProfile}
        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">My Profile</h2>
              <p className="text-xs text-slate-400">Personal details visible to your care team</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="input-profile-name" className="block text-xs font-semibold text-slate-700">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-profile-name"
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="input-profile-phone" className="block text-xs font-semibold text-slate-700">
              Phone
            </label>
            <input
              id="input-profile-phone"
              type="tel"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="input-profile-avatar" className="block text-xs font-semibold text-slate-700">
              Avatar URL
            </label>
            <input
              id="input-profile-avatar"
              type="text"
              value={profileAvatar}
              onChange={(e) => setProfileAvatar(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {currentUser?.role === 'doctor' && (
            <div className="space-y-1">
              <label htmlFor="input-profile-badge" className="block text-xs font-semibold text-slate-700">
                Badge / Specialty
              </label>
              <input
                id="input-profile-badge"
                type="text"
                value={profileBadge}
                onChange={(e) => setProfileBadge(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          {currentUser?.role === 'patient' && (
            <>
              <div className="space-y-1">
                <label htmlFor="input-profile-age" className="block text-xs font-semibold text-slate-700">
                  Age
                </label>
                <input
                  id="input-profile-age"
                  type="number"
                  min={0}
                  max={150}
                  value={profileAge}
                  onChange={(e) => setProfileAge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="input-profile-gender" className="block text-xs font-semibold text-slate-700">
                  Gender
                </label>
                <input
                  id="input-profile-gender"
                  type="text"
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="input-profile-blood-group" className="block text-xs font-semibold text-slate-700">
                  Blood Group
                </label>
                <input
                  id="input-profile-blood-group"
                  type="text"
                  value={profileBloodGroup}
                  onChange={(e) => setProfileBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label htmlFor="input-profile-allergies" className="block text-xs font-semibold text-slate-700">
                  Allergies (comma separated)
                </label>
                <input
                  id="input-profile-allergies"
                  type="text"
                  value={profileAllergies}
                  onChange={(e) => setProfileAllergies(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="input-profile-condition" className="block text-xs font-semibold text-slate-700">
                  Medical Condition
                </label>
                <input
                  id="input-profile-condition"
                  type="text"
                  value={profileCondition}
                  onChange={(e) => setProfileCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            id="btn-save-profile"
            type="submit"
            disabled={isSavingProfile}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            {isSavingProfile && (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{isSavingProfile ? 'Saving…' : 'Save Profile'}</span>
          </button>
        </div>
      </form>

      <form
        id="password-settings"
        onSubmit={handleChangePassword}
        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-400">Use at least 8 characters</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="input-password-current" className="block text-xs font-semibold text-slate-700">
              Current Password
            </label>
            <input
              id="input-password-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="input-password-new" className="block text-xs font-semibold text-slate-700">
              New Password
            </label>
            <input
              id="input-password-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="input-password-confirm" className="block text-xs font-semibold text-slate-700">
              Confirm New Password
            </label>
            <input
              id="input-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            id="btn-save-password"
            type="submit"
            disabled={isSavingPassword}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            {isSavingPassword && (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{isSavingPassword ? 'Saving…' : 'Update Password'}</span>
          </button>
        </div>
      </form>

      {isDoctor && (
        <div
          id="availability-settings"
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">My Availability</h2>
                <p className="text-xs text-slate-400">
                  {myProfile
                    ? `Publishing open time slots for ${myProfile.name}.`
                    : 'Save to create your doctor profile and publish time slots.'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
              {totalSlots} Slot{totalSlots === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="input-availability-time"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Time
              </label>
              <input
                id="input-availability-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="select-availability-period"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Period
              </label>
              <select
                id="select-availability-period"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value as SlotPeriod)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
              >
                {PERIODS.map((period) => (
                  <option key={period} value={period}>
                    {PERIOD_LABELS[period]}
                  </option>
                ))}
              </select>
            </div>
            <button
              id="btn-add-availability-slot"
              type="button"
              onClick={handleAddSlot}
              disabled={!newTime}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERIODS.map((period) => (
              <div key={period} className="p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {PERIOD_LABELS[period]}
                </div>
                {slots[period].length === 0 ? (
                  <p className="text-xs text-slate-400">No slots yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {slots[period].map((time) => (
                      <span
                        key={time}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold"
                      >
                        {time}
                        <button
                          onClick={() => handleRemoveSlot(period, time)}
                          aria-label={`Remove ${time}`}
                          className="p-0.5 rounded hover:bg-blue-100 hover:text-blue-900 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              id="btn-save-availability"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              {isSaving && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{isSaving ? 'Saving…' : 'Save Availability'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
