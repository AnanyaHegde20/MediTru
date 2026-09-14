import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from '../store/useDataStore';

beforeEach(() => {
  useDataStore.setState({
    doctors: [],
    appointments: [],
    labReports: [],
    prescriptions: [],
    patientQueue: [],
    patientActivity: [],
  });
});

describe('useDataStore', () => {
  it('starts with empty state after reset', () => {
    const state = useDataStore.getState();
    expect(state.doctors).toHaveLength(0);
    expect(state.appointments).toHaveLength(0);
  });

  it('adds a doctor', () => {
    const doc = { id: 'd1', name: 'Dr. Test', specialty: 'Cardiology', avatar: '', available: true, rating: 5, reviewCount: 0, experienceYears: 10, consultationFee: 100, nextAvailable: 'Tomorrow', bio: '', hospital: '', education: '', slots: { morning: [], afternoon: [], evening: [] } };
    useDataStore.getState().addDoctor(doc);
    expect(useDataStore.getState().doctors).toHaveLength(1);
    expect(useDataStore.getState().doctors[0].name).toBe('Dr. Test');
  });

  it('books an appointment', () => {
    const apt = {
      id: 'a1',
      patientName: 'John',
      doctorName: 'Dr. Smith',
      date: '2026-01-01',
      time: '10:00',
      status: 'Scheduled',
      patientAvatar: '',
      type: 'Check-up',
    } as any;
    useDataStore.getState().bookAppointment(apt);
    expect(useDataStore.getState().appointments).toHaveLength(1);
  });

  it('updates queue status', () => {
    useDataStore.setState({
      patientQueue: [{ id: 'q1', patientName: 'Jane', patientAvatar: '', age: 30, status: 'Waiting', time: '10:00', waitTime: '5m', reason: 'Fever', room: '101' }],
    });
    useDataStore.getState().updateQueueStatus('q1', 'In Progress');
    expect(useDataStore.getState().patientQueue[0].status).toBe('In Progress');
  });

  it('adds a lab report', () => {
    const report = { id: 'r1', title: 'Blood Test', date: '2026-01-01', type: 'Blood Work' } as any;
    useDataStore.getState().addLabReport(report);
    expect(useDataStore.getState().labReports).toHaveLength(1);
  });
});
