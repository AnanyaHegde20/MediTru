import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';

const MessagesView = React.lazy(() =>
  import('./components/MessagesView').then((m) => ({ default: m.MessagesView })));
const LoginView = React.lazy(() =>
  import('./components/views/LoginView').then((m) => ({ default: m.LoginView })));
const PatientDashboardView = React.lazy(() =>
  import('./components/views/PatientDashboardView').then((m) => ({ default: m.PatientDashboardView })));
const DoctorDashboardView = React.lazy(() =>
  import('./components/views/DoctorDashboardView').then((m) => ({ default: m.DoctorDashboardView })));
const AppointmentBookingView = React.lazy(() =>
  import('./components/views/AppointmentBookingView').then((m) => ({ default: m.AppointmentBookingView })));
const AIAssistantView = React.lazy(() =>
  import('./components/views/AIAssistantView').then((m) => ({ default: m.AIAssistantView })));
const MedicalRecordsView = React.lazy(() =>
  import('./components/views/MedicalRecordsView').then((m) => ({ default: m.MedicalRecordsView })));
const AdminDashboardView = React.lazy(() =>
  import('./components/views/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView })));
const PatientsDirectoryView = React.lazy(() =>
  import('./components/views/PatientsDirectoryView').then((m) => ({ default: m.PatientsDirectoryView })));
const AppointmentsListView = React.lazy(() =>
  import('./components/views/AppointmentsListView').then((m) => ({ default: m.AppointmentsListView })));
const SettingsView = React.lazy(() =>
  import('./components/views/SettingsView').then((m) => ({ default: m.SettingsView })));
const ClinicalNotesModal = React.lazy(() =>
  import('./components/modals/ClinicalNotesModal').then((m) => ({ default: m.ClinicalNotesModal })));

import { useAuth } from './contexts/AuthContext';
import { useClinicalNotes } from './contexts/ClinicalNotesContext';
import { useAIAssistant } from './contexts/AIAssistantContext';
import { useDataStore } from './store/useDataStore';
import { ActiveTab } from './types';

function RouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm">
      <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mr-2" />
      Loading…
    </div>
  );
}

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
          <React.Suspense fallback={<RouteFallback />}>{children}</React.Suspense>
        </main>
      </div>

      <MobileNav role={currentUser.role} />

      <React.Suspense fallback={<RouteFallback />}>
        {showClinicalNotesModal && (
          <ClinicalNotesModal
            patientName={activePatientForNotes}
            onClose={closeClinicalNotes}
          />
        )}
      </React.Suspense>
    </div>
  );
}

