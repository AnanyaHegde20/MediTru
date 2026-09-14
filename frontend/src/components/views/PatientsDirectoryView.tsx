import React from 'react';
import { Sparkles } from 'lucide-react';
import { LabReport } from '../../types';

interface PatientEntry {
  name: string;
  age: number;
  condition: string;
  lastVisit: string;
  doctor: string;
  avatar: string;
}

const MOCK_PATIENTS: PatientEntry[] = [
  { name: 'Priya Sharma', age: 32, condition: 'Stage 1 Hypertension', lastVisit: 'Yesterday', doctor: 'Dr. Alan Stone', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { name: 'Amit Patel', age: 45, condition: 'Type 2 Diabetes Mellitus', lastVisit: '3 days ago', doctor: 'Dr. Robert Mercer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { name: 'Sneha Reddy', age: 28, condition: 'Routine Wellness / Lipidemia', lastVisit: '1 week ago', doctor: 'Dr. Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
  { name: 'Vikram Singh', age: 52, condition: 'Coronary Artery Monitoring', lastVisit: '2 weeks ago', doctor: 'Dr. Alan Stone', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
  { name: 'Ananya Roy', age: 39, condition: 'Hypothyroidism', lastVisit: '3 weeks ago', doctor: 'Dr. Emily Taylor', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200' },
  { name: 'Rahul Sharma', age: 29, condition: 'Allergic Rhinitis', lastVisit: 'Today', doctor: 'Dr. Rajesh Kumar', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' },
];

interface PatientsDirectoryViewProps {
  labReports: LabReport[];
  onSelectReport: (report: LabReport) => void;
  onNavigateToRecords: () => void;
  onOpenClinicalNotes: (patientName: string) => void;
}

export const PatientsDirectoryView: React.FC<PatientsDirectoryViewProps> = ({
  labReports,
  onSelectReport,
  onNavigateToRecords,
  onOpenClinicalNotes,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Registered Patient Directory</h2>
          <p className="text-xs text-slate-400">Manage patient charts, EHR records, and consultation history</p>
        </div>
        <button
          onClick={() => onOpenClinicalNotes('Priya Sharma')}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Clinical Scribe</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {MOCK_PATIENTS.map((p, idx) => (
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
                  onSelectReport(labReports[0]);
                  onNavigateToRecords();
                }}
                className="text-[11px] font-semibold text-slate-600 hover:text-blue-600"
              >
                View Chart
              </button>
              <button
                onClick={() => onOpenClinicalNotes(p.name)}
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
  );
};
