import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Stethoscope, UserCog, User as UserIcon } from 'lucide-react';
import { UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

const DEMO_ACCOUNTS: Record<UserRole, { email: string; password: string; label: string }> = {
  patient: { email: 'priya.sharma@example.com', password: 'password', label: 'Patient (Priya)' },
  doctor: { email: 'rajesh.kumar@medicare.health', password: 'password', label: 'Doctor (Dr. Rajesh)' },
  admin: { email: 'admin@medicare.health', password: 'password', label: 'Admin (Sarah)' },
};

export const LoginView: React.FC = () => {
  const [params] = useSearchParams();
  const portalParam = params.get('as');
  const portal: UserRole =
    portalParam === 'doctor' || portalParam === 'admin' || portalParam === 'patient'
      ? portalParam
      : 'patient';

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(DEMO_ACCOUNTS[portal].email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS[portal].password);
  const [registerRole, setRegisterRole] = useState<UserRole>('patient');
  const [isLoading, setIsLoading] = useState(false);

  const switchPortal = (role: UserRole) => {
    setMode('login');
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword(DEMO_ACCOUNTS[role].password);
    navigate(`/login?as=${role}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error, user } = await login(email, password);
        if (error) {
          showToast(error, 'error');
          return;
        }
        if (user) navigate(`/${user.role}/dashboard`);
      } else {
        const { error, user } = await register(name, email, password, registerRole);
        if (error) {
          showToast(error, 'error');
          return;
        }
        if (user) {
          showToast(`Welcome to MediTru, ${user.name}!`, 'success');
          navigate(`/${user.role}/dashboard`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="login-screen"
      className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative bg-[#F8FAFC] overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#2563eb 1.5px, transparent 1.5px), radial-gradient(#2563eb 1.5px, #F8FAFC 1.5px)`,
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
        }}
      />

      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200/80 p-7 md:p-9 relative z-10">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-3 shadow-md shadow-blue-500/25">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
            MediTru
          </h1>
          <div
            id={`login-role-badge-${mode === 'register' ? 'register' : portal}`}
            className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold uppercase tracking-wider text-blue-700"
          >
            {mode === 'register' ? (
              <UserIcon className="w-3 h-3" />
            ) : portal === 'doctor' ? (
              <Stethoscope className="w-3 h-3" />
            ) : portal === 'admin' ? (
              <UserCog className="w-3 h-3" />
            ) : (
              <ShieldCheck className="w-3 h-3" />
            )}
            <span>{mode === 'register' ? 'Create Account' : `${portal} Portal`}</span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1.5 font-normal">
            {mode === 'register'
              ? 'Create your account to get started.'
              : portal === 'doctor'
                ? 'Sign in to manage patients, queue & clinical notes.'
                : portal === 'admin'
                  ? 'Sign in to oversee providers, KPIs & revenue.'
                  : 'Sign in to your appointments, records & AI health assistant.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type="password"
                required
                minLength={mode === 'register' ? 6 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Type</label>
              <select
                id="register-role-select"
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button
            id="btn-submit-signin"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-5 text-xs text-slate-500">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                id="btn-switch-register"
                onClick={() => {
                  setMode('register');
                  setPassword('');
                  setName('');
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                id="btn-switch-login"
                onClick={() => {
                  setMode('login');
                  setEmail(DEMO_ACCOUNTS[portal].email);
                  setPassword(DEMO_ACCOUNTS[portal].password);
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-3">
        <span>Demo accounts (password: password):</span>
        {(['patient', 'doctor', 'admin'] as UserRole[]).map((r) => (
          <React.Fragment key={r}>
            <button
              onClick={() => switchPortal(r)}
              className={`font-semibold hover:underline ${
                portal === r && mode === 'login'
                  ? r === 'patient'
                    ? 'text-blue-600 underline'
                    : r === 'doctor'
                      ? 'text-emerald-600 underline'
                      : 'text-slate-800 underline'
                  : 'text-blue-600/70'
              }`}
            >
              {DEMO_ACCOUNTS[r].label}
            </button>
            {r !== 'admin' && <span>•</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-3 text-center text-xs text-slate-400">
        <Link to="/login" className="hover:text-slate-500">
          Secure JWT login
        </Link>
      </div>
    </div>
  );
};
