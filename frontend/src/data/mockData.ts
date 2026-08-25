import {
  UserProfile,
  Doctor,
  Appointment,
  LabReport,
  Prescription,
  PatientQueueItem,
  PatientActivityItem,
  AdminKPIs,
  UserRole,
} from '../types';

export const mockUsers: Record<string, UserProfile> = {
  patient: {
    id: 'user_patient_1',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    role: 'patient',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    badge: 'Patient',
    age: 29,
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '+1 (555) 382-9012',
    allergies: ['Penicillin', 'Peanuts'],
    medicalCondition: 'Mild Hypertension, Seasonal Rhinitis',
  },
  doctor: {
    id: 'user_doc_1',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@medicare.health',
    role: 'doctor',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    badge: 'Senior Cardiologist',
    phone: '+1 (555) 902-1144',
  },
  admin: {
    id: 'user_admin_1',
    name: 'Sarah Jenkins (Admin)',
    email: 'admin@medicare.health',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    badge: 'System Administrator',
    phone: '+1 (555) 789-0011',
  },
};

export const mockDoctors: Doctor[] = [
  {
    id: 'doc_1',
    name: 'Dr. Sarah Jenkins',
    specialty: 'Dermatology',
    rating: 4.8,
    reviewCount: 142,
    experienceYears: 12,
    consultationFee: 80,
    nextAvailable: 'Tomorrow, 10:00 AM',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
    bio: 'Board-certified dermatologist specializing in clinical dermatology, skin cancer screenings, and advanced cosmetic therapies.',
    hospital: 'MediTru Central Hospital, San Francisco',
    education: 'MD from Stanford University School of Medicine',
    slots: {
      morning: ['09:00 AM', '10:00 AM', '11:30 AM'],
      afternoon: ['02:30 PM', '04:00 PM'],
      evening: ['05:30 PM', '06:15 PM'],
    },
  },
  {
    id: 'doc_2',
    name: 'Dr. Alan Stone',
    specialty: 'Cardiology',
    rating: 4.9,
    reviewCount: 230,
    experienceYears: 15,
    consultationFee: 120,
    nextAvailable: 'Tomorrow, 10:00 AM',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    bio: 'Interventional cardiologist with deep expertise in cardiovascular health, hypertension management, and preventative cardiology.',
    hospital: 'Heart & Vascular Pavilion, Suite 402',
    education: 'MD from Johns Hopkins University',
    slots: {
      morning: ['09:30 AM', '10:00 AM', '11:00 AM'],
      afternoon: ['02:00 PM', '03:30 PM', '04:45 PM'],
      evening: ['06:00 PM'],
    },
  },
  {
    id: 'doc_3',
    name: 'Dr. Robert Mercer',
    specialty: 'General Medicine',
    rating: 4.7,
    reviewCount: 98,
    experienceYears: 8,
    consultationFee: 65,
    nextAvailable: 'Tomorrow, 10:00 AM',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
    bio: 'Comprehensive primary care physician dedicated to routine checkups, chronic condition management, and diagnostic medicine.',
    hospital: 'Bayfront Family Practice Clinic',
    education: 'MD from Harvard Medical School',
    slots: {
      morning: ['08:30 AM', '10:00 AM', '11:15 AM'],
      afternoon: ['01:30 PM', '03:00 PM'],
      evening: ['05:00 PM', '06:00 PM'],
    },
  },
  {
    id: 'doc_4',
    name: 'Dr. Emily Taylor',
    specialty: 'Neurology',
    rating: 4.9,
    reviewCount: 185,
    experienceYears: 14,
    consultationFee: 140,
    nextAvailable: 'Tomorrow, 02:30 PM',
    avatar: 'https://images.unsplash.com/photo-1594824813590-754665427b36?w=200&auto=format&fit=crop&q=80',
    bio: 'Specialist in neurological disorders, migraine treatments, sleep medicine, and neuropathic wellness programs.',
    hospital: 'Pacific Neuroscience Institute',
    education: 'MD from Columbia University',
    slots: {
      morning: ['10:30 AM', '11:45 AM'],
      afternoon: ['02:30 PM', '03:45 PM', '04:30 PM'],
      evening: ['05:45 PM'],
    },
  },
  {
    id: 'doc_5',
    name: 'Dr. Arjan Dev',
    specialty: 'Orthopedics',
    rating: 4.6,
    reviewCount: 114,
    experienceYears: 10,
    consultationFee: 95,
    nextAvailable: 'Tomorrow, 02:30 PM',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
    bio: 'Orthopedic and sports medicine surgeon specializing in joint mobility, arthroscopy, and spine rehabilitation.',
    hospital: 'Metro Orthopedic & Sports Clinic',
    education: 'MS Orthopedics, MD from University of Pennsylvania',
    slots: {
      morning: ['09:00 AM', '11:00 AM'],
      afternoon: ['02:30 PM', '04:00 PM'],
      evening: ['05:15 PM'],
    },
  },
  {
    id: 'doc_6',
    name: 'Dr. Lisa Wong',
    specialty: 'Pediatrics',
    rating: 4.8,
    reviewCount: 160,
    experienceYears: 9,
    consultationFee: 75,
    nextAvailable: 'Tomorrow, 02:30 PM',
    avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=200&auto=format&fit=crop&q=80',
    bio: 'Dedicated pediatrician focused on child development, vaccination schedules, infant nutrition, and adolescent health.',
    hospital: 'Children’s Wellness Center',
    education: 'MD from UCSF School of Medicine',
    slots: {
      morning: ['09:15 AM', '10:45 AM'],
      afternoon: ['02:30 PM', '03:30 PM', '04:45 PM'],
      evening: ['05:30 PM'],
    },
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 'apt_1',
    patientId: 'user_patient_1',
    patientName: 'Priya Sharma',
    patientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    doctorId: 'doc_2',
    doctorName: 'Dr. Alan Stone',
    specialty: 'Cardiology',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    date: 'Oct 24, 2024',
    time: '10:00 AM',
    status: 'Confirmed',
    type: 'Cardiology Checkup',
    duration: '30m',
    notes: 'Follow-up on lipid panel & BP tracking.',
    room: 'Room 304',
  },
  {
    id: 'apt_2',
    patientId: 'user_patient_1',
    patientName: 'Priya Sharma',
    patientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    doctorId: 'doc_1',
    doctorName: 'Dr. Sarah Jenkins',
    specialty: 'Dermatology',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
    date: 'Nov 02, 2024',
    time: '02:30 PM',
    status: 'Pending',
    type: 'Annual Skin Assessment',
    duration: '20m',
    notes: 'Routine mole check and dry skin consultation.',
    room: 'Room 108',
  },
  {
    id: 'apt_3',
    patientId: 'user_patient_1',
    patientName: 'Priya Sharma',
    patientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    doctorId: 'doc_3',
    doctorName: 'Dr. Robert Mercer',
    specialty: 'General Medicine',
    doctorAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
    date: 'Dec 14, 2024',
    time: '09:00 AM',
    status: 'Confirmed',
    type: 'Comprehensive Annual Wellness Exam',
    duration: '45m',
    notes: 'Full preventative health checkup and routine blood work.',
    room: 'Suite 201',
  },
];

