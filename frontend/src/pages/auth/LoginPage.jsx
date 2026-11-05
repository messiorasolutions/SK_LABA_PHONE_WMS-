import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/phone-management';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res?.success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(
        err.message || 'Unable to sign in. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3a070d] via-[#140205] to-[#020001]">
      {/* Ambient Red & Black Glow Effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-rose-700/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative w-full max-w-md bg-black/50 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.85)] animate-fadeIn">
        
        {/* Prominent Circular Logo Badge */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-[#120204] border-2 border-red-500/40 shadow-[0_0_25px_rgba(220,38,38,0.3)] p-3.5 mx-auto flex items-center justify-center ring-4 ring-red-500/10 transition-transform duration-300 hover:scale-105">
            <img
              src={logoImg}
              alt="SK LABA PHONE"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>

          {/* Brand Name directly under logo */}
          <h2 className="mt-4 text-base sm:text-lg font-bold tracking-tight text-white">
            SK Laaba Phone
          </h2>

          {/* Clean Uppercase Sub-heading */}
          <h1 className="mt-1 text-xl sm:text-2xl font-light tracking-[0.25em] text-white/90 uppercase">
            Admin Login
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 rounded-xl backdrop-blur-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form Fields matching the reference design */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Underline Input */}
          <div className="relative group">
            <Mail className="w-5 h-5 text-white/60 absolute left-1 top-3.5 transition-colors group-focus-within:text-red-400" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-white/30 focus:border-red-500 focus:outline-none pl-9 pr-4 py-3 text-sm text-white placeholder-white/50 transition-all font-normal focus:bg-white/5"
            />
          </div>

          {/* Password Underline Input */}
          <div className="relative group">
            <Lock className="w-5 h-5 text-white/60 absolute left-1 top-3.5 transition-colors group-focus-within:text-red-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-white/30 focus:border-red-500 focus:outline-none pl-9 pr-10 py-3 text-sm text-white placeholder-white/50 transition-all font-normal focus:bg-white/5"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-3.5 text-white/60 hover:text-white cursor-pointer transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end text-xs pt-1">
            <Link
              to="/forgot-password"
              className="italic text-white/70 hover:text-white hover:underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Solid Bold Brand-Red Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 active:scale-[0.99] text-white font-bold text-xs tracking-[0.25em] uppercase rounded-lg transition-all shadow-[0_4px_25px_rgba(220,38,38,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border border-red-500/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <span>LOGIN</span>
            )}
          </button>
        </form>

        {/* Developed by Messiora PVT (LTD) Footer */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-center text-[12px] text-white/60 tracking-wider">
          <span>Developed by <span className="font-semibold text-white/90">Messiora PVT (LTD)</span></span>
        </div>
      </div>
    </div>
  );
}
