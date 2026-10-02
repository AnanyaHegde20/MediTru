import { LabReport, MessageThreadItem, Prescription, UserProfile, UserRole } from '../types';

export interface DerivedNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
}

export interface ServerNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  readAt: string | null;
}

export interface BellNotification extends DerivedNotification {
  unread: boolean;
}

export interface NotificationData {
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

export function combineNotifications(
  server: ServerNotification[],
  client: DerivedNotification[],
  seenIds: string[]
): BellNotification[] {
  const fromServer: BellNotification[] = server.map((notification) => ({
    id: `srv-${notification.id}`,
    title: notification.title,
    desc: notification.desc,
    time: notification.time,
    unread: !notification.readAt,
  }));

  const fromClient: BellNotification[] = client.map((notification) => ({
    ...notification,
    unread: !seenIds.includes(notification.id),
  }));

  return [...fromServer, ...fromClient];
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
