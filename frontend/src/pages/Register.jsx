import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Phone, Hash, Home, ShieldAlert } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    password: '',
    hostel: 'Hostel A',
    roomNumber: '',
    contact: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', formData);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-lg glass border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Brand */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Student Account</h2>
          <p className="text-slate-400 text-xs mt-1">Register for foodback.management Mess Portal</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User size={14} />
              </span>
              <input
                type="text"
                name="name"
                required
                placeholder="Aarav Mehta"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-650 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={14} />
              </span>
              <input
                type="email"
                name="email"
                required
                placeholder="student@domain.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-650 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Roll Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Hash size={14} />
              </span>
              <input
                type="text"
                name="rollNumber"
                required
                placeholder="2026S001"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-650 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={14} />
              </span>
              <input
                type="password"
                name="password"
                required
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-650 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Hostel</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Home size={14} />
              </span>
              <select
                name="hostel"
                value={formData.hostel}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white outline-none appearance-none"
              >
                <option value="Hostel A">Hostel A</option>
                <option value="Hostel B">Hostel B</option>
                <option value="Hostel C">Hostel C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Room Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Home size={14} />
              </span>
              <input
                type="text"
                name="roomNumber"
                required
                placeholder="A-302"
                value={formData.roomNumber}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-650 outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Phone size={14} />
              </span>
              <input
                type="text"
                name="contact"
                required
                placeholder="9876543210"
                value={formData.contact}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-650 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 w-full mt-4 py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-500 hover:underline font-semibold">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
