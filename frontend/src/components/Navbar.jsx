import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Calendar, Clock, Terminal, User, Bell, X, Menu } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { useSocket } from './SocketContext';
import axios from 'axios';

const Navbar = ({ title, onMenuClick }) => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);

  // Sandbox states
  const [simDate, setSimDate] = useState(() => localStorage.getItem('sim_date') || new Date().toISOString().split('T')[0]);
  const [simTime, setSimTime] = useState(() => localStorage.getItem('sim_time') || '09:30');
  const [sandboxEnabled, setSandboxEnabled] = useState(() => localStorage.getItem('sandbox_enabled') === 'true');

  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const simD = localStorage.getItem('sandbox_enabled') === 'true' ? (localStorage.getItem('sim_date') || new Date().toISOString().split('T')[0]) : null;
      const headers = { Authorization: `Bearer ${token}` };
      if (simD) headers['x-simulated-date'] = simD;
      
      const res = await axios.get('/api/notifications/my', { headers });
      setNotifications(res.data.data);
    } catch {}
  };

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      setUser(JSON.parse(userString));
      fetchNotifications();
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('notification_new', (notif) => {
        const role = user?.role || '';
        const capRole = role.charAt(0).toUpperCase() + role.slice(1);
        if (notif.targetRole === 'All' || notif.targetRole === capRole || notif.targetUser === user?.id) {
          setNotifications(prev => [notif, ...prev].slice(0, 5));
          setToast(notif);
          setTimeout(() => setToast(null), 5000);
        }
      });
    }
    return () => {
      if (socket) socket.off('notification_new');
    };
  }, [socket, user]);

  const markAsRead = async (id) => {
    try {
      if (typeof id === 'string' && id.startsWith('expired_')) {
        alert("This notification cannot be dismissed until the student's subscription is renewed in the Students tab.");
        return;
      }
      const token = localStorage.getItem('token');
      await axios.patch(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const handleSandboxToggle = (e) => {
    const checked = e.target.checked;
    setSandboxEnabled(checked);
    localStorage.setItem('sandbox_enabled', checked ? 'true' : 'false');
    // Trigger storage event to notify other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleDateChange = (e) => {
    setSimDate(e.target.value);
    localStorage.setItem('sim_date', e.target.value);
    window.dispatchEvent(new Event('storage'));
    fetchNotifications();
  };

  const handleTimeChange = (e) => {
    setSimTime(e.target.value);
    localStorage.setItem('sim_time', e.target.value);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <nav className="glass border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Title */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-sans flex items-center gap-2">
            🍲 {title}
          </h1>
          {sandboxEnabled && (
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full border border-amber-500/20">
              Sandbox Simulator Active
            </span>
          )}
        </div>
      </div>

      {/* Sandbox Controls Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-100/80 dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-xs md:text-sm">
        <label className="flex items-center gap-2 font-medium cursor-pointer text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={sandboxEnabled}
            onChange={handleSandboxToggle}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-700"
          />
          <Terminal size={14} className="text-amber-500" />
          <span>Simulate Clock</span>
        </label>
        
        {sandboxEnabled && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={simDate}
                onChange={handleDateChange}
                className="bg-transparent border-0 border-b border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:ring-0 p-0 text-slate-700 dark:text-slate-200 w-28 text-xs font-semibold"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              <input
                type="time"
                value={simTime}
                onChange={handleTimeChange}
                className="bg-transparent border-0 border-b border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:ring-0 p-0 text-slate-700 dark:text-slate-200 w-16 text-xs font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Profile, Theme, and Logout */}
      <div className="flex items-center justify-end gap-4 ml-auto md:ml-0 relative">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
          title="Toggle Theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs) {
                const token = localStorage.getItem('token');
                notifications.forEach(async (n) => {
                  if (!n.read && !(typeof n._id === 'string' && n._id.startsWith('expired_'))) {
                    setNotifications(prev => prev.map(notif => notif._id === n._id ? { ...notif, read: true } : notif));
                    try {
                      await axios.patch(`/api/notifications/${n._id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
                    } catch {}
                  }
                });
              }
            }}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all relative"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-800" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Notifications</span>
                {unreadCount > 0 && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">{unreadCount} New</span>}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id} 
                      onClick={() => !n.read && markAsRead(n._id)}
                      className={`p-3 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors ${n.read ? 'opacity-60 bg-transparent' : 'bg-amber-50 dark:bg-amber-900/10'}`}
                    >
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{new Date(n.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {user.name ? user.name[0].toUpperCase() : <User size={16} />}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all hover:scale-105 flex items-center gap-1.5 text-xs font-medium border border-red-500/20"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl p-4 z-[100] animate-fade-in flex items-start gap-3 w-80">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800 dark:text-white">{toast.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"><X size={14}/></button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
