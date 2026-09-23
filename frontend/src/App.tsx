import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { MessagesView } from './components/MessagesView';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';

import { LoginView } from './components/views/LoginView';
import { PatientDashboardView } from './components/views/PatientDashboardView';
import { DoctorDashboardView } from './components/views/DoctorDashboardView';
import { AppointmentBookingView } from './components/views/AppointmentBookingView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { MedicalRecordsView } from './components/views/MedicalRecordsView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { PatientsDirectoryView } from './components/views/PatientsDirectoryView';
import { AppointmentsListView } from './components/views/AppointmentsListView';
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

  if (!currentUser) return null;

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

  useEffect(() => {
    store.fetchDoctors();
    store.fetchAppointments(undefined, undefined);
    store.fetchLabReports(undefined);
    store.fetchPrescriptions(undefined);
  }, []);

  if (!currentUser) return null;

  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={
        <RouteErrorBoundary>
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
        </RouteErrorBoundary>
      } />
      <Route path="appointments" element={
        <RouteErrorBoundary>
        <AppointmentBookingView
          doctors={store.doctors}
          currentUser={currentUser}
          onBookAppointment={store.bookAppointment}
          onNavigateTab={() => {}}
        />
        </RouteErrorBoundary>
      } />
      <Route path="records" element={
        <RouteErrorBoundary>
        <MedicalRecordsView
          currentUser={currentUser}
          labReports={store.labReports}
          prescriptions={store.prescriptions}
          selectedReport={selectedReport}
          onSelectReport={setSelectedReport}
          onAskAIAboutReport={askAIAboutReport}
          onAddNewReport={store.addLabReport}
        />
        </RouteErrorBoundary>
      } />
      <Route path="prescriptions" element={
        <RouteErrorBoundary>
        <MedicalRecordsView
          currentUser={currentUser}
          labReports={store.labReports}
          prescriptions={store.prescriptions}
          selectedReport={selectedReport}
          onSelectReport={setSelectedReport}
          onAskAIAboutReport={askAIAboutReport}
          onAddNewReport={store.addLabReport}
        />
        </RouteErrorBoundary>
      } />
      <Route path="ai-assistant" element={
        <RouteErrorBoundary>
        <AIAssistantView
          currentUser={currentUser}
          onNavigateTab={() => {}}
          initialQuery={aiInitialQuery}
        />
        </RouteErrorBoundary>
      } />
      <Route path="messages" element={<RouteErrorBoundary><MessagesView currentUser={currentUser} /></RouteErrorBoundary>} />
      <Route path="settings" element={<RouteErrorBoundary><SettingsView /></RouteErrorBoundary>} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

