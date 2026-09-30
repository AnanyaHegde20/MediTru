import {
  Appointment,
  LabReport,
  MessageThreadItem,
  Prescription,
  UserProfile,
  UserRole,
} from '../types';

export interface DerivedNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
}

export interface NotificationData {
  appointments: Appointment[];
  labReports: LabReport[];
  prescriptions: Prescription[];
  messageThreads: MessageThreadItem[];
}

function shortDate(date: string) {
  return date.replace(/,\s*\d{4}$/, '');
}

export function buildNotifications(
  role: UserRole,
  currentUser: UserProfile,
  data: NotificationData
): DerivedNotification[] {
  const items: DerivedNotification[] = [];

  if (role === 'patient') {
    data.appointments
      .filter(
        (apt) =>
          apt.patientId === currentUser.id &&
          (apt.status === 'Pending' || apt.status === 'Confirmed')
      )
      .forEach((apt) =>
        items.push({
          id: `apt-${apt.id}`,
          title: 'Appointment Reminder',
          desc: `${apt.doctorName} • ${apt.date} at ${apt.time}`,
          time: shortDate(apt.date),
        })
      );

    data.labReports
      .filter((report) => !report.patientId || report.patientId === currentUser.id)
      .forEach((report) =>
        items.push({
          id: `lab-${report.id}`,
          title: 'Lab Report Ready',
          desc: `${report.name} results are available.`,
          time: shortDate(report.date),
        })
      );

    data.prescriptions
      .filter(
        (rx) => rx.patientId === currentUser.id && rx.status === 'Refill Requested'
      )
      .forEach((rx) =>
        items.push({
          id: `rx-${rx.id}`,
          title: 'Refill Requested',
          desc: `${rx.medicationName} is waiting for review.`,
          time: rx.status,
        })
      );
  } else if (role === 'doctor') {
    data.appointments
      .filter((apt) => apt.status === 'Pending')
      .forEach((apt) =>
        items.push({
          id: `apt-${apt.id}`,
          title: 'Appointment Request',
          desc: `${apt.patientName} • ${apt.date} at ${apt.time}`,
          time: shortDate(apt.date),
        })
      );

    data.prescriptions
      .filter((rx) => rx.status === 'Refill Requested')
      .forEach((rx) =>
        items.push({
          id: `rx-${rx.id}`,
          title: 'Refill Request',
          desc: `${rx.medicationName} refill is waiting for approval.`,
          time: rx.status,
        })
      );
  } else {
    data.appointments
      .filter((apt) => apt.status === 'Pending')
      .forEach((apt) =>
        items.push({
          id: `apt-${apt.id}`,
          title: 'Pending Appointment',
          desc: `${apt.patientName} with ${apt.doctorName}`,
          time: shortDate(apt.date),
        })
      );
  }

  data.messageThreads
    .filter((thread) => thread.unread > 0)
    .forEach((thread) =>
      items.push({
        id: `thread-${thread.id}`,
        title: 'New Message',
        desc: thread.subject || `Conversation with ${thread.partnerName}`,
        time: `${thread.unread} unread`,
      })
    );

  return items;
}

export function seenStorageKey(email: string) {
  return `meditru-notifications-seen-${email}`;
}

export function readSeenIds(email: string): string[] {
  try {
    const raw = window.localStorage.getItem(seenStorageKey(email));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function writeSeenIds(email: string, ids: string[]): void {
  try {
    window.localStorage.setItem(seenStorageKey(email), JSON.stringify(ids));
  } catch {
    // storage unavailable (private mode) -> notifications stay unread in-memory
  }
}
