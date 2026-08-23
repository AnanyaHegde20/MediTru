export type UserRole = 'patient' | 'doctor' | 'admin';

export type ActiveTab =
  | 'login'
  | 'dashboard'
  | 'appointments'
  | 'records'
  | 'ai-assistant'
  | 'prescriptions'
  | 'messages'
  | 'patients'
  | 'analytics'
  | 'settings'
  | 'design-system'
  | 'architecture';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  badge: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  allergies?: string[];
  medicalCondition?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  consultationFee: number;
  nextAvailable: string;
  avatar: string;
  bio: string;
  hospital: string;
  education: string;
  slots: {
    morning: string[];
    afternoon: string[];
    evening: string[];
  };
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  doctorAvatar: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  type: string;
  duration?: string;
  notes?: string;
  room?: string;
}

export interface LabReportValue {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'Normal' | 'High' | 'Low';
}

export interface LabReport {
  id: string;
  name: string;
  category: 'Hematology' | 'Lipid' | 'Metabolic' | 'Endocrinology' | 'Cardiology' | 'Imaging';
  date: string;
  doctorName: string;
  doctorSpecialty: string;
  status: 'Normal' | 'Abnormal';
  fileSize: string;
  downloadUrl?: string;
  values: LabReportValue[];
  aiSummary: {
    overview: string;
    keyFindings: string[];
    attentionItems: string[];
    recommendations: string[];
  };
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  doctorName: string;
  specialty: string;
  startDate: string;
  endDate: string;
  refillsRemaining: number;
  totalRefills: number;
  instructions: string;
  status: 'Active' | 'Refill Requested' | 'Expired';
  pharmacy: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'doctor';
  text: string;
  timestamp: string;
  isUrgent?: boolean;
  actionCta?: {
    label: string;
    action: 'book_appointment' | 'view_record' | 'call_clinic';
    payload?: string;
  };
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  timestamp: string;
  text: string;
  isRead: boolean;
  attachment?: string;
}

export interface PatientQueueItem {
  id: string;
  patientName: string;
  patientAvatar: string;
  age: number;
  time: string;
  waitTime: string;
  reason: string;
  status: 'Waiting' | 'In Progress' | 'Done';
  room: string;
}

export interface PatientActivityItem {
  id: string;
  text: string;
  highlightName: string;
  detail: string;
  timeAgo: string;
  patientAvatar?: string;
  type: 'lab' | 'prescription' | 'message' | 'appointment';
}

export interface AdminKPIs {
  totalPatients: number;
  patientsGrowth: string;
  totalDoctors: number;
  doctorsGrowth: string;
  appointmentsToday: number;
  appointmentsGrowth: string;
  revenueThisMonth: number;
  revenueGrowth: string;
}
