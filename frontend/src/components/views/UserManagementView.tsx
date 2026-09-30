import React, { useEffect, useState } from 'react';
import { Download, Plus, ShieldCheck, Trash2, UserCog, X } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { useDataStore } from '../../store/useDataStore';
import { useToast } from '../Toast';
import { downloadCsv } from '../../lib/csvDownload';

const ROLE_OPTIONS: UserRole[] = ['patient', 'doctor', 'admin'];

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  patient: 'bg-slate-100 text-slate-700',
  doctor: 'bg-blue-100 text-blue-700',
  admin: 'bg-violet-100 text-violet-700',
};

export const UserManagementView: React.FC = () => {
  const users = useDataStore((state) => state.users);
  const fetchUsers = useDataStore((state) => state.fetchUsers);
  const createUser = useDataStore((state) => state.createUser);
  const updateUserRole = useDataStore((state) => state.updateUserRole);
  const deleteUser = useDataStore((state) => state.deleteUser);
  const { showToast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setName('');
    setEmail('');
    setPassword('');
    setRole('patient');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      showToast('Name, email and password are required.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const created = await createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      showToast(`Account created for ${created.name}.`, 'success');
      closeCreateModal();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create the account.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (id: string, nextRole: UserRole) => {
    try {
      await updateUserRole(id, nextRole);
      showToast(`Role updated to ${nextRole}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update the role.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteUser(pendingDelete.id);
      showToast(`Account deleted for ${pendingDelete.name}.`, 'success');
      setPendingDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete the account.', 'error');
    }
  };

  const handleExport = async () => {
    try {
      await downloadCsv('/api/users/export', 'users.csv');
      showToast('Users CSV exported.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not export the CSV.', 'error');
    }
  };

  return (
    <div id="user-accounts-view" className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage who can sign in to MediTru and what they are allowed to do
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            id="btn-export-users-csv"
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-create-user"
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors" data-user-email={user.email}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (user.name || '?').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE_STYLES[user.role] ?? ROLE_BADGE_STYLES.patient}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {pendingDelete?.id === user.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] text-slate-500">Delete account?</span>
                        <button
                          type="button"
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
                        <label className="sr-only" htmlFor={`select-role-${user.id}`}>
                          Role for {user.name}
                        </label>
                        <select
                          id={`select-role-${user.id}`}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(user)}
                          title={`Delete ${user.name}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    Loading accounts…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCog className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">{users.length}</div>
            <div className="text-[11px] text-slate-400">Total accounts</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {users.filter((u) => u.role === 'admin').length}
            </div>
            <div className="text-[11px] text-slate-400">Administrators</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCog className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {users.filter((u) => u.role === 'doctor').length}
            </div>
            <div className="text-[11px] text-slate-400">Doctors</div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div
          id="user-create-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        >
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Create User Account</h2>
              <button
                type="button"
                onClick={closeCreateModal}
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label htmlFor="input-user-name" className="block text-xs font-semibold text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="input-user-email" className="block text-xs font-semibold text-slate-700">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="input-user-password" className="block text-xs font-semibold text-slate-700">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="select-user-role" className="block text-xs font-semibold text-slate-700">
                Role
              </label>
              <select
                id="select-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                id="btn-cancel-create-user"
                type="button"
                onClick={closeCreateModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-submit-create-user"
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                {isSaving && (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{isSaving ? 'Creating…' : 'Create Account'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
