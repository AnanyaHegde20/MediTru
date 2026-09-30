import { describe, expect, it } from 'vitest';
import {
  buildNotifications,
  readSeenIds,
  seenStorageKey,
  writeSeenIds,
} from '../lib/notifications';
import { UserProfile } from '../types';

const patient = { id: '1', name: 'Priya', email: 'priya@example.com', role: 'patient' } as UserProfile;
const doctor = { id: '2', name: 'Doc', email: 'doc@example.com', role: 'doctor' } as UserProfile;
const admin = { id: '3', name: 'Ada', email: 'ada@example.com', role: 'admin' } as UserProfile;

const ownAppointment = {
  id: '10',
  patientId: '1',
  patientName: 'Priya',
  doctorId: '2',
  doctorName: 'Dr. Stone',
  specialty: 'Cardiology',
  doctorAvatar: '',
  date: 'Oct 24, 2026',
  time: '10:00 AM',
  status: 'Confirmed',
  type: 'Checkup',
};

const otherAppointment = { ...ownAppointment, id: '11', patientId: '99' };

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
  appointments: [],
  labReports: [],
  prescriptions: [],
  messageThreads: [],
};

describe('buildNotifications', () => {
  it('shows a patient their own appointments, labs and refills', () => {
    const items = buildNotifications('patient', patient, {
      ...emptyData,
      appointments: [ownAppointment as any, otherAppointment as any],
      labReports: [labReport],
      prescriptions: [refillRequest],
    });

    expect(items.map((i) => i.id)).toEqual(['apt-10', 'lab-20', 'rx-30']);
    expect(items[0].title).toBe('Appointment Reminder');
    expect(items[0].desc).toContain('Dr. Stone');
    expect(items[0].time).toBe('Oct 24');
    expect(items[1].title).toBe('Lab Report Ready');
    expect(items[2].title).toBe('Refill Requested');
  });

  it('shows a doctor pending appointment requests and refill approvals', () => {
    const items = buildNotifications('doctor', doctor, {
      ...emptyData,
      appointments: [{ ...ownAppointment, status: 'Pending' } as any],
      prescriptions: [refillRequest],
    });

    expect(items.map((i) => i.title)).toEqual(['Appointment Request', 'Refill Request']);
    expect(items[0].desc).toContain('Priya');
  });

  it('shows an admin pending appointments across the platform', () => {
    const items = buildNotifications('admin', admin, {
      ...emptyData,
      appointments: [
        { ...ownAppointment, id: '12', status: 'Pending' } as any,
        { ...ownAppointment, id: '13', status: 'Completed' } as any,
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Pending Appointment');
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
