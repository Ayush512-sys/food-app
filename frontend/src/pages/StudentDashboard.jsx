import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Star, CalendarCheck, Lock, Unlock, CreditCard, AlertTriangle, QrCode, Bell, Coffee, UtensilsCrossed, Moon as MoonIcon, CheckCircle2, Clock, Send, MessageSquare, Megaphone, Calendar } from 'lucide-react';
import { useSocket } from '../components/SocketContext';
import { QRCodeSVG } from 'qrcode.react';

const api = axios.create();
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const simD = localStorage.getItem('sandbox_enabled') === 'true' ? (localStorage.getItem('sim_date') || new Date().toISOString().split('T')[0]) : null;
  if (simD) config.headers['x-simulated-date'] = simD;
  return config;
});

const getToday = () => {
  if (localStorage.getItem('sandbox_enabled') === 'true') {
    return localStorage.getItem('sim_date') || new Date().toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

const getCurrentHour = () => {
  if (localStorage.getItem('sandbox_enabled') === 'true') {
    const t = localStorage.getItem('sim_time') || '09:30';
    return parseInt(t.split(':')[0], 10);
  }
  return new Date().getHours();
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg ${className}`}>
    {children}
  </div>
);

// ─── MAIN OVERVIEW ─────────────────────────────────────────────────────────────
const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [menu, setMenu] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const socket = useSocket();

  const fetchMenu = () => {
    api.get('/api/menu').then(r => {
      setMenu(r.data.data);
    }).catch(() => {});
  };

  const fetchAnnouncements = () => {
    api.get('/api/announcements').then(r => {
      setAnnouncements(r.data.data);
    }).catch(() => {});
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications/my');
      setNotifications(res.data.data || []);
    } catch {}
  };

  useEffect(() => {
    api.get('/api/students/stats').then(r => setStats(r.data.stats)).catch(() => {});
    fetchMenu();
    fetchAnnouncements();
    fetchNotifications();

    const handleStorage = () => {
      api.get('/api/students/stats').then(r => setStats(r.data.stats)).catch(() => {});
      fetchNotifications();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const todayName = new Date(getToday()).toLocaleDateString('en-US', { weekday: 'long' });
  const todaysMenu = menu?.find(m => m.day === todayName);
  
  const [editMenuModal, setEditMenuModal] = useState(false);
  const [editForm, setEditForm] = useState({ breakfast: '', lunch: '', dinner: '' });

  const handleEditMenuClick = () => {
    if (todaysMenu) {
      setEditForm({ breakfast: todaysMenu.breakfast, lunch: todaysMenu.lunch, dinner: todaysMenu.dinner });
      setEditMenuModal(true);
    }
  };

  const handleUpdateMenu = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/menu/${todaysMenu._id}`, editForm);
      setEditMenuModal(false);
      fetchMenu();
    } catch (err) {
      alert('Failed to update menu');
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('menu_updated', () => fetchMenu());
      socket.on('announcement_created', (ann) => setAnnouncements(prev => [ann, ...prev]));
      socket.on('announcement_updated', (ann) => setAnnouncements(prev => prev.map(a => a._id === ann._id ? ann : a)));
      socket.on('announcement_deleted', (id) => setAnnouncements(prev => prev.filter(a => a._id !== id)));
      socket.on('notification_new', (notif) => {
        if (!notif.targetRole || notif.targetRole === 'Student' || notif.targetRole === 'All') {
          setNotifications(prev => [notif, ...prev]);
        }
      });
    }
    return () => {
      if (socket) {
        socket.off('menu_updated');
        socket.off('announcement_created');
        socket.off('announcement_updated');
        socket.off('announcement_deleted');
        socket.off('notification_new');
      }
    };
  }, [socket]);

  const statCards = stats ? [
    { label: 'Feedback Submitted', value: stats.feedbackSubmitted, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Absent Meals Marked', value: stats.absentMealsMarked, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Due Amount', value: `₹${stats.dueAmount || 0}`, color: stats.dueAmount > 0 ? 'text-red-500' : 'text-emerald-500', bg: stats.dueAmount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
    { label: 'Subscription', value: stats.subscribed ? 'Active' : 'Expired', color: stats.subscribed ? 'text-emerald-500' : 'text-red-500', bg: stats.subscribed ? 'bg-emerald-500/10' : 'bg-red-500/10' }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Welcome back, {user.name || 'Student'} 👋</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Roll: {user.rollNumber} · {user.hostel} · Room {user.roomNumber}</p>
          {(stats?.subscriptionStart || user.subscriptionStart) && (
            <p className="text-xs text-slate-400 mt-2">
              <span className="font-semibold text-slate-500 dark:text-slate-300">Mess Join Date:</span> {new Date(stats?.subscriptionStart || user.subscriptionStart).toLocaleDateString()} &nbsp;·&nbsp; <span className="font-semibold text-slate-500 dark:text-slate-300">End Date:</span> {new Date(stats?.subscriptionEnd || user.subscriptionEnd).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="p-5 hover-lift">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements */}
        {announcements.length > 0 ? (
          <Card className="lg:col-span-2 p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-500 mb-4 flex items-center gap-2">
              <Megaphone size={16} /> Important Announcements
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[250px] pr-2">
              {announcements.map((a, i) => (
                <div key={i} className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-xl border border-amber-500/20">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{a.title}</h4>
                    <span className="text-[10px] text-slate-500">{new Date(a.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{a.message}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">- {a.authorName}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="lg:col-span-2 p-6 flex flex-col items-center justify-center text-slate-400">
            <Megaphone size={24} className="mb-2 opacity-50" />
            <p className="text-xs">No announcements yet.</p>
          </Card>
        )}

        {/* QR Code */}
        <Card className="lg:col-span-1 p-6 text-center">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 justify-center">
            <QrCode size={16} className="text-amber-500" /> Your Mess QR
          </h3>
          <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200">
            <QRCodeSVG value={user.rollNumber || 'STUDENT'} size={150} />
          </div>
          <p className="text-lg font-extrabold text-amber-500 mt-3">{user.rollNumber}</p>
          <p className="text-[10px] text-slate-400 mt-1">Show this QR at mess entrance</p>
        </Card>

        {/* Today's Menu */}
        <Card className="lg:col-span-3 p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <UtensilsCrossed size={16} className="text-amber-500" /> Today's Menu ({todayName})
            </h3>
            {(!todaysMenu || !todaysMenu.breakfast || !todaysMenu.lunch || !todaysMenu.dinner) && todaysMenu && (
              <button onClick={handleEditMenuClick} className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-lg shadow-amber-500/20">
                Suggest / Edit Today's Menu
              </button>
            )}
          </div>
          {todaysMenu ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Breakfast', icon: Coffee, items: todaysMenu.breakfast },
                { label: 'Lunch', icon: UtensilsCrossed, items: todaysMenu.lunch },
                { label: 'Dinner', icon: MoonIcon, items: todaysMenu.dinner }
              ].map((meal, j) => (
                <div key={j} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-2">
                    <meal.icon size={16} className="text-amber-500" />
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 uppercase">{meal.label}</span>
                  </div>
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex-1 font-medium">{meal.items || 'Not given'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Loading today's menu...</p>
          )}
        </Card>
      </div>

      {/* Edit Menu Modal */}
      {editMenuModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Edit {todayName}'s Menu</h2>
            <form onSubmit={handleUpdateMenu} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Breakfast</label>
                <textarea value={editForm.breakfast} onChange={e=>setEditForm({...editForm, breakfast: e.target.value})} required rows={2} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Lunch</label>
                <textarea value={editForm.lunch} onChange={e=>setEditForm({...editForm, lunch: e.target.value})} required rows={2} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Dinner</label>
                <textarea value={editForm.dinner} onChange={e=>setEditForm({...editForm, dinner: e.target.value})} required rows={2} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setEditMenuModal(false)} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all">Save Menu</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Notifications */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Bell size={16} className="text-amber-500" /> Notifications
        </h3>
        {notifications.length === 0 ? <p className="text-xs text-slate-400">No new notifications.</p> : (
          <div className="space-y-3">
            {notifications.slice(0, 5).map((n, i) => (
              <div key={n._id || i} className={`flex items-start gap-3 p-3 rounded-xl border ${n.read ? 'bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Bell size={14} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{n.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{new Date(n.date || Date.now()).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── MARK ABSENCE ──────────────────────────────────────────────────────────────
const MarkAbsence = () => {
  const [date, setDate] = useState(getToday());
  const [endDate, setEndDate] = useState('');
  const [breakfast, setBreakfast] = useState(false);
  const [lunch, setLunch] = useState(false);
  const [dinner, setDinner] = useState(false);
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchStatus(); }, [date]);

  const fetchStatus = async () => {
    try {
      const r = await api.get(`/api/attendance/status?date=${date}`);
      setStatus(r.data.data);
      setBreakfast(r.data.data.breakfast !== 'Present');
      setLunch(r.data.data.lunch !== 'Present');
      setDinner(r.data.data.dinner !== 'Present');
    } catch {}
  };

  const hour = getCurrentHour();
  const today = getToday();
  const isPastDate = date < today;
  const isToday = date === today;
  
  const locks = {
    breakfast: isPastDate || (isToday && hour >= 6),
    lunch: isPastDate || (isToday && hour >= 11),
    dinner: isPastDate || (isToday && hour >= 18)
  };

  const handleSubmit = async () => {
    setLoading(true); setMsg('');
    try {
      const headers = {};
      if (localStorage.getItem('sandbox_enabled') === 'true') {
        headers['x-simulated-time'] = localStorage.getItem('sim_time') || '09:30';
      }
      const body = { date, breakfast, lunch, dinner };
      if (endDate) body.endDate = endDate;
      await api.post('/api/attendance/leave', body, { headers });
      setMsg('Absence updated successfully!');
      fetchStatus();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const MealToggle = ({ label, icon: Icon, checked, onChange, locked, lockText }) => (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${locked ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
            {locked ? <Lock size={10} /> : <Unlock size={10} />}
            {lockText}
          </p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => !locked && onChange(e.target.checked)} disabled={locked} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:ring-2 peer-focus:ring-amber-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
      </label>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Select Dates</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Start Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white focus:ring-amber-500 focus:border-amber-500" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">End Date (Multi-day)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white focus:ring-amber-500 focus:border-amber-500" />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Meal Absence</h3>
        <MealToggle label="Breakfast" icon={Coffee} checked={breakfast} onChange={setBreakfast} locked={locks.breakfast} lockText={locks.breakfast ? (isPastDate ? 'Locked (Past Date)' : 'Locked (past 6:00 AM)') : 'Locks at 6:00 AM'} />
        <MealToggle label="Lunch" icon={UtensilsCrossed} checked={lunch} onChange={setLunch} locked={locks.lunch} lockText={locks.lunch ? (isPastDate ? 'Locked (Past Date)' : 'Locked (past 11:00 AM)') : 'Locks at 11:00 AM'} />
        <MealToggle label="Dinner" icon={MoonIcon} checked={dinner} onChange={setDinner} locked={locks.dinner} lockText={locks.dinner ? (isPastDate ? 'Locked (Past Date)' : 'Locked (past 6:00 PM)') : 'Locks at 6:00 PM'} />
      </Card>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${msg.includes('success') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {msg}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10">
        {loading ? 'Saving...' : 'Update Absence Status'}
      </button>

      {status && (
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-500 mb-2">Current Status for {date}</p>
          <div className="flex gap-3">
            {['breakfast','lunch','dinner'].map(m => (
              <span key={m} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize ${status[m] === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {m}: {status[m]}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── MEAL FEEDBACK ─────────────────────────────────────────────────────────────
const MealFeedback = () => {
  const [mealType, setMealType] = useState('Lunch');
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const r = await api.get('/api/feedback/history');
      setHistory(r.data.data || []);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setMsg('Please select a rating'); return; }
    setLoading(true); setMsg('');
    try {
      await api.post('/api/feedback', { mealType, rating, comments });
      setMsg('Feedback submitted!');
      setRating(0); setComments('');
      fetchHistory();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Star size={16} className="text-amber-500" /> Submit Feedback
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Meal Type</label>
            <select value={mealType} onChange={e => setMealType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white">
              <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-2 block">Rating</label>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                  <Star size={28} className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Comments</label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} required rows={3} placeholder="Share your thoughts about the meal..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white resize-none focus:ring-amber-500 focus:border-amber-500" />
          </div>
          {msg && <p className={`text-xs font-semibold ${msg.includes('submitted') ? 'text-emerald-500' : 'text-red-500'}`}>{msg}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2">
            <Send size={14} /> {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Feedback History</h3>
        {history.length === 0 ? <p className="text-xs text-slate-400">No feedback yet.</p> : (
          <div className="space-y-3">
            {history.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex gap-0.5 shrink-0 mt-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'} />)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">{f.mealType}</span>
                    <span className="text-[10px] text-slate-400">{new Date(f.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{f.comments}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── SUBSCRIPTION & PAYMENTS ───────────────────────────────────────────────────
const Payments = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [history, setHistory] = useState([]);
  const [fee, setFee] = useState(3500);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    fetchHistory(); 
    api.get('/api/payments/fee').then(r => setFee(r.data.messFee)).catch(() => {});
  }, []);

  const fetchHistory = async () => {
    try {
      const r = await api.get('/api/payments/history');
      setHistory(r.data.data || []);
    } catch {}
  };

  const handlePay = async () => {
    setLoading(true); setMsg('');
    try {
      const amountToPay = user.dueAmount > 0 ? user.dueAmount : fee;
      const r = await api.post('/api/payments/pay', { amount: amountToPay });
      setMsg('Payment successful! Subscription extended.');
      if (r.data.user) {
        const u = { ...user, subscribed: r.data.user.subscribed, subscriptionEnd: r.data.user.subscriptionEnd, dueAmount: r.data.user.dueAmount };
        localStorage.setItem('user', JSON.stringify(u));
      }
      fetchHistory();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Subscription Expiry</p>
          <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
            {user.subscriptionEnd ? new Date(user.subscriptionEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
          </p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold ${user.subscribed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {user.subscribed ? 'Active' : 'Expired'}
          </span>
        </Card>
        <Card className="p-6">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Due Amount</p>
          <p className="text-xl font-extrabold text-red-500 mt-1">₹{user.dueAmount || 0}</p>
          <button onClick={handlePay} disabled={loading} className="mt-3 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2">
            <CreditCard size={14} /> {loading ? 'Processing...' : `Pay ₹${user.dueAmount > 0 ? user.dueAmount : fee} Now`}
          </button>
        </Card>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${msg.includes('successful') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {msg}
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Payment History</h3>
        {history.length === 0 ? <p className="text-xs text-slate-400">No payments yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-3 font-semibold text-slate-500">Transaction ID</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500">Amount</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500">Date</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{p.transactionId}</td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-white">₹{p.amount}</td>
                    <td className="py-3 px-3 text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── COMPLAINTS ────────────────────────────────────────────────────────────────
const Complaints = () => {
  const [category, setCategory] = useState('Food');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  useEffect(() => { fetchComplaints(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('complaint_updated', (updatedC) => {
        setComplaints(prev => prev.map(c => c._id === updatedC._id ? updatedC : c));
      });
    }
    return () => {
      if (socket) socket.off('complaint_updated');
    };
  }, [socket]);

  const fetchComplaints = async () => {
    try {
      const r = await api.get('/api/complaints/my');
      setComplaints(r.data.data || []);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await api.post('/api/complaints', { category, title, description });
      setMsg('Complaint submitted!');
      setTitle(''); setDescription('');
      fetchComplaints();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" /> File a Complaint
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white">
              <option>Food</option><option>Hygiene</option><option>Service</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Brief summary of your complaint" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white focus:ring-amber-500 focus:border-amber-500" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3} placeholder="Provide details..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-white resize-none focus:ring-amber-500 focus:border-amber-500" />
          </div>
          {msg && <p className={`text-xs font-semibold ${msg.includes('submitted') ? 'text-emerald-500' : 'text-red-500'}`}>{msg}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2">
            <Send size={14} /> {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">My Complaints</h3>
        {complaints.length === 0 ? <p className="text-xs text-slate-400">No complaints filed yet.</p> : (
          <div className="space-y-3">
            {complaints.map((c, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{c.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-600'}`}>{c.status}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{new Date(c.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{c.description}</p>
                {c.managerReply && (
                  <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-[9px] font-bold text-emerald-600 mb-0.5">Manager Reply:</p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">{c.managerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── WEEKLY MENU COMPONENT ───────────────────────────────────────────────────
const WeeklyMenu = () => {
  const [menu, setMenu] = useState(null);

  const fetchMenu = () => {
    api.get('/api/menu').then(r => setMenu(r.data.data)).catch(() => {});
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
          <Calendar size={18} className="text-amber-500" /> Complete Weekly Menu
        </h3>
        {menu && menu.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {menu.map((m, i) => (
              <div key={i} className={`bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col ${new Date(getToday()).toLocaleDateString('en-US', { weekday: 'long' }) === m.day ? 'ring-2 ring-amber-500' : ''}`}>
                <h4 className="font-bold text-slate-800 dark:text-white mb-3 text-xs flex items-center gap-2">
                  <Calendar size={12} className="text-amber-500" /> {m.day}
                  {new Date(getToday()).toLocaleDateString('en-US', { weekday: 'long' }) === m.day && <span className="ml-auto text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">TODAY</span>}
                </h4>
                <div className="space-y-3 flex-1 flex flex-col">
                  {[
                    { label: 'Breakfast', icon: Coffee, items: m.breakfast },
                    { label: 'Lunch', icon: UtensilsCrossed, items: m.lunch },
                    { label: 'Dinner', icon: MoonIcon, items: m.dinner }
                  ].map((meal, j) => (
                    <div key={j} className="flex-1 flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <meal.icon size={12} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{meal.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 flex-1">{meal.items}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-10">Loading weekly menu...</p>
        )}
      </Card>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/student/menu') return <WeeklyMenu />;
  if (path === '/student/leave') return <MarkAbsence />;
  if (path === '/student/feedback') return <MealFeedback />;
  if (path === '/student/payments') return <Payments />;
  if (path === '/student/complaints') return <Complaints />;
  return <DashboardOverview />;
};

export default StudentDashboard;
