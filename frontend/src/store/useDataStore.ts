import { create } from 'zustand';
import {
  Appointment,
  Doctor,
  LabReport,
  MessageItem,
  MessageThreadItem,
  PatientActivityItem,
  PatientQueueItem,
  Prescription,
  UserProfile,
  UserRole,
} from '../types';
import { apiFetch } from '../lib/api';

interface DataStore {
  doctors: Doctor[];
  appointments: Appointment[];
  labReports: LabReport[];
  prescriptions: Prescription[];
  patients: UserProfile[];
  users: UserProfile[];
  patientQueue: PatientQueueItem[];
  patientActivity: PatientActivityItem[];
  messageThreads: MessageThreadItem[];

  fetchDoctors: () => Promise<void>;
  fetchAppointments: (patientId?: string, doctorId?: string) => Promise<void>;
  fetchLabReports: (patientId?: string) => Promise<void>;
  fetchPrescriptions: (patientId?: string) => Promise<void>;
  fetchPatients: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchPatientQueue: (doctorId?: string) => Promise<void>;
  fetchMessageThreads: () => Promise<void>;
  fetchMessageThread: (id: string) => Promise<void>;

  createUser: (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<UserProfile>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  bookAppointment: (apt: Appointment) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  updateQueueStatus: (id: string, status: 'Waiting' | 'In Progress' | 'Done') => void;
  requestRefill: (id: string) => Promise<void>;
  updatePrescriptionStatus: (id: string, status: Prescription['status']) => Promise<void>;
  createPrescription: (rx: Omit<Prescription, 'id'>) => Promise<Prescription>;
  sendMessage: (threadId: string, text: string, senderId: string) => Promise<void>;
  createThread: (
    partnerName: string,
    opts?: { partnerRoleLabel?: string; partnerAvatar?: string }
  ) => Promise<MessageThreadItem>;
  uploadLabReport: (
    file: File,
    meta: {
      patientId: string;
      name: string;
      category: string;
      date: string;
      doctorName: string;
      doctorSpecialty: string;
      status: 'Normal' | 'Abnormal';
      values: LabReport['values'];
      aiSummary: LabReport['aiSummary'];
    }
  ) => Promise<LabReport>;
  addDoctor: (doc: Doctor) => void;
  createDoctorProfile: (doc: Omit<Doctor, 'id'>) => Promise<Doctor>;
  updateDoctor: (id: string, doc: Doctor) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
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
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `POST ${path} failed: ${res.status}`);
  }
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

async function readErrorMessage(res: Response, fallback: string) {
  const text = await res.text().catch(() => '');
  if (!text.trim()) return fallback;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === 'string') return parsed.error;
  } catch {
    return text.trim();
  }
  return fallback;
}

function isServerId(id: string) {
  return /^\d+$/.test(id);
}

function appointmentToPayload(apt: Appointment) {
  const { id: _id, ...rest } = apt;
  return rest;
}