export const mockDoctorSchedule: Appointment[] = [
  {
    id: 'doc_apt_1',
    patientId: 'user_patient_1',
    patientName: 'Priya Sharma',
    patientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    doctorId: 'user_doc_1',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    date: 'Today',
    time: '09:00 AM',
    status: 'Completed',
    type: 'Follow-up checkup • Hypertension',
    duration: '15m',
    notes: 'Patient shows stable resting BP (118/78). Advised continuing low-sodium regimen.',
    room: 'Consultation Room 1',
  },
  {
    id: 'doc_apt_2',
    patientId: 'patient_2',
    patientName: 'Amit Patel',
    patientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    doctorId: 'user_doc_1',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    date: 'Today',
    time: '10:30 AM',
    status: 'In Progress',
    type: 'Consultation • Chest tightness on exertion',
    duration: '30m',
    notes: 'Stress ECG recommended. Checking cardiac troponin levels.',
    room: 'Therapy Room 4',
  },
  {
    id: 'doc_apt_3',
    patientId: 'patient_3',
    patientName: 'Vikram Singh',
    patientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    doctorId: 'user_doc_1',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    date: 'Today',
    time: '12:00 PM',
    status: 'Pending',
    type: 'Annual General Cardiology Checkup',
    duration: '20m',
    notes: 'Pre-consultation checklist completed.',
    room: 'Room 3',
  },
];

