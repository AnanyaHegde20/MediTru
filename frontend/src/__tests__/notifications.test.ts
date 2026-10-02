import { describe, expect, it } from 'vitest';
import {
  buildNotifications,
  combineNotifications,
  readSeenIds,
  seenStorageKey,
  writeSeenIds,
} from '../lib/notifications';
import { UserProfile } from '../types';

const patient = { id: '1', name: 'Priya', email: 'priya@example.com', role: 'patient' } as UserProfile;
const doctor = { id: '2', name: 'Doc', email: 'doc@example.com', role: 'doctor' } as UserProfile;
const admin = { id: '3', name: 'Ada', email: 'ada@example.com', role: 'admin' } as UserProfile;

const labReport = {
  id: '20',
  patientId: '1',
  name: 'Lipid Panel',
  category: 'Lipid',
  date: 'Oct 22, 2026',
  doctorName: 'Dr. Stone',
  doctorSpecialty: 'Cardiology',
  status: 'Normal',
  fileSize: '1 MB',
  values: [],
  aiSummary: { overview: '', keyFindings: [], attentionItems: [], recommendations: [] },
} as any;

const refillRequest = {
  id: '30',
  patientId: '1',
  medicationName: 'Atorvastatin',
  dosage: '20 mg',
  frequency: 'Once daily',
  doctorName: 'Dr. Stone',
  specialty: 'Cardiology',
  startDate: 'Oct 01, 2026',
  endDate: 'Jan 01, 2027',
  refillsRemaining: 1,
  totalRefills: 4,
  instructions: 'At bedtime',
  status: 'Refill Requested',
  pharmacy: 'Walgreens',
} as any;

const unreadThread = {
  id: '40',
  subject: 'Lab follow-up',
  partnerName: 'Dr. Stone',
  partnerRoleLabel: 'Doctor',
  partnerAvatar: '',
  updatedAt: 1,
  unread: 2,
  messages: [],
} as any;

const emptyData = {
  labReports: [],
  prescriptions: [],
  messageThreads: [],
};

describe('buildNotifications', () => {
  it('shows a patient their labs and refill requests', () => {
    const items = buildNotifications('patient', patient, {
      ...emptyData,
      labReports: [labReport],
      prescriptions: [refillRequest],
    });

    expect(items.map((i) => i.id)).toEqual(['lab-20', 'rx-30']);
    expect(items[0].title).toBe('Lab Report Ready');
    expect(items[0].time).toBe('Oct 22');
    expect(items[1].title).toBe('Refill Requested');
  });

  it('shows a doctor refill approvals', () => {
    const items = buildNotifications('doctor', doctor, {
      ...emptyData,
      prescriptions: [refillRequest],
    });

    expect(items.map((i) => i.title)).toEqual(['Refill Request']);
    expect(items[0].desc).toContain('Atorvastatin');
  });

  it('includes unread message threads for every role', () => {
    for (const [role, user] of [
      ['patient', patient],
      ['doctor', doctor],
      ['admin', admin],
    ] as const) {
      const items = buildNotifications(role, user, { ...emptyData, messageThreads: [unreadThread] });
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('thread-40');
      expect(items[0].title).toBe('New Message');
      expect(items[0].time).toBe('2 unread');
    }
  });

  it('returns nothing when there is no relevant activity', () => {
    expect(buildNotifications('patient', patient, emptyData)).toEqual([]);
    expect(buildNotifications('admin', admin, emptyData)).toEqual([]);
  });
});

describe('combineNotifications', () => {
  const serverRows = [
    {
      id: '5',
      title: 'Appointment Reminder',
      desc: 'Dr. Stone • Oct 24, 2026 at 10:00 AM',
      time: 'Oct 24',
      readAt: null,
    },
    {
      id: '6',
      title: 'Appointment Reminder',
      desc: 'Dr. Stone • Oct 22, 2026 at 09:00 AM',
      time: 'Oct 22',
      readAt: '2026-10-01T10:00:00Z',
    },
  ];

  it('marks server rows unread until they are read on the server', () => {
    const combined = combineNotifications(serverRows, [], []);
    expect(combined.map((n) => n.id)).toEqual(['srv-5', 'srv-6']);
    expect(combined[0].unread).toBe(true);
    expect(combined[1].unread).toBe(false);
  });

  it('ignores locally seen ids for server rows', () => {
    const combined = combineNotifications([serverRows[0]], [], ['srv-5']);
    expect(combined[0].unread).toBe(true);
  });

  it('marks client rows unread until seen locally', () => {
    const client = [{ id: 'lab-20', title: 'Lab Report Ready', desc: 'x', time: 'Oct 22' }];
    expect(combineNotifications([], client, [])[0].unread).toBe(true);
    expect(combineNotifications([], client, ['lab-20'])[0].unread).toBe(false);
  });

  it('lists server reminders before client activity', () => {
    const client = [{ id: 'rx-30', title: 'Refill Requested', desc: 'x', time: 'x' }];
    const combined = combineNotifications(serverRows, client, []);
    expect(combined.map((n) => n.id)).toEqual(['srv-5', 'srv-6', 'rx-30']);
  });
});

describe('seen notification ids', () => {
  it('round-trips ids through localStorage', () => {
    window.localStorage.removeItem(seenStorageKey('priya@example.com'));
    expect(readSeenIds('priya@example.com')).toEqual([]);

    writeSeenIds('priya@example.com', ['apt-10', 'lab-20']);
    expect(readSeenIds('priya@example.com')).toEqual(['apt-10', 'lab-20']);
    expect(readSeenIds('someone-else@example.com')).toEqual([]);
  });

  it('ignores corrupted storage values', () => {
    window.localStorage.setItem(seenStorageKey('broken@example.com'), '{not-json');
    expect(readSeenIds('broken@example.com')).toEqual([]);

    window.localStorage.setItem(seenStorageKey('array@example.com'), '{"a":1}');
    expect(readSeenIds('array@example.com')).toEqual([]);
  });
});