function doctorToPayload(doc: Omit<Doctor, 'id'> & { id?: string }) {
  const { id: _id, slots, ...rest } = doc;
  return {
    ...rest,
    slotsJson: JSON.stringify(slots ?? { morning: [], afternoon: [], evening: [] }),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDoctor(d: any): Doctor {
  let slots: Doctor['slots'] = { morning: [], afternoon: [], evening: [] };
  if (d.slotsJson) {
    try {
      const parsed = JSON.parse(d.slotsJson);
      slots = {
        morning: Array.isArray(parsed.morning) ? parsed.morning : [],
        afternoon: Array.isArray(parsed.afternoon) ? parsed.afternoon : [],
        evening: Array.isArray(parsed.evening) ? parsed.evening : [],
      };
    } catch {
      // keep default empty slots if stored JSON is invalid
    }
  }
  return { ...d, id: String(d.id), slots };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUser(u: any): UserProfile {
  return {
    ...u,
    id: String(u.id),
    avatar: u.avatar ?? '',
    badge: u.badge ?? u.role,
    allergies:
      typeof u.allergies === 'string'
        ? u.allergies
            .split(',')
            .map((item: string) => item.trim())
            .filter(Boolean)
        : Array.isArray(u.allergies)
          ? u.allergies
          : [],
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeThread(t: any): MessageThreadItem {
  return {
    id: String(t.id),
    subject: t.subject ?? null,
    partnerName: t.partnerName ?? '',
    partnerRoleLabel: t.partnerRoleLabel ?? '',
    partnerAvatar: t.partnerAvatar ?? '',
    updatedAt: Number(t.updatedAt ?? 0),
    unread: Number(t.unread ?? 0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: (t.messages ?? []).map((m: any): MessageItem => ({
      id: String(m.id),
      senderId: String(m.senderId),
      senderName: m.senderName ?? '',
      text: m.text ?? '',
      createdAt: Number(m.createdAt ?? 0),
    })),
  };
}

function upsertThread(
  threads: MessageThreadItem[],
  thread: MessageThreadItem
): MessageThreadItem[] {
  return threads.some((t) => t.id === thread.id)
    ? threads.map((t) => (t.id === thread.id ? thread : t))
    : [thread, ...threads];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLabReport(r: any): LabReport {
  return {
    ...r,
    id: String(r.id),
    values: r.valuesJson ? JSON.parse(r.valuesJson) : [],
    aiSummary: r.aiSummaryJson
      ? JSON.parse(r.aiSummaryJson)
      : { overview: '', keyFindings: [], attentionItems: [], recommendations: [] },
  };
}

export const useDataStore = create<DataStore>((set, get) => ({
  doctors: [],
  appointments: [],
  labReports: [],
  prescriptions: [],
  patients: [],
  users: [],
  patientQueue: [],
  patientActivity: [],
  messageThreads: [],

  fetchDoctors: async () => {
    try {
      const res = await apiFetch(apiUrl('/api/doctors'));
      if (res.ok) {
        const data = await res.json();
        set({ doctors: data.map(normalizeDoctor) });
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

  createPrescription: async (rx) => {
    const created = await postJson('/api/prescriptions', rx);
    const normalized = {
      ...created,
      id: String(created.id),
      status: created.status === 'Refill Requested' ? 'Refill Requested' : created.status,
    };
    set((state) => ({ prescriptions: [normalized, ...state.prescriptions] }));
    return normalized;
  },

  fetchPatients: async () => {
    try {
      const res = await apiFetch(apiUrl('/api/patients'));
      if (res.ok) {
        const data = await res.json();
        const patients = data.map((p: any) => ({
          ...p,
          id: String(p.id),
          role: 'patient' as const,
          avatar: p.avatar ?? '',
          badge: p.badge ?? '',
        }));
        set({ patients });
      }
    } catch (e) {
      console.warn('Failed to fetch patients, using empty list');
    }
  },

  fetchUsers: async () => {
    try {
      const res = await apiFetch(apiUrl('/api/users'));
      if (res.ok) {
        const data = await res.json();
        set({ users: data.map(normalizeUser) });
      }
    } catch (e) {
      console.warn('Failed to fetch users, using empty list');
    }
  },

  createUser: async (input) => {
    const res = await apiFetch(apiUrl('/api/users'), {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, `POST /api/users failed: ${res.status}`));
    }
    const created = normalizeUser(await res.json());
    set((state) => ({ users: [created, ...state.users] }));
    return created;
  },

  updateUserRole: async (id, role) => {
    const res = await apiFetch(apiUrl(`/api/users/${id}`), {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, `PUT /api/users/${id} failed: ${res.status}`));
    }
    const updated = normalizeUser(await res.json());
    set((state) => ({ users: state.users.map((u) => (u.id === id ? updated : u)) }));
  },

  deleteUser: async (id) => {
    const res = await apiFetch(apiUrl(`/api/users/${id}`), { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, `DELETE /api/users/${id} failed: ${res.status}`));
    }
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
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

  fetchMessageThreads: async () => {
    try {
      const res = await apiFetch(apiUrl('/api/messages/threads'));
      if (res.ok) {
        const data = await res.json();
        set({ messageThreads: data.map(normalizeThread) });
      }
    } catch (e) {
      console.warn('Failed to fetch message threads');
    }
  },

  fetchMessageThread: async (id) => {
    try {
      const res = await apiFetch(apiUrl(`/api/messages/threads/${id}`));
      if (res.ok) {
        const thread = normalizeThread(await res.json());
        set((state) => ({ messageThreads: upsertThread(state.messageThreads, thread) }));
      }
    } catch (e) {
      console.warn('Failed to fetch message thread');
    }
  },

  bookAppointment: async (apt) => {
    const activityId = `act_${Date.now()}`;
    set((state) => ({
      appointments: [apt, ...state.appointments],
      patientActivity: [
        {
          id: activityId,
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
          a.id === apt.id ? { ...a, id: String(created.id), status: created.status ?? a.status } : a
        ),
      }));
    } catch (e) {
      set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== apt.id),
        patientActivity: state.patientActivity.filter((act) => act.id !== activityId),
      }));
      console.warn('Failed to persist appointment', e);
      throw e;
    }
  },

  updateAppointmentStatus: async (id, status) => {
    const snapshot = get().appointments;
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
    try {
      const updated = await putJson(`/api/appointments/${id}`, { status });
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id
            ? {
                ...a,
                ...(updated || {}),
                id: updated?.id != null ? String(updated.id) : a.id,
                status: updated?.status || status,
              }
            : a
        ),
      }));
    } catch (e) {
      set({ appointments: snapshot });
      throw e;
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

  requestRefill: async (id) => {
    const snapshot = get().prescriptions;
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        p.id === id ? { ...p, status: 'Refill Requested' } : p
      ),
    }));
    try {
      const updated = await postJson(`/api/prescriptions/${id}/refill`, {});
      set((state) => ({
        prescriptions: state.prescriptions.map((p) =>
          p.id === id
            ? { ...p, ...(updated || {}), id: updated?.id != null ? String(updated.id) : p.id }
            : p
        ),
      }));
    } catch (e) {
      set({ prescriptions: snapshot });
      throw e;
    }
  },

  updatePrescriptionStatus: async (id, status) => {
    const snapshot = get().prescriptions;
    set((state) => ({
      prescriptions: state.prescriptions.map((p) => (p.id === id ? { ...p, status } : p)),
    }));
    try {
      const updated = await putJson(`/api/prescriptions/${id}`, { status });
      set((state) => ({
        prescriptions: state.prescriptions.map((p) =>
          p.id === id
            ? {
                ...p,
                ...(updated || {}),
                id: updated?.id != null ? String(updated.id) : p.id,
                status: updated?.status || status,
              }
            : p
        ),
      }));
    } catch (e) {
      set({ prescriptions: snapshot });
      throw e;
    }
  },

  sendMessage: async (threadId, text, senderId) => {
    const tmpId = `tmp_${Date.now()}`;
    const optimistic: MessageItem = {
      id: tmpId,
      senderId,
      senderName: '',
      text,
      createdAt: Date.now(),
    };
    const snapshot = get().messageThreads;
    set((state) => ({
      messageThreads: state.messageThreads.map((t) =>
        t.id === threadId
          ? { ...t, messages: [...t.messages, optimistic], updatedAt: optimistic.createdAt }
          : t
      ),
    }));
    try {
      const created = await postJson(`/api/messages/threads/${threadId}/messages`, { text });
      set((state) => ({
        messageThreads: state.messageThreads.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === tmpId
                    ? {
                        id: String(created.id),
                        senderId: String(created.senderId),
                        senderName: created.senderName ?? '',
                        text: created.text,
                        createdAt: Number(created.createdAt),
                      }
                    : m
                ),
              }
            : t
        ),
      }));
    } catch (e) {
      set({ messageThreads: snapshot });
      throw e;
    }
  },

  createThread: async (partnerName, opts) => {
    const created = await postJson('/api/messages/threads', {
      partnerName,
      ...(opts?.partnerRoleLabel ? { partnerRoleLabel: opts.partnerRoleLabel } : {}),
      ...(opts?.partnerAvatar ? { partnerAvatar: opts.partnerAvatar } : {}),
    });
    const thread = normalizeThread(created);
    set((state) => ({ messageThreads: upsertThread(state.messageThreads, thread) }));
    return thread;
  },

  uploadLabReport: async (file, meta) => {
    const form = new FormData();
    form.append('file', file);
    form.append('patientId', meta.patientId);
    form.append('name', meta.name);
    form.append('category', meta.category);
    form.append('date', meta.date);
    form.append('doctorName', meta.doctorName);
    form.append('doctorSpecialty', meta.doctorSpecialty);
    form.append('status', meta.status);
    form.append('valuesJson', JSON.stringify(meta.values));
    form.append('aiSummaryJson', JSON.stringify(meta.aiSummary));

    const res = await apiFetch(apiUrl('/api/lab-reports/upload'), {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `Upload failed: ${res.status}`);
    }
    const report = normalizeLabReport(await res.json());
    set((state) => ({
      labReports: [report, ...state.labReports.filter((r) => r.id !== report.id)],
    }));
    return report;
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

  createDoctorProfile: async (doc) => {
    const created = await postJson('/api/doctors', doctorToPayload(doc));
    const normalized = normalizeDoctor(created);
    set((state) => ({ doctors: [normalized, ...state.doctors] }));
    return normalized;
  },

  updateDoctor: async (id, doc) => {
    const res = await apiFetch(apiUrl(`/api/doctors/${id}`), {
      method: 'PUT',
      body: JSON.stringify(doctorToPayload(doc)),
    });
    if (!res.ok) {
      let message = `Could not save availability (${res.status})`;
      try {
        const text = await res.text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            message = parsed?.error || message;
          } catch {
            message = text;
          }
        }
      } catch {
        // keep default message when the body cannot be read
      }
      throw new Error(message);
    }
    const updated = await res.json().catch(() => null);
    const normalized = updated ? normalizeDoctor(updated) : { ...doc, id };
    set((state) => ({
      doctors: state.doctors.map((d) => (d.id === id ? normalized : d)),
    }));
  },

  deleteDoctor: async (id) => {
    const res = await apiFetch(apiUrl(`/api/doctors/${id}`), { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      throw new Error(await readErrorMessage(res, 'Could not delete the doctor.'));
    }
    set((state) => ({ doctors: state.doctors.filter((d) => d.id !== id) }));
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
