import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle2, ShieldAlert } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/forgot-password', { email, role });
      if (res.data.success) {
        setMessage(res.data.message);
      }
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Reset Password</h2>
          <p className="text-slate-400 text-xs mt-1">We will send a simulated reset link to your email</p>
        </div>

        {message && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 px-3.5 text-xs text-white outline-none appearance-none"
              >
                <option value="student">Student</option>
                <option value="manager">Mess Manager</option>
                <option value="admin">System Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center"
            >
              {loading ? 'Sending Request...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-xs text-amber-500 hover:underline font-semibold">
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