// Doctor routes
function DoctorRoutes() {
  const { currentUser } = useAuth();
  const store = useDataStore();
  const { openClinicalNotes } = useClinicalNotes();
  const { aiInitialQuery } = useAIAssistant();

  useEffect(() => {
    store.fetchAppointments(undefined, undefined);
    store.fetchPatientQueue(undefined);
    store.fetchLabReports(undefined);
    store.fetchPrescriptions(undefined);
  }, []);

  if (!currentUser) return null;

  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={
        <RouteErrorBoundary>
        <DoctorDashboardView
          currentUser={currentUser}
          schedule={store.appointments}
          queue={store.patientQueue}
          activity={store.patientActivity}
          onOpenClinicalNotes={openClinicalNotes}
          onNavigateTab={() => {}}
          onUpdateQueueStatus={store.updateQueueStatus}
        />
        </RouteErrorBoundary>
      } />
      <Route path="patients" element={
        <RouteErrorBoundary>
        <PatientsDirectoryView
          labReports={store.labReports}
          onSelectReport={() => {}}
          onNavigateToRecords={() => {}}
          onOpenClinicalNotes={openClinicalNotes}
        />
        </RouteErrorBoundary>
      } />
      <Route path="appointments" element={
        <RouteErrorBoundary>
        <AppointmentsListView
          appointments={store.appointments}
          currentUser={currentUser}
        />
        </RouteErrorBoundary>
      } />
      <Route path="ai-assistant" element={
        <RouteErrorBoundary>
        <AIAssistantView
          currentUser={currentUser}
          onNavigateTab={() => {}}
          initialQuery={aiInitialQuery}
        />
        </RouteErrorBoundary>
      } />
      <Route path="prescriptions" element={
        <RouteErrorBoundary>
        <MedicalRecordsView
          currentUser={currentUser}
          labReports={store.labReports}
          prescriptions={store.prescriptions}
          selectedReport={null}
          onSelectReport={() => {}}
          onAskAIAboutReport={() => {}}
          onAddNewReport={store.addLabReport}
        />
        </RouteErrorBoundary>
      } />
      <Route path="analytics" element={
        <RouteErrorBoundary>
        <AdminDashboardView onAddDoctor={store.addDoctor} />
        </RouteErrorBoundary>
      } />
      <Route path="records" element={
        <RouteErrorBoundary>
        <MedicalRecordsView
          currentUser={currentUser}
          labReports={store.labReports}
          prescriptions={store.prescriptions}
          selectedReport={null}
          onSelectReport={() => {}}
          onAskAIAboutReport={() => {}}
          onAddNewReport={store.addLabReport}
        />
        </RouteErrorBoundary>
      } />
      <Route path="messages" element={<RouteErrorBoundary><MessagesView currentUser={currentUser} /></RouteErrorBoundary>} />
      <Route path="settings" element={<RouteErrorBoundary><SettingsView /></RouteErrorBoundary>} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

// Admin routes
function AdminRoutes() {
  const { currentUser } = useAuth();
  const store = useDataStore();
  const { openClinicalNotes } = useClinicalNotes();

  useEffect(() => {
    store.fetchDoctors();
    store.fetchAppointments(undefined, undefined);
    store.fetchLabReports(undefined);
  }, []);

  if (!currentUser) return null;

  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={
        <RouteErrorBoundary>
        <AdminDashboardView onAddDoctor={store.addDoctor} />
        </RouteErrorBoundary>
      } />
      <Route path="patients" element={
        <RouteErrorBoundary>
        <PatientsDirectoryView
          labReports={store.labReports}
          onSelectReport={() => {}}
          onNavigateToRecords={() => {}}
          onOpenClinicalNotes={openClinicalNotes}
        />
        </RouteErrorBoundary>
      } />
      <Route path="appointments" element={
        <RouteErrorBoundary>
        <AppointmentsListView
          appointments={store.appointments}
          currentUser={currentUser}
        />
        </RouteErrorBoundary>
      } />
      <Route path="analytics" element={
        <RouteErrorBoundary>
        <AdminDashboardView onAddDoctor={store.addDoctor} />
        </RouteErrorBoundary>
      } />
      <Route path="messages" element={<RouteErrorBoundary><MessagesView currentUser={currentUser} /></RouteErrorBoundary>} />
      <Route path="settings" element={<RouteErrorBoundary><SettingsView /></RouteErrorBoundary>} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

// Root: guards routes behind auth, routes by role workspace
function RootRouter() {
  const { currentUser, authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 text-sm">
        <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mr-2" />
        Loading MediTru…
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          currentUser ? <Navigate to={`/${currentUser.role}/dashboard`} replace /> : <LoginView />
        }
      />
      <Route
        path="/patient/*"
        element={
          currentUser?.role === 'patient' ? (
            <AppLayout>
              <PatientRoutes />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/doctor/*"
        element={
          currentUser?.role === 'doctor' ? (
            <AppLayout>
              <DoctorRoutes />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/admin/*"
        element={
          currentUser?.role === 'admin' ? (
            <AppLayout>
              <AdminRoutes />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={currentUser ? `/${currentUser.role}/dashboard` : '/login'} replace />
        }
      />
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
