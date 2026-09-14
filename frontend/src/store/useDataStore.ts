import { create } from 'zustand';
import {
  Appointment,
  Doctor,
  LabReport,
  PatientActivityItem,
  PatientQueueItem,
  Prescription,
} from '../types';

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

export const useDataStore = create<DataStore>((set, get) => ({
  doctors: [],
  appointments: [],
  labReports: [],
  prescriptions: [],
  patientQueue: [],
  patientActivity: [],

  fetchDoctors: async () => {
    try {
      const res = await fetch(apiUrl('/api/doctors'));
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
      const res = await fetch(apiUrl(url));
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
      const res = await fetch(apiUrl(url));
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
      const res = await fetch(apiUrl(url));
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
      const res = await fetch(apiUrl(url));
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

  bookAppointment: (apt) =>
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
    })),

  updateQueueStatus: (id, status) =>
    set((state) => ({
      patientQueue: state.patientQueue.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    })),

  addDoctor: (doc) =>
    set((state) => ({
      doctors: [doc, ...state.doctors],
    })),

  addLabReport: (report) =>
    set((state) => ({
      labReports: [report, ...state.labReports],
    })),
}));
