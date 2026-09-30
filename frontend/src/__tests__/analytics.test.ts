import { describe, expect, it } from 'vitest';
import {
  deriveAppointmentsTrend,
  deriveRevenueByDoctor,
  deriveSpecialtyDistribution,
  deriveStatusBreakdown,
  doctorProfileId,
  totalRevenue,
} from '../lib/analytics';
import { Appointment, Doctor } from '../types';

const apt = (over: Partial<Appointment> = {}): Appointment => ({
  id: 'a1',
  patientId: '1',
  patientName: 'Priya Sharma',
  doctorId: 'd1',
  doctorName: 'Dr. A',
  specialty: 'Cardiology',
  doctorAvatar: '',
  date: 'Nov 01, 2024',
  time: '10:00 AM',
  status: 'Confirmed',
  type: 'Consultation',
  ...over,
});

const doc = (over: Partial<Doctor> = {}): Doctor => ({
  id: 'd1',
  name: 'Dr. A',
  specialty: 'Cardiology',
  rating: 5,
  reviewCount: 1,
  experienceYears: 5,
  consultationFee: 100,
  nextAvailable: '',
  avatar: '',
  bio: '',
  hospital: '',
  education: '',
  slots: { morning: [], afternoon: [], evening: [] },
  ...over,
});

describe('deriveAppointmentsTrend', () => {
  it('groups by date, strips the year and keeps the last 7 dates in order', () => {
    const appointments: Appointment[] = [];
    for (let i = 1; i <= 9; i += 1) {
      appointments.push(apt({ id: `a${i}`, date: `Jan ${i}, 2024` }));
    }
    appointments.push(apt({ id: 'done', date: 'Jan 3, 2024', status: 'Completed' }));

    const trend = deriveAppointmentsTrend(appointments);
    expect(trend).toHaveLength(7);
    expect(trend[0]).toEqual({ day: 'Jan 3', appointments: 2, completed: 1 });
    expect(trend[6].day).toBe('Jan 9');
    expect(trend.map((p) => p.appointments)).toEqual([2, 1, 1, 1, 1, 1, 1]);
  });

  it('returns an empty list when there are no appointments', () => {
    expect(deriveAppointmentsTrend([])).toEqual([]);
  });
});

describe('deriveStatusBreakdown', () => {
  it('computes percentage share per status', () => {
    const breakdown = deriveStatusBreakdown([
      apt({ status: 'Completed' }),
      apt({ status: 'Completed' }),
      apt({ status: 'Pending' }),
      apt({ status: 'Cancelled' }),
    ]);
    const byName = Object.fromEntries(breakdown.map((s) => [s.name, s.value]));
    expect(byName).toEqual({ Completed: 50, Pending: 25, Cancelled: 25 });
  });

  it('returns an empty list when there are no appointments', () => {
    expect(deriveStatusBreakdown([])).toEqual([]);
  });
});

describe('deriveSpecialtyDistribution', () => {
  it('ignores cancelled bookings, sorts by volume and caps at 6 specialties', () => {
    const appointments = [
      apt({ specialty: 'Cardiology' }),
      apt({ specialty: 'Cardiology' }),
      apt({ specialty: 'Neurology' }),
      apt({ specialty: 'Dermatology', status: 'Cancelled' }),
    ];
    const bars = deriveSpecialtyDistribution(appointments);
    expect(bars).toHaveLength(2);
    expect(bars[0]).toMatchObject({ specialty: 'Cardiology', count: 2 });
    expect(bars[1]).toMatchObject({ specialty: 'Neurology', count: 1 });
  });
});

describe('revenue helpers', () => {
  it('sums completed consultations per doctor, highest first', () => {
    const doctors = [doc({ id: 'd1', name: 'Dr. A', consultationFee: 100 }),
      doc({ id: 'd2', name: 'Dr. B', consultationFee: 250 })];
    const rows = deriveRevenueByDoctor(
      [
        apt({ id: 'a1', doctorId: 'd1', status: 'Completed' }),
        apt({ id: 'a2', doctorId: 'd1', status: 'Completed' }),
        apt({ id: 'a3', doctorId: 'd2', status: 'Completed' }),
        apt({ id: 'a4', doctorId: 'd2', status: 'Pending' }),
        apt({ id: 'a5', doctorId: 'd3', status: 'Completed' }),
      ],
      doctors,
    );
    expect(rows).toEqual([
      { doctor: 'Dr. B', revenue: 250 },
      { doctor: 'Dr. A', revenue: 200 },
    ]);
    expect(totalRevenue(
      [
        apt({ id: 'a1', doctorId: 'd1', status: 'Completed' }),
        apt({ id: 'a2', doctorId: 'd2', status: 'Pending' }),
      ],
      doctors,
    )).toBe(100);
  });

  it('resolves the doctor profile id from the login email', () => {
    const doctors = [doc({ id: 'd33', email: 'rajesh.kumar@medicare.health' }), doc({ id: 'd1' })];
    expect(doctorProfileId(doctors, 'rajesh.kumar@medicare.health')).toBe('d33');
    expect(doctorProfileId(doctors, 'nobody@example.com')).toBeUndefined();
    expect(doctorProfileId(doctors, undefined)).toBeUndefined();
  });
});
