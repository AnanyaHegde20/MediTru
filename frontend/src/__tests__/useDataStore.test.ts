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
    messageThreads: [],
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

  const serverThread = {
    id: 11,
    subject: null,
    partnerName: 'Doc Doctor',
    partnerRoleLabel: 'Doctor',
    partnerAvatar: '',
    updatedAt: 1700000000000,
    unread: 2,
    messages: [
      { id: 1, senderId: '2', senderName: 'Doc Doctor', text: 'Hello', createdAt: 1700000000000 },
    ],
  };

  it('fetches message threads and normalizes ids', async () => {
    vi.stubGlobal('fetch', okFetch([serverThread]));
    await useDataStore.getState().fetchMessageThreads();
    const threads = useDataStore.getState().messageThreads;
    expect(threads).toHaveLength(1);
    expect(threads[0].id).toBe('11');
    expect(threads[0].unread).toBe(2);
    expect(threads[0].messages[0].id).toBe('1');
    expect(threads[0].messages[0].createdAt).toBe(1700000000000);
  });

  it('marks a thread read when it is fetched individually', async () => {
    vi.stubGlobal('fetch', okFetch({ ...serverThread, unread: 0 }));
    useDataStore.setState({ messageThreads: [] });
    await useDataStore.getState().fetchMessageThread('11');
    expect(useDataStore.getState().messageThreads).toHaveLength(1);
    expect(useDataStore.getState().messageThreads[0].unread).toBe(0);
  });

  it('sends a message and adopts the server message id', async () => {
    vi.stubGlobal(
      'fetch',
      okFetch({ id: 99, senderId: '1', senderName: 'Pat Patient', text: 'Hi doctor', createdAt: 1700000005000 })
    );
    useDataStore.setState({
      messageThreads: [{ ...serverThread, id: '11', unread: 0, messages: [] } as any],
    });
    await useDataStore.getState().sendMessage('11', 'Hi doctor', '1');
    const msgs = useDataStore.getState().messageThreads[0].messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe('99');
    expect(msgs[0].text).toBe('Hi doctor');
  });

  it('rolls back a failed message send', async () => {
    vi.stubGlobal('fetch', failingFetch());
    useDataStore.setState({
      messageThreads: [{ ...serverThread, id: '11', unread: 0, messages: [] } as any],
    });
    await expect(useDataStore.getState().sendMessage('11', 'Hi', '1')).rejects.toThrow();
    expect(useDataStore.getState().messageThreads[0].messages).toHaveLength(0);
  });

  it('creates a conversation thread', async () => {
    vi.stubGlobal(
      'fetch',
      okFetch({ ...serverThread, id: 12, partnerName: 'New Partner', unread: 0, messages: [] })
    );
    const thread = await useDataStore.getState().createThread('New Partner');
    expect(thread.id).toBe('12');
    expect(useDataStore.getState().messageThreads).toHaveLength(1);
    expect(useDataStore.getState().messageThreads[0].partnerName).toBe('New Partner');
  });

  it('reuses an existing thread instead of duplicating it', async () => {
    vi.stubGlobal('fetch', okFetch({ ...serverThread, unread: 0, messages: [] }));
    useDataStore.setState({
      messageThreads: [{ ...serverThread, id: '11', unread: 0, messages: [] } as any],
    });
    await useDataStore.getState().createThread('Doc Doctor');
    expect(useDataStore.getState().messageThreads).toHaveLength(1);
  });

  it('surfaces the server error when creating a thread fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Partner name is required' }),
      }))
    );
    await expect(useDataStore.getState().createThread('   ')).rejects.toThrow(
      'Partner name is required'
    );
  });

  const uploadMeta = {
    patientId: '1',
    name: 'Lipid Panel',
    category: 'Lipid',
    date: 'Oct 22, 2024',
    doctorName: 'Dr. Alan Stone',
    doctorSpecialty: 'Cardiology',
    status: 'Normal' as const,
    values: [],
    aiSummary: { overview: '', keyFindings: [], attentionItems: [], recommendations: [] },
  };

  it('uploads a lab report and adds it to state', async () => {
    vi.stubGlobal(
      'fetch',
      okFetch({
        id: 5,
        patientId: '1',
        name: 'Lipid Panel',
        fileSize: '9 B',
        downloadUrl: '/api/lab-reports/5/file',
        fileName: 'abc.pdf',
        valuesJson: '[]',
        aiSummaryJson:
          '{"overview":"","keyFindings":[],"attentionItems":[],"recommendations":[]}',
      })
    );
    const file = new File(['%PDF-1.4'], 'panel.pdf', { type: 'application/pdf' });
    const report = await useDataStore.getState().uploadLabReport(file, uploadMeta);
    expect(report.id).toBe('5');
    expect(report.downloadUrl).toBe('/api/lab-reports/5/file');
    expect(useDataStore.getState().labReports).toHaveLength(1);
  });

  it('surfaces the server error when an upload fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Unsupported file type: exe (allowed: pdf, png, jpg, jpeg)',
        }),
      }))
    );
    const file = new File([new Uint8Array([1, 2, 3])], 'virus.exe');
    await expect(useDataStore.getState().uploadLabReport(file, uploadMeta)).rejects.toThrow(
      'Unsupported file type: exe'
    );
    expect(useDataStore.getState().labReports).toHaveLength(0);
  });
});
