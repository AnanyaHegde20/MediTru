import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { MessagesView } from './components/MessagesView';

// View screens matching Figma specs
import { LoginView } from './components/views/LoginView';
import { PatientDashboardView } from './components/views/PatientDashboardView';
import { DoctorDashboardView } from './components/views/DoctorDashboardView';
import { AppointmentBookingView } from './components/views/AppointmentBookingView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { MedicalRecordsView } from './components/views/MedicalRecordsView';
import { AdminDashboardView } from './components/views/AdminDashboardView';

// Modals
import { ClinicalNotesModal } from './components/modals/ClinicalNotesModal';

// Mock Data & Types
import {
  mockUsers,
  mockDoctors,
  mockAppointments,
  mockDoctorSchedule,
  mockLabReports,
  mockPrescriptions,
  mockPatientQueue,
  mockRecentPatientActivity,
} from './data/mockData';
import {
  ActiveTab,
  Appointment,
  Doctor,
  LabReport,
  PatientQueueItem,
  Prescription,
  UserProfile,
  UserRole,
} from './types';
import {
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

// URL-based role routing: /patient, /doctor, /admin open that workspace directly
const getRoleFromPath = (): UserRole | null => {
  const segment = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (segment === 'patient' || segment === 'doctor' || segment === 'admin') {
    return segment as UserRole;
  }
  return null;
};

export default function App() {
  // Current user & authentication state (seeded from the URL)
  const initialRole = getRoleFromPath();
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    initialRole ? mockUsers[initialRole] : mockUsers.patient
  );
  const [currentTab, setCurrentTab] = useState<ActiveTab>('login');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Application Data States
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [labReports, setLabReports] = useState<LabReport[]>(mockLabReports);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [patientQueue, setPatientQueue] = useState<PatientQueueItem[]>(mockPatientQueue);
  const [patientActivity, setPatientActivity] = useState(mockRecentPatientActivity);

  // Active item selections
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [aiInitialQuery, setAiInitialQuery] = useState<string | undefined>(undefined);
  const [activePatientForNotes, setActivePatientForNotes] = useState<string>('Priya Sharma');

  // Modal Visibility States
  const [showClinicalNotesModal, setShowClinicalNotesModal] = useState(false);

  // Keep UI in sync when the browser back/forward buttons are used
  useEffect(() => {
    const onPopState = () => {
      const role = getRoleFromPath();
      setCurrentUser(role ? mockUsers[role] : mockUsers.patient);
      setCurrentTab('login');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Handle Role Switch
  const handleRoleChange = (role: UserRole) => {
    if (role === 'patient') {
      setCurrentUser(mockUsers.patient);
    } else if (role === 'doctor') {
      setCurrentUser(mockUsers.doctor);
    } else {
      setCurrentUser(mockUsers.admin);
    }
  };

  // Handle Login submission
  const handleLogin = (role: UserRole) => {
    handleRoleChange(role);
    setCurrentTab('dashboard');
    window.history.pushState({ role }, '', `/${role}`);
  };

  // Handle new appointment booking
  const handleBookAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
    // Add to activity stream
    setPatientActivity((prev) => [
      {
        id: `act_${Date.now()}`,
        text: 'New consultation scheduled with',
        highlightName: newApt.doctorName,
        detail: `(${newApt.date} at ${newApt.time})`,
        timeAgo: 'Just now',
        patientAvatar: newApt.patientAvatar,
        type: 'appointment',
      },
      ...prev,
    ]);
  };

  // Handle doctor updating patient queue status
  const handleUpdateQueueStatus = (id: string, status: 'Waiting' | 'In Progress' | 'Done') => {
    setPatientQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  // Handle quick ask AI from dashboard
  const handleQuickAskAI = (query: string) => {
    setAiInitialQuery(query);
    setCurrentTab('ai-assistant');
  };

  // Handle asking AI about a specific lab report
  const handleAskAIAboutReport = (report: LabReport) => {
    setAiInitialQuery(
      `Please provide a detailed clinical review of my ${report.name} dated ${report.date}. Status is ${report.status}. What should I discuss with ${report.doctorName}?`
    );
    setCurrentTab('ai-assistant');
  };

  // Handle adding new doctor (Admin)
  const handleAddDoctor = (doc: Doctor) => {
    setDoctors((prev) => [doc, ...prev]);
  };

  // Handle logout - return to login screen and reset session state
  const handleLogout = () => {
    setCurrentUser(mockUsers.patient);
    setCurrentTab('login');
    setSelectedReport(null);
    setAiInitialQuery(undefined);
    window.history.pushState({}, '', '/');
  };

  // Render Login view directly if selected
  if (currentTab === 'login') {
    return (
      <LoginView
        role={getRoleFromPath() ?? 'patient'}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div id="medicare-app-root" className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans antialiased">
      {/* Left Desktop Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'login') {
            setCurrentTab('login');
          } else {
            setCurrentTab(tab);
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-[240px]'
        } pb-20 md:pb-8`}
      >
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          onNavigateTab={setCurrentTab}
        />

        {/* Dynamic Main Body Content Based on currentTab and Role */}
        <main className="flex-1 p-4 md:p-7 max-w-7xl w-full mx-auto">
          {/* 1. DASHBOARD VIEW (Role-Adapted) */}
          {currentTab === 'dashboard' && (
            <>
              {currentUser.role === 'patient' && (
                <PatientDashboardView
                  currentUser={currentUser}
                  appointments={appointments}
                  labReports={labReports}
                  prescriptions={prescriptions}
                  onNavigateTab={setCurrentTab}
                  onSelectReport={(rep) => {
                    setSelectedReport(rep);
                    setCurrentTab('records');
                  }}
                  onQuickAskAI={handleQuickAskAI}
                />
              )}

              {currentUser.role === 'doctor' && (
                <DoctorDashboardView
                  currentUser={currentUser}
                  schedule={appointments}
                  queue={patientQueue}
                  activity={patientActivity}
                  onOpenClinicalNotes={(patientName) => {
                    if (patientName) setActivePatientForNotes(patientName);
                    setShowClinicalNotesModal(true);
                  }}
                  onNavigateTab={setCurrentTab}
                  onUpdateQueueStatus={handleUpdateQueueStatus}
                />
              )}

              {currentUser.role === 'admin' && (
                <AdminDashboardView
                  onAddDoctor={handleAddDoctor}
                />
              )}
            </>
          )}

          {/* 2. APPOINTMENTS / BOOKING VIEW (Screen 4) */}
          {currentTab === 'appointments' && (
            <AppointmentBookingView
              doctors={doctors}
              currentUser={currentUser}
              onBookAppointment={handleBookAppointment}
              onNavigateTab={setCurrentTab}
            />
          )}

          {/* 3. AI HEALTH ASSISTANT VIEW (Screen 5) */}
          {currentTab === 'ai-assistant' && (
            <AIAssistantView
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
              initialQuery={aiInitialQuery}
            />
          )}

          {/* 4. MEDICAL RECORDS VIEW (Screen 6) */}
          {currentTab === 'records' && (
            <MedicalRecordsView
              currentUser={currentUser}
              labReports={labReports}
              prescriptions={prescriptions}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              onAskAIAboutReport={handleAskAIAboutReport}
              onAddNewReport={(newRep) => setLabReports((prev) => [newRep, ...prev])}
            />
          )}

          {/* 5. PRESCRIPTIONS DIRECTORY */}
          {currentTab === 'prescriptions' && (
            <MedicalRecordsView
              currentUser={currentUser}
              labReports={labReports}
              prescriptions={prescriptions}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              onAskAIAboutReport={handleAskAIAboutReport}
              onAddNewReport={(newRep) => setLabReports((prev) => [newRep, ...prev])}
            />
          )}

          {/* 6. PATIENTS DIRECTORY (For Doctor & Admin) */}
          {currentTab === 'patients' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Registered Patient Directory</h2>
                  <p className="text-xs text-slate-400">Manage patient charts, EHR records, and consultation history</p>
                </div>
                <button
                  onClick={() => setShowClinicalNotesModal(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Clinical Scribe</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {[
                  { name: 'Priya Sharma', age: 32, condition: 'Stage 1 Hypertension', lastVisit: 'Yesterday', doctor: 'Dr. Alan Stone', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
                  { name: 'Amit Patel', age: 45, condition: 'Type 2 Diabetes Mellitus', lastVisit: '3 days ago', doctor: 'Dr. Robert Mercer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
                  { name: 'Sneha Reddy', age: 28, condition: 'Routine Wellness / Lipidemia', lastVisit: '1 week ago', doctor: 'Dr. Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
                  { name: 'Vikram Singh', age: 52, condition: 'Coronary Artery Monitoring', lastVisit: '2 weeks ago', doctor: 'Dr. Alan Stone', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
                  { name: 'Ananya Roy', age: 39, condition: 'Hypothyroidism', lastVisit: '3 weeks ago', doctor: 'Dr. Emily Taylor', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200' },
                  { name: 'Rahul Sharma', age: 29, condition: 'Allergic Rhinitis', lastVisit: 'Today', doctor: 'Dr. Rajesh Kumar', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' },
                ].map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between">
                    <div className="flex items-start gap-3">
                      <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <div className="text-xs md:text-sm font-bold text-slate-900">{p.name} ({p.age}y)</div>
                        <div className="text-[11px] text-blue-600 font-medium">{p.condition}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Care: {p.doctor} • Last: {p.lastVisit}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedReport(labReports[0]);
                          setCurrentTab('records');
                        }}
                        className="text-[11px] font-semibold text-slate-600 hover:text-blue-600"
                      >
                        View Chart
                      </button>
                      <button
                        onClick={() => {
                          setActivePatientForNotes(p.name);
                          setShowClinicalNotesModal(true);
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>SOAP Note</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. ANALYTICS VIEW (Admin) */}
          {currentTab === 'analytics' && (
            <AdminDashboardView
              onAddDoctor={handleAddDoctor}
            />
          )}

          {/* 8. MESSAGES VIEW */}
          {currentTab === 'messages' && (
            <MessagesView currentUser={currentUser} />
          )}

          {/* 9. SETTINGS & BACKEND CONFIG VIEW */}
          {currentTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Application & Service Settings</h2>
                  <p className="text-xs text-slate-400">Configure notifications and security protocols</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Integrations</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span>Gemini 3.7 AI Health Engine</span>
                      <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[10px]">Active</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span>FHIR HL7 Diagnostic Protocol</span>
                      <span className="text-blue-700 bg-blue-100 font-bold px-2 py-0.5 rounded-full text-[10px]">Connected</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span>MongoDB 7.0 Persistence Layer</span>
                      <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[10px]">Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens) */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        role={currentUser.role}
      />

      {/* Modals */}
      {showClinicalNotesModal && (
        <ClinicalNotesModal
          patientName={activePatientForNotes}
          onClose={() => setShowClinicalNotesModal(false)}
        />
      )}
    </div>
  );
}
