import { create } from 'zustand';
import {
  Appointment,
  Doctor,
  LabReport,
  PatientActivityItem,
  PatientQueueItem,
  Prescription,
} from '../types';
import { apiFetch } from '../lib/api';

interface DataStore {
  doctors: Doctor[];
  appointments: Appointment[];
  labReports: LabReport[];
  prescriptions: Prescription[];
  patientQueue: PatientQueueItem[];
  patientActivity: PatientActivityItem[];

  fetchDoctors: () => Promise<void>;
  fetchAppointments: (patientId?: string, doctorId?: string) => Promise<void>;
  fetchLabReports: (patientId?: string) => Promise<void>;
  fetchPrescriptions: (patientId?: string) => Promise<void>;
  fetchPatientQueue: (doctorId?: string) => Promise<void>;

  bookAppointment: (apt: Appointment) => void;
  updateQueueStatus: (id: string, status: 'Waiting' | 'In Progress' | 'Done') => void;
  addDoctor: (doc: Doctor) => void;
  addLabReport: (report: LabReport) => void;
}

function apiUrl(path: string) {
  return path;
}

async function postJson(path: string, body: unknown) {
  const res = await apiFetch(apiUrl(path), {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function putJson(path: string, body: unknown) {
  const res = await apiFetch(apiUrl(path), {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json().catch(() => null);
}

function isServerId(id: string) {
  return /^\d+$/.test(id);
}

function appointmentToPayload(apt: Appointment) {
  const { id: _id, ...rest } = apt;
  return rest;
}

function doctorToPayload(doc: Doctor) {
  const { id: _id, slots, ...rest } = doc;
  return {
    ...rest,
    slotsJson: JSON.stringify(slots ?? { morning: [], afternoon: [], evening: [] }),
  };
}

function labReportToPayload(report: LabReport) {
  const { id: _id, values, aiSummary, ...rest } = report;
  return {
    ...rest,
    patientId: report.patientId ?? 'unknown',
    valuesJson: JSON.stringify(values ?? []),
    aiSummaryJson: JSON.stringify(
      aiSummary ?? { overview: '', keyFindings: [], attentionItems: [], recommendations: [] }
    ),
  };
}

export const useDataStore = create<DataStore>((set, get) => ({
  doctors: [],
  appointments: [],
  labReports: [],
  prescriptions: [],
  patientQueue: [],
  patientActivity: [],

  fetchDoctors: async () => {
    try {
      const res = await apiFetch(apiUrl('/api/doctors'));
      if (res.ok) {
        const data = await res.json();
        const doctors = data.map((d: any) => ({
          ...d,
          id: String(d.id),
          slots: d.slotsJson ? JSON.parse(d.slotsJson) : { morning: [], afternoon: [], evening: [] },
        }));
        set({ doctors });
      }
    } catch (e) {
      console.warn('Failed to fetch doctors, using empty list');
    }
  },

  fetchAppointments: async (patientId, doctorId) => {
    try {
      let url = '/api/appointments?';
      if (patientId) url += `patientId=${patientId}`;
      else if (doctorId) url += `doctorId=${doctorId}`;
      else url = '/api/appointments';
      const res = await apiFetch(apiUrl(url));
      if (res.ok) {
        const data = await res.json();
        const appointments = data.map((a: any) => ({
          ...a,
          id: String(a.id),
          status: a.status === 'In Progress' ? 'In Progress' : a.status,
        }));
        set({ appointments });
      }
    } catch (e) {
      console.warn('Failed to fetch appointments');
    }
  },

  fetchLabReports: async (patientId) => {
    try {
      const url = patientId ? `/api/lab-reports?patientId=${patientId}` : '/api/lab-reports';
      const res = await apiFetch(apiUrl(url));
      if (res.ok) {
        const data = await res.json();
        const labReports = data.map((r: any) => ({
          ...r,
          id: String(r.id),
          status: r.status === 'Abnormal' ? 'Abnormal' : 'Normal',
          category: r.category as LabReport['category'],
          values: r.valuesJson ? JSON.parse(r.valuesJson) : [],
          aiSummary: r.aiSummaryJson ? JSON.parse(r.aiSummaryJson) : { overview: '', keyFindings: [], attentionItems: [], recommendations: [] },
        }));
        set({ labReports });
      }
    } catch (e) {
      console.warn('Failed to fetch lab reports');
    }
  },

  fetchPrescriptions: async (patientId) => {
    try {
      const url = patientId ? `/api/prescriptions?patientId=${patientId}` : '/api/prescriptions';
      const res = await apiFetch(apiUrl(url));
      if (res.ok) {
        const data = await res.json();
        const prescriptions = data.map((p: any) => ({
          ...p,
          id: String(p.id),
          status: p.status === 'Refill Requested' ? 'Refill Requested' : p.status,
        }));
        set({ prescriptions });
      }
    } catch (e) {
      console.warn('Failed to fetch prescriptions');
    }
  },

  fetchPatientQueue: async (doctorId) => {
    try {
      const url = doctorId ? `/api/patient-queue?doctorId=${doctorId}` : '/api/patient-queue';
      const res = await apiFetch(apiUrl(url));
      if (res.ok) {
        const data = await res.json();
        const patientQueue = data.map((q: any) => ({
          ...q,
          id: String(q.id),
          status: q.status === 'In Progress' ? 'In Progress' : q.status,
        }));
        set({ patientQueue });
      }
    } catch (e) {
      console.warn('Failed to fetch patient queue');
    }
  },

  bookAppointment: async (apt) => {
    set((state) => ({
      appointments: [apt, ...state.appointments],
      patientActivity: [
        {
          id: `act_${Date.now()}`,
          text: 'New consultation scheduled with',
          highlightName: apt.doctorName,
          detail: `(${apt.date} at ${apt.time})`,
          timeAgo: 'Just now',
          patientAvatar: apt.patientAvatar,
          type: 'appointment' as const,
        },
        ...state.patientActivity,
      ],
    }));
    try {
      const created = await postJson('/api/appointments', appointmentToPayload(apt));
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === apt.id ? { ...a, id: String(created.id) } : a
        ),
      }));
    } catch (e) {
      console.warn('Failed to persist appointment', e);
    }
  },

  updateQueueStatus: async (id, status) => {
    set((state) => ({
      patientQueue: state.patientQueue.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    }));
    if (!isServerId(id)) return;
    try {
      await putJson(`/api/patient-queue/${id}`, { status });
    } catch (e) {
      console.warn('Failed to persist queue status', e);
    }
  },

  addDoctor: async (doc) => {
    set((state) => ({
      doctors: [doc, ...state.doctors],
    }));
    try {
      const created = await postJson('/api/doctors', doctorToPayload(doc));
      set((state) => ({
        doctors: state.doctors.map((d) =>
          d.id === doc.id ? { ...d, id: String(created.id) } : d
        ),
      }));
    } catch (e) {
      console.warn('Failed to persist doctor', e);
    }
  },

  addLabReport: async (report) => {
    set((state) => ({
      labReports: [report, ...state.labReports],
    }));
    try {
      const created = await postJson('/api/lab-reports', labReportToPayload(report));
      set((state) => ({
        labReports: state.labReports.map((r) =>
          r.id === report.id ? { ...r, id: String(created.id) } : r
        ),
      }));
    } catch (e) {
      console.warn('Failed to persist lab report', e);
    }
  },
}));
