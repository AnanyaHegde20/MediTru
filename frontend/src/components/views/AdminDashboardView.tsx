import React, { useEffect, useState } from 'react';
import {
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  TrendingUp,
  UserPlus,
  FileSpreadsheet,
  ArrowUpRight,
  Server,
  X,
} from 'lucide-react';
import { Appointment, Doctor, UserProfile } from '../../types';
import { useToast } from '../Toast';
import { useDataStore } from '../../store/useDataStore';

interface AdminDashboardViewProps {
  onAddDoctor: (doc: Doctor) => void;
  patients: UserProfile[];
  doctors: Doctor[];
  appointments: Appointment[];
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onAddDoctor,
  patients,
  doctors,
  appointments,
}) => {
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('Cardiology');
  const [docHospital, setDocHospital] = useState('MediTru Heart Institute, San Francisco');
  const [docFee, setDocFee] = useState(90);
  const { showToast } = useToast();
  const { fetchPatients } = useDataStore();

  useEffect(() => {
    fetchPatients();
  }, []);

  const activeAppointments = appointments.filter((a) => a.status !== 'Cancelled');
  const completedAppointments = appointments.filter((a) => a.status === 'Completed');
  const pendingAppointments = appointments.filter((a) => a.status === 'Pending');
  const revenue = completedAppointments.reduce((sum, a) => {
    const doc = doctors.find((d) => d.id === a.doctorId);
    return sum + (doc ? Number(doc.consultationFee) : 0);
  }, 0);

  const recentActivity = appointments
    .slice(-5)
    .reverse()
    .map((a) => ({
      id: a.id,
      patient: a.patientName,
      action: a.type || 'Consultation',
      doctor: a.doctorName,
      time: `${a.date} • ${a.time}`,
      status: a.status,
    }));

  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newDoc: Doctor = {
      id: `doc_${Date.now()}`,
      name: docName.startsWith('Dr.') ? docName : `Dr. ${docName}`,
      specialty: docSpecialty,
      rating: 4.9,
      reviewCount: 1,
      experienceYears: 7,
      consultationFee: docFee,
      nextAvailable: 'Tomorrow, 09:00 AM',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
      bio: `Board-certified ${docSpecialty} clinical practitioner dedicated to patient wellbeing.`,
      hospital: docHospital,
      education: 'MD from Accredited University Medical School',
      slots: {
        morning: ['09:00 AM', '10:30 AM'],
        afternoon: ['02:00 PM', '04:00 PM'],
        evening: ['05:30 PM'],
      },
    };

    onAddDoctor(newDoc);
    setShowAddDoctorModal(false);
    setDocName('');
  };

  return (
    <div id="admin-dashboard-screen" className="space-y-6 animate-in fade-in duration-200">
      {/* Top KPI Row - Matches Figma Screen 7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-600">Total Patients</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {patients.length.toLocaleString()}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" />
              <span>Registered accounts</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Doctors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-600">Active Doctors</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {doctors.length}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3 h-3" />
              <span>On staff now</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Active Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-600">Active Appointments</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeAppointments.length}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" />
              <span>{pendingAppointments.length} pending</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Consultation Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-600">Consultation Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              ${revenue.toLocaleString()}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" />
              <span>{completedAppointments.length} completed consults</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent System Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <h3 className="text-sm font-bold text-slate-900">Recent Healthcare Audit Activity</h3>
            <span className="text-[11px] font-semibold text-slate-400">Live appointment ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2 px-2">Patient</th>
                  <th className="pb-2 px-2">Action</th>
                  <th className="pb-2 px-2">Doctor / Unit</th>
                  <th className="pb-2 px-2">Time</th>
                  <th className="pb-2 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivity.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-slate-900">{item.patient}</td>
                    <td className="py-2.5 px-2 text-slate-600">{item.action}</td>
                    <td className="py-2.5 px-2 text-slate-500">{item.doctor}</td>
                    <td className="py-2.5 px-2 text-slate-400">{item.time}</td>
                    <td className="py-2.5 px-2 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'Completed' || item.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Admin Quick Actions Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm md:text-base font-bold flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Healthcare System Administration & Integration</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Manage provider credentials and generate HIPAA compliance audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-admin-add-doctor"
            onClick={() => setShowAddDoctorModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Doctor</span>
          </button>

          <button
            onClick={() => showToast('HIPAA Compliance Audit Log CSV exported.')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAddDoctorModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Add Healthcare Provider</h3>
            <p className="text-xs text-slate-500 mb-4">
              Register a certified doctor to the MediTru directory and scheduling system.
            </p>

            <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor Full Name
                </label>
                <input
                  id="input-add-doctor-name"
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Dr. Maya Patel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialty
                  </label>
                  <select
                    id="select-add-doctor-specialty"
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Consultation Fee ($)
                  </label>
                  <input
                    type="number"
                    value={docFee}
                    onChange={(e) => setDocFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital / Department
                </label>
                <input
                  type="text"
                  value={docHospital}
                  onChange={(e) => setDocHospital(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-add-doctor"
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Add Doctor to Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