// Patient routes
function PatientRoutes() {
  const { currentUser } = useAuth();
  const store = useDataStore();
  const navigate = useNavigate();
  const { selectedReport, setSelectedReport, quickAskAI, askAIAboutReport, aiInitialQuery } = useAIAssistant();
  const { openClinicalNotes } = useClinicalNotes();

  const goTab = (tab: ActiveTab) => navigate(`/patient/${tab}`);

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
          onNavigateTab={goTab}
          onSelectReport={(rep) => {
            setSelectedReport(rep);
            navigate('/patient/records');
          }}
          onQuickAskAI={(query) => {
            quickAskAI(query);
            navigate('/patient/ai-assistant');
          }}
          onCancelAppointment={(id) => store.updateAppointmentStatus(id, 'Cancelled')}
        />
        </RouteErrorBoundary>
      } />
      <Route path="appointments" element={
        <RouteErrorBoundary>
        <AppointmentBookingView
          doctors={store.doctors}
          currentUser={currentUser}
          onBookAppointment={store.bookAppointment}
          onNavigateTab={goTab}
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
          onAskAIAboutReport={(rep) => {
            askAIAboutReport(rep);
            navigate('/patient/ai-assistant');
          }}
          onUploadFile={store.uploadLabReport}
          onRequestRefill={store.requestRefill}
          onApproveRefill={(id) => store.updatePrescriptionStatus(id, 'Active')}
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
          onAskAIAboutReport={(rep) => {
            askAIAboutReport(rep);
            navigate('/patient/ai-assistant');
          }}
          onUploadFile={store.uploadLabReport}
          onRequestRefill={store.requestRefill}
          onApproveRefill={(id) => store.updatePrescriptionStatus(id, 'Active')}
        />
        </RouteErrorBoundary>
      } />
      <Route path="ai-assistant" element={
        <RouteErrorBoundary>
        <AIAssistantView
          currentUser={currentUser}
          onNavigateTab={goTab}
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
  const navigate = useNavigate();
  const { openClinicalNotes } = useClinicalNotes();
  const { aiInitialQuery, selectedReport, setSelectedReport, askAIAboutReport } = useAIAssistant();

  const goTab = (tab: ActiveTab) => navigate(`/doctor/${tab}`);

  useEffect(() => {
    store.fetchAppointments(undefined, undefined);
    store.fetchPatientQueue(undefined);
    store.fetchLabReports(undefined);
    store.fetchPrescriptions(undefined);
    store.fetchMessageThreads();
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
          labReports={store.labReports}
          messageThreads={store.messageThreads}
          onOpenClinicalNotes={openClinicalNotes}
          onNavigateTab={goTab}
          onUpdateQueueStatus={store.updateQueueStatus}
        />
        </RouteErrorBoundary>
      } />
      <Route path="patients" element={
        <RouteErrorBoundary>
        <PatientsDirectoryView
          patients={store.patients}
          appointments={store.appointments}
          labReports={store.labReports}
          showViewChart
          onSelectReport={setSelectedReport}
          onNavigateToRecords={() => navigate('/doctor/records')}
          onOpenClinicalNotes={openClinicalNotes}
        />
        </RouteErrorBoundary>
      } />
      <Route path="appointments" element={
        <RouteErrorBoundary>
        <AppointmentsListView
          appointments={store.appointments}
          currentUser={currentUser}
          onUpdateStatus={store.updateAppointmentStatus}
        />
        </RouteErrorBoundary>
      } />
      <Route path="ai-assistant" element={
        <RouteErrorBoundary>
        <AIAssistantView
          currentUser={currentUser}
          onNavigateTab={goTab}
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
          selectedReport={selectedReport}
          onSelectReport={setSelectedReport}
          onAskAIAboutReport={(rep) => {
            askAIAboutReport(rep);
            navigate('/doctor/ai-assistant');
          }}
          onUploadFile={store.uploadLabReport}
          onRequestRefill={store.requestRefill}
          onApproveRefill={(id) => store.updatePrescriptionStatus(id, 'Active')}
        />
        </RouteErrorBoundary>
      } />
      <Route path="analytics" element={
        <RouteErrorBoundary>
        <AdminDashboardView
          onAddDoctor={store.addDoctor}
          patients={store.patients}
          doctors={store.doctors}
          appointments={store.appointments}
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
          onAskAIAboutReport={(rep) => {
            askAIAboutReport(rep);
            navigate('/doctor/ai-assistant');
          }}
          onUploadFile={store.uploadLabReport}
          onRequestRefill={store.requestRefill}
          onApproveRefill={(id) => store.updatePrescriptionStatus(id, 'Active')}
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
        <AdminDashboardView
          onAddDoctor={store.addDoctor}
          patients={store.patients}
          doctors={store.doctors}
          appointments={store.appointments}
        />
        </RouteErrorBoundary>
      } />
      <Route path="patients" element={
        <RouteErrorBoundary>
        <PatientsDirectoryView
          patients={store.patients}
          appointments={store.appointments}
          labReports={store.labReports}
          showViewChart={false}
          onOpenClinicalNotes={openClinicalNotes}
        />
        </RouteErrorBoundary>
      } />
      <Route path="appointments" element={
        <RouteErrorBoundary>
        <AppointmentsListView
          appointments={store.appointments}
          currentUser={currentUser}
          onUpdateStatus={store.updateAppointmentStatus}
        />
        </RouteErrorBoundary>
      } />
      <Route path="analytics" element={
        <RouteErrorBoundary>
        <AdminDashboardView
          onAddDoctor={store.addDoctor}
          patients={store.patients}
          doctors={store.doctors}
          appointments={store.appointments}
        />
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
          currentUser ? (
            <Navigate to={`/${currentUser.role}/dashboard`} replace />
          ) : (
            <React.Suspense fallback={<RouteFallback />}>
              <LoginView />
            </React.Suspense>
          )
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