export const mockPatientQueue: PatientQueueItem[] = [
  {
    id: 'q_1',
    patientName: 'Rahul Sharma',
    patientAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    age: 42,
    time: '11:15 AM',
    waitTime: '10 min',
    reason: 'Follow-up on Holter Monitor',
    status: 'Waiting',
    room: 'Waiting Lounge A',
  },
  {
    id: 'q_2',
    patientName: 'Sneha Reddy',
    patientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    age: 36,
    time: '11:30 AM',
    waitTime: 'In therapy room',
    reason: 'Echocardiogram examination',
    status: 'In Progress',
    room: 'Room 2',
  },
  {
    id: 'q_3',
    patientName: 'Kunal Gupta',
    patientAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    age: 51,
    time: '11:45 AM',
    waitTime: 'Ready',
    reason: 'Post-op stent consultation',
    status: 'Waiting',
    room: 'Room 3',
  },
  {
    id: 'q_4',
    patientName: 'Ananya Roy',
    patientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    age: 28,
    time: '09:45 AM',
    waitTime: 'Done',
    reason: 'Prescription printed & signed',
    status: 'Done',
    room: 'Discharged',
  },
];

export const mockRecentPatientActivity: PatientActivityItem[] = [
  {
    id: 'act_1',
    text: 'Lab results uploaded for',
    highlightName: 'Priya Sharma',
    detail: '(CBC panel & Lipid Profile)',
    timeAgo: '2 hrs ago',
    type: 'lab',
  },
  {
    id: 'act_2',
    text: 'Prescription renewed for',
    highlightName: 'Vikram Singh',
    detail: '(Atorvastatin 20mg • 90-day supply)',
    timeAgo: '4 hrs ago',
    type: 'prescription',
  },
  {
    id: 'act_3',
    text: 'Message received from cardiologist care unit regarding',
    highlightName: 'Amit Patel',
    detail: 'Urgent consultation requested',
    timeAgo: 'Yesterday',
    type: 'message',
  },
  {
    id: 'act_4',
    text: 'Follow-up appointment booked by',
    highlightName: 'Rahul Sharma',
    detail: 'for Next Tuesday at 11:00 AM',
    timeAgo: '1 day ago',
    type: 'appointment',
  },
];

