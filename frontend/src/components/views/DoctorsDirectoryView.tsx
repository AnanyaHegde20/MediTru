import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Search, Star, Stethoscope, Trash2, X } from 'lucide-react';
import { Doctor } from '../../types';
import { useDataStore } from '../../store/useDataStore';
import { useToast } from '../Toast';
import { Dialog } from '../ui/Dialog';

const SPECIALTY_OPTIONS = [
  'Cardiology',
  'Dermatology',
  'General Medicine',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
];

export const DoctorsDirectoryView: React.FC = () => {
  const doctors = useDataStore((state) => state.doctors);
  const fetchDoctors = useDataStore((state) => state.fetchDoctors);
  const updateDoctor = useDataStore((state) => state.updateDoctor);
  const deleteDoctor = useDataStore((state) => state.deleteDoctor);
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editHospital, setEditHospital] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Doctor | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const filtered = doctors.filter((doc) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      (doc.hospital ?? '').toLowerCase().includes(q)
    );
  });

  const openEdit = (doc: Doctor) => {
    setEditing(doc);
    setEditName(doc.name);
    setEditSpecialty(doc.specialty);
    setEditHospital(doc.hospital ?? '');
  };

  const closeEdit = () => {
    setEditing(null);
    setEditName('');
    setEditSpecialty('');
    setEditHospital('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editName.trim() || !editSpecialty.trim()) {
      showToast('Name and specialty are required.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateDoctor(editing.id, {
        ...editing,
        name: editName.trim(),
        specialty: editSpecialty.trim(),
        hospital: editHospital.trim(),
      });
      showToast('Doctor profile updated.', 'success');
      closeEdit();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save the profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteDoctor(pendingDelete.id);
      showToast(`${pendingDelete.name} removed from the directory.`, 'success');
      setPendingDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete the doctor.', 'error');
    }
  };

  const slotCount = (doc: Doctor) =>
    doc.slots.morning.length + doc.slots.afternoon.length + doc.slots.evening.length;

  return (
    <div id="doctors-directory-view" className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Directory</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Review provider profiles, specialties and published availability
          </p>
        </div>
        <div className="relative self-start md:self-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="input-doctor-directory-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, specialty, hospital..."
            className="pl-9 pr-3 py-2 w-full md:w-72 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">{doctors.length}</div>
            <div className="text-[11px] text-slate-400">Provider profiles</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {new Set(doctors.map((d) => d.specialty)).size}
            </div>
            <div className="text-[11px] text-slate-400">Specialties</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {doctors.length > 0
                ? (
                    doctors.reduce((sum, d) => sum + (d.rating ?? 0), 0) / doctors.length
                  ).toFixed(1)
                : '—'}
            </div>
            <div className="text-[11px] text-slate-400">Average rating</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Specialty</th>
                <th className="py-3 px-4">Hospital</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Slots</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  data-doctor-name={doc.name}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {doc.avatar ? (
                          <img
                            src={doc.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          (doc.name || '?').replace(/^Dr\.\s*/, '').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{doc.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {doc.email || 'No linked login'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{doc.specialty}</td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-[180px]">
                    {doc.hospital || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                      {doc.rating ?? '—'}
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{slotCount(doc)}</td>
                  <td className="py-3 px-4">
                    {pendingDelete?.id === doc.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] text-slate-500">Remove doctor?</span>
                        <button
                          type="button"
                          id={`btn-confirm-delete-doctor-${doc.id}`}
                          onClick={handleDelete}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(null)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          id={`btn-edit-doctor-${doc.id}`}
                          onClick={() => openEdit(doc)}
                          title={`Edit ${doc.name}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`btn-delete-doctor-${doc.id}`}
                          onClick={() => setPendingDelete(doc)}
                          title={`Delete ${doc.name}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {doctors.length === 0 ? 'Loading doctors…' : 'No doctors match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Dialog
          id="doctor-edit-modal"
          onClose={closeEdit}
          labelledBy="edit-doctor-title"
          overlayClassName="bg-slate-900/40"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="edit-doctor-title" className="text-base font-bold text-slate-900">Edit Doctor Profile</h2>
              <button
                type="button"
                onClick={closeEdit}
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label htmlFor="input-edit-doctor-name" className="block text-xs font-semibold text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-edit-doctor-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="select-edit-doctor-specialty" className="block text-xs font-semibold text-slate-700">
                Specialty <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-edit-doctor-specialty"
                value={editSpecialty}
                onChange={(e) => setEditSpecialty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
              >
                {!SPECIALTY_OPTIONS.includes(editSpecialty) && editSpecialty && (
                  <option value={editSpecialty}>{editSpecialty}</option>
                )}
                {SPECIALTY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="input-edit-doctor-hospital" className="block text-xs font-semibold text-slate-700">
                Hospital / Department
              </label>
              <input
                id="input-edit-doctor-hospital"
                type="text"
                value={editHospital}
                onChange={(e) => setEditHospital(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                id="btn-cancel-doctor-edit"
                type="button"
                onClick={closeEdit}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-save-doctor-edit"
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                {isSaving && (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
