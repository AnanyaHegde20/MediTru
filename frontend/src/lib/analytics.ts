import { Appointment, Doctor } from '../types';

export const STATUS_COLORS: Record<string, string> = {
  Completed: '#10B981',
  Confirmed: '#2563EB',
  Pending: '#F59E0B',
  'In Progress': '#6366F1',
  Cancelled: '#EF4444',
};

export const SPECIALTY_COLORS = ['#2563EB', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];

export const parseAppointmentDate = (date: string) => {
  const time = Date.parse(date);
  return Number.isNaN(time) ? 0 : time;
};

export interface TrendPoint {
  day: string;
  appointments: number;
  completed: number;
}

export const deriveAppointmentsTrend = (appointments: Appointment[]): TrendPoint[] => {
  const byDate = new Map<string, { total: number; completed: number }>();
  for (const a of appointments) {
    const entry = byDate.get(a.date) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (a.status === 'Completed') entry.completed += 1;
    byDate.set(a.date, entry);
  }
  return [...byDate.entries()]
    .sort((a, b) => parseAppointmentDate(a[0]) - parseAppointmentDate(b[0]))
    .slice(-7)
    .map(([date, counts]) => ({
      day: date.replace(/,\s*\d{4}$/, ''),
      appointments: counts.total,
      completed: counts.completed,
    }));
};

export interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

export const deriveStatusBreakdown = (appointments: Appointment[]): StatusSlice[] => {
  if (appointments.length === 0) return [];
  const counts = new Map<string, number>();
  for (const a of appointments) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({
    name,
    value: Math.round((count / appointments.length) * 100),
    color: STATUS_COLORS[name] ?? '#94A3B8',
  }));
};

export interface SpecialtyBar {
  specialty: string;
  count: number;
  fill: string;
}

export const deriveSpecialtyDistribution = (appointments: Appointment[]): SpecialtyBar[] => {
  const counts = new Map<string, number>();
  for (const a of appointments) {
    if (a.status === 'Cancelled') continue;
    const key = a.specialty || 'General';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([specialty, count], index) => ({
      specialty,
      count,
      fill: SPECIALTY_COLORS[index % SPECIALTY_COLORS.length],
    }));
};

export interface DoctorRevenue {
  doctor: string;
  revenue: number;
}

export const deriveRevenueByDoctor = (
  appointments: Appointment[],
  doctors: Doctor[],
): DoctorRevenue[] => {
  const totals = new Map<string, number>();
  for (const a of appointments) {
    if (a.status !== 'Completed') continue;
    const doc = doctors.find((d) => d.id === a.doctorId);
    if (!doc) continue;
    totals.set(doc.name, (totals.get(doc.name) ?? 0) + Number(doc.consultationFee || 0));
  }
  return [...totals.entries()]
    .map(([doctor, revenue]) => ({ doctor, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
};

export const totalRevenue = (appointments: Appointment[], doctors: Doctor[]): number =>
  appointments
    .filter((a) => a.status === 'Completed')
    .reduce((sum, a) => {
      const doc = doctors.find((d) => d.id === a.doctorId);
      return sum + (doc ? Number(doc.consultationFee || 0) : 0);
    }, 0);

export const doctorProfileId = (doctors: Doctor[], email?: string): string | undefined => {
  if (!email) return undefined;
  return doctors.find((d) => d.email && d.email === email)?.id;
};