export const mockLabReports: LabReport[] = [
  {
    id: 'lab_1',
    name: 'Lipid Panel',
    category: 'Lipid',
    date: 'Oct 22, 2024',
    doctorName: 'Dr. Alan Stone',
    doctorSpecialty: 'Cardiology',
    status: 'Normal',
    fileSize: '1.4 MB',
    values: [
      { parameter: 'Total Cholesterol', value: '184', unit: 'mg/dL', referenceRange: '125 - 200', status: 'Normal' },
      { parameter: 'HDL (Good) Cholesterol', value: '58', unit: 'mg/dL', referenceRange: '> 50', status: 'Normal' },
      { parameter: 'LDL (Bad) Cholesterol', value: '102', unit: 'mg/dL', referenceRange: '< 100', status: 'Normal' },
      { parameter: 'Triglycerides', value: '120', unit: 'mg/dL', referenceRange: '< 150', status: 'Normal' },
      { parameter: 'Non-HDL Cholesterol', value: '126', unit: 'mg/dL', referenceRange: '< 130', status: 'Normal' },
    ],
    aiSummary: {
      overview: 'Overall cardiovascular lipid health is well within standard reference intervals.',
      keyFindings: [
        'Total cholesterol of 184 mg/dL is optimal.',
        'HDL protective level is healthy at 58 mg/dL.',
        'Triglycerides are well managed below 150 mg/dL.',
      ],
      attentionItems: [
        'LDL is slightly bordering near the target threshold of 100 mg/dL; continue cardiovascular exercise and balanced Mediterranean diet.',
      ],
      recommendations: [
        'Continue regular 30 minutes daily brisk walks.',
        'Next routine lipid screening in 12 months.',
      ],
    },
  },
  {
    id: 'lab_2',
    name: 'CBC with Differential',
    category: 'Hematology',
    date: 'Oct 18, 2024',
    doctorName: 'Dr. Robert Mercer',
    doctorSpecialty: 'General Medicine',
    status: 'Abnormal',
    fileSize: '2.1 MB',
    values: [
      { parameter: 'White Blood Cell (WBC)', value: '7.8', unit: 'x10^3/uL', referenceRange: '4.5 - 11.0', status: 'Normal' },
      { parameter: 'Red Blood Cell (RBC)', value: '4.1', unit: 'x10^6/uL', referenceRange: '4.0 - 5.2', status: 'Normal' },
      { parameter: 'Hemoglobin', value: '11.2', unit: 'g/dL', referenceRange: '12.0 - 15.5', status: 'Low' },
      { parameter: 'Hematocrit', value: '34.1', unit: '%', referenceRange: '37.0 - 48.0', status: 'Low' },
      { parameter: 'Platelets', value: '240', unit: 'x10^3/uL', referenceRange: '150 - 450', status: 'Normal' },
      { parameter: 'Mean Corpuscular Volume (MCV)', value: '78', unit: 'fL', referenceRange: '80 - 100', status: 'Low' },
    ],
    aiSummary: {
      overview: 'Mild microcytic anemia indicators detected. Hemoglobin and Hematocrit slightly lower than standard reference values.',
      keyFindings: [
        'WBC and Platelets are healthy with no signs of active acute infection or clotting anomalies.',
        'Platelet count of 240 is robust.',
      ],
      attentionItems: [
        'Hemoglobin (11.2 g/dL) is below optimal range (12.0 - 15.5 g/dL).',
        'MCV (78 fL) indicates smaller red blood cell volume, typical of mild iron deficiency.',
      ],
      recommendations: [
        'Discuss iron/ferritin level supplementation with Dr. Mercer.',
        'Incorporate iron-rich foods (spinach, lentils, lean protein, citrus with meals).',
        'Follow-up blood check in 8-12 weeks.',
      ],
    },
  },
  {
    id: 'lab_3',
    name: 'Comprehensive Metabolic Panel (CMP)',
    category: 'Metabolic',
    date: 'Oct 10, 2024',
    doctorName: 'Dr. Robert Mercer',
    doctorSpecialty: 'General Medicine',
    status: 'Normal',
    fileSize: '1.8 MB',
    values: [
      { parameter: 'Fasting Glucose', value: '92', unit: 'mg/dL', referenceRange: '70 - 99', status: 'Normal' },
      { parameter: 'Blood Urea Nitrogen (BUN)', value: '14', unit: 'mg/dL', referenceRange: '7 - 20', status: 'Normal' },
      { parameter: 'Serum Creatinine', value: '0.82', unit: 'mg/dL', referenceRange: '0.50 - 1.10', status: 'Normal' },
      { parameter: 'eGFR', value: '> 90', unit: 'mL/min/1.73m2', referenceRange: '> 60', status: 'Normal' },
      { parameter: 'Sodium', value: '140', unit: 'mmol/L', referenceRange: '135 - 145', status: 'Normal' },
      { parameter: 'Potassium', value: '4.2', unit: 'mmol/L', referenceRange: '3.5 - 5.0', status: 'Normal' },
      { parameter: 'ALT (Liver Enzyme)', value: '22', unit: 'U/L', referenceRange: '7 - 35', status: 'Normal' },
    ],
    aiSummary: {
      overview: 'Renal, hepatic, electrolyte, and glycemic parameters are completely normal and well-balanced.',
      keyFindings: [
        'Fasting glucose of 92 mg/dL demonstrates optimal metabolic function.',
        'Kidney filtration rate (eGFR > 90) and creatinine (0.82) are in ideal range.',
        'Liver enzymes (ALT 22) show pristine hepatic clearance.',
      ],
      attentionItems: [],
      recommendations: [
        'Maintain current hydration and healthy diet.',
      ],
    },
  },
  {
    id: 'lab_4',
    name: 'Thyroid Function Panel (TSH / Free T4)',
    category: 'Endocrinology',
    date: 'Sep 15, 2024',
    doctorName: 'Dr. Sarah Jenkins',
    doctorSpecialty: 'Dermatology / Internal',
    status: 'Normal',
    fileSize: '950 KB',
    values: [
      { parameter: 'TSH', value: '2.14', unit: 'uIU/mL', referenceRange: '0.45 - 4.50', status: 'Normal' },
      { parameter: 'Free T4', value: '1.28', unit: 'ng/dL', referenceRange: '0.82 - 1.77', status: 'Normal' },
    ],
    aiSummary: {
      overview: 'Thyroid hormone activity is balanced with no signs of hypothyroidism or hyperthyroidism.',
      keyFindings: ['TSH level is optimal at 2.14 uIU/mL.'],
      attentionItems: [],
      recommendations: ['Routine annual review.'],
    },
  },
];

