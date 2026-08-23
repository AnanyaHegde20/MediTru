import React, { useState } from 'react';
import {
  Users,
  FileCheck2,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Stethoscope,
  Calendar,
  Activity,
  Plus,
} from 'lucide-react';
import { Appointment, PatientActivityItem, PatientQueueItem, UserProfile } from '../../types';

interface DoctorDashboardViewProps {
  currentUser: UserProfile;
  schedule: Appointment[];
  queue: PatientQueueItem[];
  activity: PatientActivityItem[];
  onOpenClinicalNotes: (patientName?: string) => void;
  onNavigateTab: (tab: any) => void;
  onUpdateQueueStatus: (id: string, status: 'Waiting' | 'In Progress' | 'Done') => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  currentUser,
  schedule,
  queue,
  activity,
  onOpenClinicalNotes,
  onNavigateTab,
  onUpdateQueueStatus,
}) => {
  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'waiting' | 'in-progress' | 'done'>('all');

  const filteredQueue = queue.filter((item) => {
    if (activeQueueTab === 'waiting') return item.status === 'Waiting';
    if (activeQueueTab === 'in-progress') return item.status === 'In Progress';
    if (activeQueueTab === 'done') return item.status === 'Done';
    return true;
  });

  const waitingCount = queue.filter((q) => q.status === 'Waiting').length;

  return (
    <div id="doctor-dashboard-content" className="space-y-6 animate-in fade-in duration-150">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Patients Today */}
        <div className="card-minimal flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">12</div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>4 Completed Today</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Pending Reports */}
        <div
          onClick={() => onNavigateTab('records')}
          className="card-minimal flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Reports</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">05</div>
            <div className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>3 Urgently Pending</span>
            </div>
          </div>
        </div>

        {/* Stat 3: New Messages */}
        <div
          onClick={() => onNavigateTab('messages')}
          className="card-minimal flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Messages</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">08</div>
            <div className="text-xs text-blue-600 font-medium mt-1">
              <span>From Clinical Care Team</span>
            </div>
          </div>
        </div>

        {/* Stat 4: Avg Consultation Time */}
        <div className="card-minimal flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Consultation</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">18 min</div>
            <div className="text-xs text-amber-600 font-medium mt-1">
              <span>-2m from last week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two Columns: Today's Schedule & Patient Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Today's Schedule */}
        <div className="card-minimal flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm md:text-base font-bold text-slate-900">Today's Schedule</h2>
              <button
                onClick={() => onNavigateTab('appointments')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View Calendar ↗
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.patientAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={item.patientName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs md:text-sm font-semibold text-slate-900 truncate">
                        {item.patientName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.type}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.time}</div>
                      <div className="text-[10px] text-slate-400">Duration: {item.duration}</div>
                    </div>

                    <span
                      className={`badge-clean ${
                        item.status === 'Completed'
                          ? 'badge-clean-success'
                          : item.status === 'In Progress'
                          ? 'badge-clean-info'
                          : 'badge-clean-warning'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Next patient in line: <strong className="text-slate-900 font-semibold">Rahul Sharma</strong> (11:15 AM)</span>
            <button
              onClick={() => onOpenClinicalNotes('Priya Sharma')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Draft Notes
            </button>
          </div>
        </div>

        {/* Right Column: Patient Queue */}
        <div className="card-minimal flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-900">Patient Queue</h2>
                <span className="badge-clean badge-clean-info">
                  {waitingCount} Waiting
                </span>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 text-[11px]">
                {(['all', 'waiting', 'in-progress', 'done'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveQueueTab(tab)}
                    className={`px-2 py-0.5 rounded capitalize font-medium transition-colors cursor-pointer ${
                      activeQueueTab === tab
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {tab === 'in-progress' ? 'Active' : tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {filteredQueue.map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <span>{item.patientName}</span>
                      <span className="text-[11px] font-normal text-slate-400">({item.age} yrs)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.status} • {item.waitTime} • {item.reason}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status cycle toggle button */}
                    <button
                      onClick={() => {
                        const next =
                          item.status === 'Waiting'
                            ? 'In Progress'
                            : item.status === 'In Progress'
                            ? 'Done'
                            : 'Waiting';
                        onUpdateQueueStatus(item.id, next);
                      }}
                      className={`badge-clean cursor-pointer transition-all ${
                        item.status === 'Waiting'
                          ? 'badge-clean-warning hover:bg-amber-200'
                          : item.status === 'In Progress'
                          ? 'badge-clean-info hover:bg-blue-200'
                          : 'badge-clean-success hover:bg-emerald-200'
                      }`}
                    >
                      {item.status}
                    </button>

                    <button
                      onClick={() => onOpenClinicalNotes(item.patientName)}
                      title="Write Clinical Consultation Note"
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Patient Activity & AI Clinical Notes Assistant CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patient Activity Feed (2 Cols) */}
        <div className="lg:col-span-2 card-minimal">
          <h3 className="text-xs md:text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Recent Patient Activity</span>
          </h3>

          <div className="space-y-2">
            {activity.map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between gap-3 text-xs text-slate-600 py-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="truncate">
                    {act.text} <strong className="text-slate-900 font-semibold">{act.highlightName}</strong> {act.detail}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">{act.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Clinical Notes Assistant Banner (1 Col) */}
        <div className="card-minimal bg-gradient-to-r from-blue-50 to-white border border-blue-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                AI Clinical Notes Assistant
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate instant, compliant SOAP consultation summaries and prescriptions powered by Gemini.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="badge-clean badge-clean-info">Gemini 3.7</span>
            <button
              id="btn-open-clinical-notes-cta"
              onClick={() => onOpenClinicalNotes()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Launch Scribe</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
