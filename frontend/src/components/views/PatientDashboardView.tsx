import React, { useState } from 'react';
import {
  Calendar,
  Pill,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Download,
  Send,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { Appointment, LabReport, Prescription, UserProfile } from '../../types';

interface PatientDashboardViewProps {
  currentUser: UserProfile;
  appointments: Appointment[];
  labReports: LabReport[];
  prescriptions: Prescription[];
  onNavigateTab: (tab: any) => void;
  onSelectReport: (report: LabReport) => void;
  onQuickAskAI: (query: string) => void;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  currentUser,
  appointments,
  labReports,
  prescriptions,
  onNavigateTab,
  onSelectReport,
  onQuickAskAI,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');

  const nextAppointment = appointments.find((a) => a.status === 'Confirmed') || appointments[0];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    onQuickAskAI(quickPrompt);
  };

  const handleDownloadMock = (reportName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = document.createElement('a');
    const file = new Blob([
      `MEDICARE CLINICAL LABORATORY REPORT\n` +
      `====================================\n` +
      `Patient Name: ${currentUser.name}\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `Report: ${reportName}\n` +
      `Facility: MediTru Central Diagnostics\n\n` +
      `Clinical Status: Verified by Medical Board\n` +
      `Summary: All recorded values have been cross-checked with certified clinical reference standards.`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${reportName.toLowerCase().replace(/\s+/g, '_')}_report.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="patient-dashboard-content" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {nextAppointment
              ? `Your next appointment with ${nextAppointment.doctorName} is tomorrow at ${nextAppointment.time}.`
              : 'Welcome back to your healthcare dashboard.'}
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('appointments')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <span>Book Appointment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Clean Minimal Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Appointments */}
        <div
          onClick={() => onNavigateTab('appointments')}
          className="card-minimal flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Appointments
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {appointments.length < 10 ? `0${appointments.length}` : appointments.length}
            </span>
          </div>
          <span className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Next: Mar 24
          </span>
        </div>

        {/* Card 2: Prescriptions */}
        <div
          onClick={() => onNavigateTab('prescriptions')}
          className="card-minimal flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Prescriptions
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {prescriptions.length < 10 ? `0${prescriptions.length}` : prescriptions.length}
            </span>
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Active (2 Refills)
          </span>
        </div>

        {/* Card 3: Lab Reports */}
        <div
          onClick={() => onNavigateTab('records')}
          className="card-minimal flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Lab Reports
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {labReports.length < 10 ? `0${labReports.length}` : labReports.length}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium mt-2">
            Last: 2 days ago
          </span>
        </div>

        {/* Card 4: Messages */}
        <div
          onClick={() => onNavigateTab('messages')}
          className="card-minimal flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Messages
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              01
            </span>
          </div>
          <span className="text-xs text-amber-600 font-medium mt-2">
            Unread (Care Team)
          </span>
        </div>
      </div>

      {/* Main 2-Column Schedule & Lab Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upcoming Appointments (7 Cols) */}
        <div className="lg:col-span-7 card-minimal flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm md:text-base">Upcoming Appointments</h3>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-blue-600 text-xs font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            {appointments.map((apt, idx) => {
              const dateParts = apt.date.split(' ');
              const month = dateParts[0]?.substring(0, 3) || 'MAR';
              const day = dateParts[1]?.replace(',', '') || '24';
              return (
                <div
                  key={apt.id}
                  className={`flex items-center p-3 rounded-lg border transition-colors ${
                    idx === 0
                      ? 'bg-slate-50/80 border-slate-200/80'
                      : 'bg-white border-slate-100 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex flex-col items-center justify-center border border-slate-200 mr-3 shrink-0 shadow-2xs">
                    <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">
                      {month}
                    </span>
                    <span className="text-sm font-bold text-slate-800 leading-tight">
                      {day}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {apt.doctorName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {apt.specialty} • {apt.time}
                    </div>
                  </div>

                  <span
                    className={`badge-clean shrink-0 ${
                      apt.status === 'Confirmed'
                        ? 'badge-clean-info'
                        : 'badge-clean-warning'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Lab Reports (5 Cols) */}
        <div className="lg:col-span-5 card-minimal flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm md:text-base">Recent Lab Reports</h3>
            <button
              onClick={() => onNavigateTab('records')}
              className="text-blue-600 text-xs font-semibold hover:underline"
            >
              View Records
            </button>
          </div>

          <div className="flex-1 space-y-2">
            {labReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onSelectReport(report)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-slate-100 hover:bg-slate-50/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 truncate transition-colors">
                      {report.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {report.date}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`badge-clean ${
                      report.status === 'Normal'
                        ? 'badge-clean-success'
                        : 'badge-clean-warning'
                    }`}
                  >
                    {report.status}
                  </span>
                  <button
                    onClick={(e) => handleDownloadMock(report.name, e)}
                    title="Download Report"
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MediTru AI Assistant Prompt Bar */}
      <div className="card-minimal p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-gradient-to-r from-blue-50 to-white border border-blue-100">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 self-start sm:self-auto">
          <Bot className="w-5 h-5" />
        </div>
        <form onSubmit={handleQuickSubmit} className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1">
            <div className="text-xs font-semibold text-blue-900 mb-1">MediTru AI Assistant</div>
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="Ask anything about your health, lab reports, or medication..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 self-end sm:self-auto mt-auto cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