export const mockPrescriptions: Prescription[] = [
  {
    id: 'rx_1',
    medicationName: 'Atorvastatin',
    dosage: '20 mg',
    frequency: 'Once daily at bedtime',
    doctorName: 'Dr. Alan Stone',
    specialty: 'Cardiology',
    startDate: 'Oct 01, 2024',
    endDate: 'Jan 01, 2025',
    refillsRemaining: 2,
    totalRefills: 4,
    instructions: 'Take with a glass of water. Avoid large quantities of grapefruit juice.',
    status: 'Active',
    pharmacy: 'Walgreens Pharmacy #4218, Market St.',
  },
  {
    id: 'rx_2',
    medicationName: 'Lisinopril',
    dosage: '10 mg',
    frequency: 'Once daily in the morning',
    doctorName: 'Dr. Alan Stone',
    specialty: 'Cardiology',
    startDate: 'Sep 15, 2024',
    endDate: 'Dec 15, 2024',
    refillsRemaining: 1,
    totalRefills: 3,
    instructions: 'For blood pressure maintenance. Monitor blood pressure weekly.',
    status: 'Active',
    pharmacy: 'Walgreens Pharmacy #4218, Market St.',
  },
  {
    id: 'rx_3',
    medicationName: 'Ferrous Sulfate (Iron)',
    dosage: '325 mg (65 mg elemental iron)',
    frequency: 'Once daily with Vitamin C',
    doctorName: 'Dr. Robert Mercer',
    specialty: 'General Medicine',
    startDate: 'Oct 19, 2024',
    endDate: 'Nov 19, 2024',
    refillsRemaining: 3,
    totalRefills: 3,
    instructions: 'Take with orange juice to maximize absorption. Avoid taking simultaneously with dairy/calcium.',
    status: 'Active',
    pharmacy: 'CVS Pharmacy, Pine Avenue',
  },
  {
    id: 'rx_4',
    medicationName: 'Cetirizine HCl',
    dosage: '10 mg',
    frequency: 'Once daily as needed for allergies',
    doctorName: 'Dr. Sarah Jenkins',
    specialty: 'Dermatology',
    startDate: 'Aug 10, 2024',
    endDate: 'Feb 10, 2025',
    refillsRemaining: 4,
    totalRefills: 6,
    instructions: 'Non-drowsy antihistamine for seasonal rhinitis & skin hives.',
    status: 'Active',
    pharmacy: 'CVS Pharmacy, Pine Avenue',
  },
  {
    id: 'rx_5',
    medicationName: 'Vitamin D3 (Cholecalciferol)',
    dosage: '2,000 IU',
    frequency: 'Once daily with a meal',
    doctorName: 'Dr. Robert Mercer',
    specialty: 'General Medicine',
    startDate: 'Jul 01, 2024',
    endDate: 'Dec 31, 2024',
    refillsRemaining: 2,
    totalRefills: 4,
    instructions: 'Dietary support for bone and immune vitality.',
    status: 'Active',
    pharmacy: 'Walgreens Pharmacy #4218, Market St.',
  },
];

