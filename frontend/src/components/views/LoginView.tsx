import React, { useState } from 'react';
import { Mail, Lock, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../types';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('priya.sharma@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'patient') {
      setEmail('priya.sharma@example.com');
      setPassword('password123');
    } else if (role === 'doctor') {
      setEmail('rajesh.kumar@medicare.health');
      setPassword('doctorpass2024');
    } else {
      setEmail('admin@medicare.health');
      setPassword('adminsecure99');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(selectedRole);
    }, 450);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(selectedRole);
    }, 450);
  };

  return (
    <div
      id="login-screen"
      className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative bg-[#F8FAFC] overflow-hidden"
    >
      {/* Subtle Background Pattern (Medical Cross / Grid) */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#2563eb 1.5px, transparent 1.5px), radial-gradient(#2563eb 1.5px, #F8FAFC 1.5px)`,
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
        }}
      />

      {/* Main Login Card - Matches Figma Screen 1 */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200/80 p-7 md:p-9 relative z-10">
        {/* Brand Logo & Header */}
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
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-normal">
            Welcome back. Please sign in to your dashboard.
          </p>
        </div>

        {/* Role Segmented Switcher */}
        <div
          id="login-role-tabs"
          className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 mb-6 border border-slate-200/60"
        >
          {(['patient', 'doctor', 'admin'] as UserRole[]).map((role) => (
            <button
              key={role}
              type="button"
              id={`login-role-${role}`}
              onClick={() => handleRoleChange(role)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                selectedRole === role
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert('Demo Reset Link: In production, password reset instructions are sent to ' + email)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

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
                <span>Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-white px-3 text-slate-400 font-semibold">OR</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          id="btn-google-signin"
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs md:text-sm rounded-lg border border-slate-200 shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        {/* Footer Link */}
        <div className="text-center mt-5 text-xs text-slate-500">
          Don't have an account?{' '}
          <button
            onClick={() => onLogin(selectedRole)}
            className="text-blue-600 font-semibold hover:underline"
          >
            Create account
          </button>
        </div>
      </div>

      {/* Demo Credentials Quick Switch Pill Bar */}
      <div className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-3">
        <span>Quick Demo:</span>
        <button
          onClick={() => {
            handleRoleChange('patient');
            onLogin('patient');
          }}
          className="text-blue-600 font-semibold hover:underline"
        >
          Patient (Priya)
        </button>
        <span>•</span>
        <button
          onClick={() => {
            handleRoleChange('doctor');
            onLogin('doctor');
          }}
          className="text-emerald-600 font-semibold hover:underline"
        >
          Doctor (Dr. Rajesh)
        </button>
        <span>•</span>
        <button
          onClick={() => {
            handleRoleChange('admin');
            onLogin('admin');
          }}
          className="text-slate-800 font-semibold hover:underline"
        >
          Admin (Sarah)
        </button>
      </div>
    </div>
  );
};
