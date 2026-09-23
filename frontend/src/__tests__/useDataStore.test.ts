import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDataStore } from '../store/useDataStore';

function okFetch(body: unknown) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => body,
  }));
}

function failingFetch() {
  return vi.fn(async () => {
    throw new Error('network down');
  });
}

const sampleAppointment = {
  id: '5',
  patientId: '1',
  patientName: 'John',
  doctorId: '2',
  doctorName: 'Dr. Smith',
  specialty: 'Cardiology',
  doctorAvatar: '',
  date: '2026-01-01',
  time: '10:00',
  status: 'Pending',
  patientAvatar: '',
  type: 'Check-up',
} as any;

const samplePrescription = {
  id: '3',
  patientId: '1',
  medicationName: 'Atorvastatin',
  dosage: '20 mg',
  frequency: 'Once daily',
  doctorName: 'Dr. Stone',
  specialty: 'Cardiology',
  startDate: 'Oct 01, 2024',
  endDate: 'Jan 01, 2025',
  refillsRemaining: 2,
  totalRefills: 4,
  instructions: 'Take at bedtime',
  status: 'Active',
  pharmacy: 'Walgreens',
} as any;

beforeEach(() => {
  useDataStore.setState({
    doctors: [],
    appointments: [],
    labReports: [],
    prescriptions: [],
    patientQueue: [],
    patientActivity: [],
  });
  vi.stubGlobal('fetch', failingFetch());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useDataStore', () => {
  it('starts with empty state after reset', () => {
    const state = useDataStore.getState();
    expect(state.doctors).toHaveLength(0);
    expect(state.appointments).toHaveLength(0);
  });

  it('adds a doctor', async () => {
    vi.stubGlobal('fetch', okFetch({ id: 7 }));
    const doc = { id: 'd1', name: 'Dr. Test', specialty: 'Cardiology', avatar: '', available: true, rating: 5, reviewCount: 0, experienceYears: 10, consultationFee: 100, nextAvailable: 'Tomorrow', bio: '', hospital: '', education: '', slots: { morning: [], afternoon: [], evening: [] } };
    await Promise.resolve(useDataStore.getState().addDoctor(doc));
    expect(useDataStore.getState().doctors).toHaveLength(1);
    expect(useDataStore.getState().doctors[0].name).toBe('Dr. Test');
  });

  it('books an appointment and adopts the server id', async () => {
    vi.stubGlobal('fetch', okFetch({ id: 42, status: 'Pending' }));
    const apt = { ...sampleAppointment, id: 'apt_1', status: 'Pending' } as any;
    await useDataStore.getState().bookAppointment(apt);
    expect(useDataStore.getState().appointments).toHaveLength(1);
    expect(useDataStore.getState().appointments[0].id).toBe('42');
  });

  it('rolls back a phantom appointment when persist fails', async () => {
    vi.stubGlobal('fetch', failingFetch());
    const apt = { ...sampleAppointment, id: 'apt_fail' } as any;
    await expect(useDataStore.getState().bookAppointment(apt)).rejects.toThrow();
    expect(useDataStore.getState().appointments).toHaveLength(0);
    expect(useDataStore.getState().patientActivity).toHaveLength(0);
  });

  it('updates appointment status on the server', async () => {
    vi.stubGlobal('fetch', okFetch({ id: 5, status: 'Confirmed' }));
    useDataStore.setState({ appointments: [sampleAppointment] });
    await useDataStore.getState().updateAppointmentStatus('5', 'Confirmed');
    expect(useDataStore.getState().appointments[0].status).toBe('Confirmed');
  });

  it('reverts appointment status when the update fails', async () => {
    vi.stubGlobal('fetch', failingFetch());
    useDataStore.setState({ appointments: [sampleAppointment] });
    await expect(
      useDataStore.getState().updateAppointmentStatus('5', 'Confirmed')
    ).rejects.toThrow();
    expect(useDataStore.getState().appointments[0].status).toBe('Pending');
  });

  it('requests a refill', async () => {
    vi.stubGlobal('fetch', okFetch({ id: 3, status: 'Refill Requested', refillsRemaining: 2 }));
    useDataStore.setState({ prescriptions: [samplePrescription] });
    await useDataStore.getState().requestRefill('3');
    expect(useDataStore.getState().prescriptions[0].status).toBe('Refill Requested');
  });

  it('reverts a failed refill request', async () => {
    vi.stubGlobal('fetch', failingFetch());
    useDataStore.setState({ prescriptions: [samplePrescription] });
    await expect(useDataStore.getState().requestRefill('3')).rejects.toThrow();
    expect(useDataStore.getState().prescriptions[0].status).toBe('Active');
  });

  it('approves a refill and stores the decremented counter', async () => {
    vi.stubGlobal(
      'fetch',
      okFetch({ id: 3, status: 'Active', refillsRemaining: 1 })
    );
    useDataStore.setState({
      prescriptions: [{ ...samplePrescription, status: 'Refill Requested' }],
    });
    await useDataStore.getState().updatePrescriptionStatus('3', 'Active');
    const rx = useDataStore.getState().prescriptions[0];
    expect(rx.status).toBe('Active');
    expect(rx.refillsRemaining).toBe(1);
  });

  it('updates queue status locally', async () => {
    useDataStore.setState({
      patientQueue: [{ id: 'q1', patientName: 'Jane', patientAvatar: '', age: 30, status: 'Waiting', time: '10:00', waitTime: '5m', reason: 'Fever', room: '101' }],
    });
    useDataStore.getState().updateQueueStatus('q1', 'In Progress');
    expect(useDataStore.getState().patientQueue[0].status).toBe('In Progress');
  });

  it('adds a lab report', async () => {
    vi.stubGlobal('fetch', okFetch({ id: 9 }));
    const report = { id: 'r1', title: 'Blood Test', date: '2026-01-01', type: 'Blood Work' } as any;
    await Promise.resolve(useDataStore.getState().addLabReport(report));
    expect(useDataStore.getState().labReports).toHaveLength(1);
  });
});