export const mockAdminKPIs: AdminKPIs = {
  totalPatients: 3840,
  patientsGrowth: '+12.4% vs last month',
  totalDoctors: 124,
  doctorsGrowth: '+4 new onboarding this week',
  appointmentsToday: 182,
  appointmentsGrowth: '+8.1% daily clinic capacity',
  revenueThisMonth: 128450,
  revenueGrowth: '+15.2% vs target',
};

export const mockAppointmentsTrend = [
  { day: 'Day 1', appointments: 120, completed: 110 },
  { day: 'Day 5', appointments: 135, completed: 128 },
  { day: 'Day 10', appointments: 155, completed: 142 },
  { day: 'Day 15', appointments: 148, completed: 140 },
  { day: 'Day 20', appointments: 172, completed: 165 },
  { day: 'Day 25', appointments: 168, completed: 159 },
  { day: 'Day 30', appointments: 182, completed: 174 },
];

export const mockSpecialtyDistribution = [
  { specialty: 'Cardiology', count: 480, fill: '#2563EB' },
  { specialty: 'Dermatology', count: 390, fill: '#10B981' },
  { specialty: 'General Med', count: 520, fill: '#6366F1' },
  { specialty: 'Neurology', count: 280, fill: '#F59E0B' },
  { specialty: 'Orthopedics', count: 310, fill: '#EC4899' },
  { specialty: 'Pediatrics', count: 240, fill: '#8B5CF6' },
];

export const mockStatusBreakdown = [
  { name: 'Completed', value: 72, color: '#10B981' },
  { name: 'Confirmed', value: 18, color: '#2563EB' },
  { name: 'In Progress', value: 6, color: '#F59E0B' },
  { name: 'Cancelled', value: 4, color: '#EF4444' },
];

export const mockRecentAdminActivity = [
  { id: '1', patient: 'Priya Sharma', action: 'Booked Appointment', doctor: 'Dr. Alan Stone', time: '10 mins ago', status: 'Confirmed' },
  { id: '2', patient: 'Rahul Sharma', action: 'Lab Results Uploaded', doctor: 'Dr. Rajesh Kumar', time: '25 mins ago', status: 'Completed' },
  { id: '3', patient: 'Amit Patel', action: 'Consultation Started', doctor: 'Dr. Rajesh Kumar', time: '40 mins ago', status: 'In Progress' },
  { id: '4', patient: 'Sneha Reddy', action: 'Prescription Dispensed', doctor: 'Dr. Sarah Jenkins', time: '1 hr ago', status: 'Completed' },
  { id: '5', patient: 'Vikram Singh', action: 'Doctor Registered', doctor: 'Dr. Lisa Wong', time: '2 hrs ago', status: 'Completed' },
];

// ─── Secure Messaging (role-based inboxes) ───────────────────────────────

export interface ChatBubble {
  id: string;
  sender: 'self' | 'other';
  text: string;
  time: string;
}

export interface MessageThread {
  id: string;
  forRole: UserRole; // whose inbox this thread appears in
  participantName: string;
  participantRoleLabel: string;
  participantAvatar: string;
  lastTime: string;
  unread: number;
  messages: ChatBubble[];
}

