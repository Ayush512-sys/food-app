import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, Mail, ShieldAlert, Key } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // student, manager, admin
  const [emailOrRoll, setEmailOrRoll] = useState('');
  const [managerId, setManagerId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear old auth
    localStorage.clear();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { role, password };
      if (role === 'student') {
        payload.emailOrRoll = emailOrRoll;
      } else if (role === 'manager') {
        payload.managerId = managerId;
      } else if (role === 'admin') {
        payload.email = adminEmail;
      }

      const res = await axios.post('/api/auth/login', payload);

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // Redirect based on role
        if (role === 'student') navigate('/student/dashboard');
        else if (role === 'manager') navigate('/manager/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden font-sans">
      {/* Visual background accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 items-center justify-center shadow-lg shadow-amber-500/20 text-white font-black text-2xl mb-3">
            F
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">foodback.management</h2>
          <p className="text-slate-400 text-xs mt-1">Mess attendance tracking & waste reduction system</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl mb-6 border border-slate-800">
          {['student', 'manager', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all duration-200 ${
                role === r
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {role === 'student' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email or Roll Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. student@foodback.com or 2026S001"
                  value={emailOrRoll}
                  onChange={(e) => setEmailOrRoll(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>
          )}

          {role === 'manager' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Manager ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Key size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter Manager ID (e.g. manager1)"
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="admin@foodback.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-[10px] text-amber-500 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {role === 'student' && (
          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">
              New Student?{' '}
              <Link to="/register" className="text-amber-500 hover:underline font-semibold">
                Create Account
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
