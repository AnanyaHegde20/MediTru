import { Doctor } from '../types';

export type DoctorSlots = Doctor['slots'];

export const GENERIC_SLOTS: DoctorSlots = {
  morning: ['09:00 AM', '10:00 AM', '11:00 AM'],
  afternoon: ['01:00 PM', '02:00 PM', '03:00 PM'],
  evening: ['05:00 PM', '06:00 PM'],
};

export const SLOT_PERIODS: { key: keyof DoctorSlots; label: string }[] = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
];

export function hasPublishedSlots(slots?: DoctorSlots): boolean {
  if (!slots) return false;
  return SLOT_PERIODS.some((period) => (slots[period.key] ?? []).length > 0);
}

export function visibleSlots(slots?: DoctorSlots): DoctorSlots {
  return hasPublishedSlots(slots) ? (slots as DoctorSlots) : GENERIC_SLOTS;
}

export function allSlotTimes(slots: DoctorSlots): string[] {
  return SLOT_PERIODS.flatMap((period) => slots[period.key] ?? []);
}

export function resolveTimeSlot(current: string, slots: DoctorSlots): string {
  const times = allSlotTimes(slots);
  if (times.length === 0) return current;
  return times.includes(current) ? current : times[0];
}
