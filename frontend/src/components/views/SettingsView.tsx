import React, { useEffect, useState } from 'react';
import { CalendarClock, Plus, X } from 'lucide-react';
import { Doctor } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
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
  const { currentUser } = useAuth();
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