export const mockMessageThreads: MessageThread[] = [
  // ── Patient inbox (Priya Sharma)
  {
    id: 'thr_pt_stone',
    forRole: 'patient',
    participantName: 'Dr. Alan Stone',
    participantRoleLabel: 'Cardiologist',
    participantAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    lastTime: '10:45 AM',
    unread: 1,
    messages: [
      { id: 'm1', sender: 'self', text: 'Hello Dr. Stone! I reviewed the lipid panel and noticed my HDL is up to 58 mg/dL. Should I continue the same dosage?', time: '10:42 AM' },
      { id: 'm2', sender: 'other', text: 'Hello Priya! Yes, your lipid panel looks steady. Keep up the morning walks and low-sodium diet. We will do a routine review next month.', time: '10:45 AM' },
    ],
  },
  {
    id: 'thr_pt_kumar',
    forRole: 'patient',
    participantName: 'Dr. Rajesh Kumar',
    participantRoleLabel: 'Internal Medicine',
    participantAvatar:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    lastTime: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'other', text: 'Please remember to bring your BP log to next session.', time: 'Yesterday' },
      { id: 'm2', sender: 'self', text: 'Noted, doctor. I have recorded readings for the full week.', time: 'Yesterday' },
    ],
  },
  {
    id: 'thr_pt_coord',
    forRole: 'patient',
    participantName: 'MediTru Care Coordinator',
    participantRoleLabel: 'Clinical Staff',
    participantAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    lastTime: 'Oct 20',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'other', text: 'Your prescription refill for Lisinopril has been approved.', time: 'Oct 20' },
      { id: 'm2', sender: 'self', text: 'Thank you! When will it be ready for pickup?', time: 'Oct 20' },
    ],
  },

  // ── Doctor inbox (Dr. Rajesh Kumar)
  {
    id: 'thr_dr_priya',
    forRole: 'doctor',
    participantName: 'Priya Sharma',
    participantRoleLabel: 'Patient • Hypertension',
    participantAvatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    lastTime: '10:42 AM',
    unread: 1,
    messages: [
      { id: 'm1', sender: 'other', text: 'Hello doctor! My HDL is up to 58 mg/dL now. Should I continue the same dosage?', time: '10:42 AM' },
      { id: 'm2', sender: 'self', text: 'Great progress Priya! Yes, continue Lisinopril 10mg and keep up the morning walks.', time: '10:45 AM' },
    ],
  },
  {
    id: 'thr_dr_vikram',
    forRole: 'doctor',
    participantName: 'Vikram Singh',
    participantRoleLabel: 'Patient • Coronary Monitoring',
    participantAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    lastTime: '9:15 AM',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'other', text: 'I felt mild chest tightness after climbing stairs today. Should I be concerned?', time: '9:10 AM' },
      { id: 'm2', sender: 'self', text: 'Monitor it and log the episodes. If it recurs at rest or worsens, come in immediately.', time: '9:15 AM' },
    ],
  },
  {
    id: 'thr_dr_sneha',
    forRole: 'doctor',
    participantName: 'Sneha Reddy',
    participantRoleLabel: 'Patient • Hypothyroidism',
    participantAvatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    lastTime: 'Mon',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'self', text: 'Your TSH report is attached in records. Levels are stable on 50mcg.', time: 'Mon' },
      { id: 'm2', sender: 'other', text: 'Thank you doctor, feeling much better this month!', time: 'Mon' },
    ],
  },

  // ── Admin inbox
  {
    id: 'thr_ad_mercer',
    forRole: 'admin',
    participantName: 'Dr. Robert Mercer',
    participantRoleLabel: 'Cardiology Dept.',
    participantAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    lastTime: '11:20 AM',
    unread: 1,
    messages: [
      { id: 'm1', sender: 'other', text: 'Two consults overlap in Room 304 tomorrow. Can we shift one to Telehealth?', time: '11:18 AM' },
      { id: 'm2', sender: 'self', text: 'Approved — moving the 2 PM slot to Telehealth Room B.', time: '11:20 AM' },
    ],
  },
  {
    id: 'thr_ad_ops',
    forRole: 'admin',
    participantName: 'Front Desk Ops',
    participantRoleLabel: 'Staff',
    participantAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    lastTime: '9:02 AM',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'other', text: 'Morning census: 42 OPD arrivals, 3 admissions pending.', time: '9:00 AM' },
      { id: 'm2', sender: 'self', text: 'Acknowledged. Route admissions to Ward C.', time: '9:02 AM' },
    ],
  },
  {
    id: 'thr_ad_billing',
    forRole: 'admin',
    participantName: 'Billing Team',
    participantRoleLabel: 'Finance',
    participantAvatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    lastTime: 'Fri',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'other', text: 'Insurance claim batch #8841 submitted — 96% clearance rate.', time: 'Fri' },
      { id: 'm2', sender: 'self', text: 'Excellent. Escalate the rejected 4% for review.', time: 'Fri' },
    ],
  },
];
