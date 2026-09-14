import { create } from 'zustand';
import {
  mockDoctors,
  mockAppointments,
  mockLabReports,
  mockPrescriptions,
  mockPatientQueue,
  mockRecentPatientActivity,
} from '../data/mockData';
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

  bookAppointment: (apt: Appointment) => void;
  updateQueueStatus: (id: string, status: 'Waiting' | 'In Progress' | 'Done') => void;
  addDoctor: (doc: Doctor) => void;
  addLabReport: (report: LabReport) => void;
}

export const useDataStore = create<DataStore>((set) => ({
  doctors: mockDoctors,
  appointments: mockAppointments,
  labReports: mockLabReports,
  prescriptions: mockPrescriptions,
  patientQueue: mockPatientQueue,
  patientActivity: mockRecentPatientActivity,

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
