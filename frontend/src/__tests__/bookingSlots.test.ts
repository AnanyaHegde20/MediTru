import { describe, expect, it } from 'vitest';
import {
  GENERIC_SLOTS,
  allSlotTimes,
  hasPublishedSlots,
  resolveTimeSlot,
  visibleSlots,
} from '../lib/bookingSlots';

describe('bookingSlots', () => {
  const published = {
    morning: ['09:00 AM', '10:00 AM'],
    afternoon: ['02:30 PM'],
    evening: [] as string[],
  };

  it('detects published slots', () => {
    expect(hasPublishedSlots(published)).toBe(true);
    expect(hasPublishedSlots({ morning: [], afternoon: [], evening: [] })).toBe(false);
    expect(hasPublishedSlots(undefined)).toBe(false);
  });

  it('uses published slots when present, otherwise falls back to the generic grid', () => {
    expect(visibleSlots(published)).toBe(published);
    expect(visibleSlots({ morning: [], afternoon: [], evening: [] })).toEqual(GENERIC_SLOTS);
    expect(visibleSlots(undefined)).toEqual(GENERIC_SLOTS);
  });

  it('lists every slot across periods in display order', () => {
    expect(allSlotTimes(published)).toEqual(['09:00 AM', '10:00 AM', '02:30 PM']);
  });

  it('keeps the current selection when it is a published time', () => {
    expect(resolveTimeSlot('02:30 PM', published)).toBe('02:30 PM');
  });

  it('moves to the first available time when the selection is not offered', () => {
    expect(resolveTimeSlot('10:00 AM', GENERIC_SLOTS)).toBe('10:00 AM');
    expect(resolveTimeSlot('04:45 PM', published)).toBe('09:00 AM');
    expect(resolveTimeSlot('10:00 AM', { morning: [], afternoon: ['02:30 PM'], evening: [] })).toBe(
      '02:30 PM'
    );
  });
});
