import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { MessagesView } from './components/MessagesView';

import { LoginView } from './components/views/LoginView';
import { PatientDashboardView } from './components/views/PatientDashboardView';
import { DoctorDashboardView } from './components/views/DoctorDashboardView';
import { AppointmentBookingView } from './components/views/AppointmentBookingView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { MedicalRecordsView } from './components/views/MedicalRecordsView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { PatientsDirectoryView } from './components/views/PatientsDirectoryView';
import { SettingsView } from './components/views/SettingsView';

import { ClinicalNotesModal } from './components/modals/ClinicalNotesModal';

import { useAuth } from './contexts/AuthContext';
import { useClinicalNotes } from './contexts/ClinicalNotesContext';
import { useAIAssistant } from './contexts/AIAssistantContext';
import { useDataStore } from './store/useDataStore';

// Layout wrapper for authenticated views (sidebar + navbar + mobile nav)
function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isSidebarCollapsed, toggleSidebar, handleLogout } = useAuth();
  const { showClinicalNotesModal, activePatientForNotes, closeClinicalNotes } = useClinicalNotes();

  return (
    <div id="medicare-app-root" className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans antialiased">
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-[240px]'
        } pb-20 md:pb-8`}
      >
        <Navbar currentUser={currentUser} />

        <main className="flex-1 p-4 md:p-7 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <MobileNav role={currentUser.role} />

      {showClinicalNotesModal && (
        <ClinicalNotesModal
          patientName={activePatientForNotes}
          onClose={closeClinicalNotes}
        />
      )}
    </div>
  );
}

// Patient routes
function PatientRoutes() {
  const { currentUser } = useAuth();
  const store = useDataStore();
  const { selectedReport, setSelectedReport, quickAskAI, askAIAboutReport, aiInitialQuery } = useAIAssistant();
  const { openClinicalNotes } = useClinicalNotes();

  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={
        <PatientDashboardView
          currentUser={currentUser}
          appointments={store.appointments}
          labReports={store.labReports}
          prescriptions={store.prescriptions}
          onNavigateTab={() => {}}
          onSelectReport={(rep) => {
            setSelectedReport(rep);
          }}
          onQuickAskAI={quickAskAI}
        />
      } />
      <Route path="appointments" element={
        <AppointmentBookingView
          doctors={store.doctors}
          currentUser={currentUser}
          onBookAppointment={store.bookAppointment}
          onNavigateTab={() => {}}
        />
      } />
      <Route path="records" element={
        <MedicalRecordsView
          currentUser={currentUser}
          labReports={store.labReports}
          prescriptions={store.prescriptions}
          selectedReport={selectedReport}
          onSelectReport={setSelectedReport}
          onAskAIAboutReport={askAIAboutReport}
          onAddNewReport={store.addLabReport}
        />
      } />
      <Route path="prescriptions" element={
        <MedicalRecordsView
          currentUser={currentUser}
          labReports={store.labReports}
          prescriptions={store.prescriptions}
          selectedReport={selectedReport}
          onSelectReport={setSelectedReport}
          onAskAIAboutReport={askAIAboutReport}
          onAddNewReport={store.addLabReport}
        />
      } />
      <Route path="ai-assistant" element={
        <AIAssistantView
          currentUser={currentUser}
          onNavigateTab={() => {}}
          initialQuery={aiInitialQuery}
        />
      } />
      <Route path="messages" element={<MessagesView currentUser={currentUser} />} />
      <Route path="settings" element={<SettingsView />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

// Doctor routes
function DoctorRoutes() {
  const { currentUser } = useAuth();
  const store = useDataStore();
  const { openClinicalNotes } = useClinicalNotes();

  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={
        <DoctorDashboardView
          currentUser={currentUser}
          schedule={store.appointments}
          queue={store.patientQueue}
          activity={store.patientActivity}
          onOpenClinicalNotes={openClinicalNotes}
          onNavigateTab={() => {}}
          onUpdateQueueStatus={store.updateQueueStatus}
        />
      } />
      <Route path="patients" element={
        <PatientsDirectoryView
          labReports={store.labReports}
          onSelectReport={() => {}}
          onNavigateToRecords={() => {}}
          onOpenClinicalNotes={openClinicalNotes}
        />
      } />
      <Route path="records" element={
        <MedicalRecordsView
          currentUser={currentUser}
          labReports={store.labReports}
          prescriptions={store.prescriptions}
          selectedReport={null}
          onSelectReport={() => {}}
          onAskAIAboutReport={() => {}}
          onAddNewReport={store.addLabReport}
        />
      } />
      <Route path="messages" element={<MessagesView currentUser={currentUser} />} />
      <Route path="settings" element={<SettingsView />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

// Admin routes
function AdminRoutes() {
  const { currentUser } = useAuth();
  const store = useDataStore();
  const { openClinicalNotes } = useClinicalNotes();

  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={
        <AdminDashboardView onAddDoctor={store.addDoctor} />
      } />
      <Route path="patients" element={
        <PatientsDirectoryView
          labReports={store.labReports}
          onSelectReport={() => {}}
          onNavigateToRecords={() => {}}
          onOpenClinicalNotes={openClinicalNotes}
        />
      } />
      <Route path="analytics" element={
        <AdminDashboardView onAddDoctor={store.addDoctor} />
      } />
      <Route path="messages" element={<MessagesView currentUser={currentUser} />} />
      <Route path="settings" element={<SettingsView />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

// Root: determines which role workspace to show
function RootRouter() {
  const { currentUser, handleLogin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginView onLogin={handleLogin} />} />
      <Route path="/patient/*" element={
        <AppLayout>
          <PatientRoutes />
        </AppLayout>
      } />
      <Route path="/doctor/*" element={
        <AppLayout>
          <DoctorRoutes />
        </AppLayout>
      } />
      <Route path="/admin/*" element={
        <AppLayout>
          <AdminRoutes />
        </AppLayout>
      } />
      <Route path="*" element={<Navigate to={`/${currentUser.role}`} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RootRouter />
    </BrowserRouter>
  );
}
