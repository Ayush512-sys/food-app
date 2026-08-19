import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Users,
  UserCog,
  Building2,
  TrendingUp,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Plus,
  ChevronDown,
  ChevronUp,
  DollarSign,
  BarChart3,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useSocket } from '../components/SocketContext';

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const tabs = [
  { key: 'subscriptions', label: 'Subscription Plans', icon: DollarSign },
  { key: 'managers', label: 'Manage Managers', icon: UserCog },
  { key: 'hostels', label: 'Hostels', icon: Building2 },
  { key: 'revenue', label: 'Revenue Analytics', icon: TrendingUp },
];

const tierColors = {
  Starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Growth: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const Card = ({ children, className = '' }) => (
  <div
    className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-6 ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, className = '' }) => (
  <span
    className={`rounded-full px-3 py-1 text-xs font-bold inline-flex items-center ${className}`}
  >
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/*  ADMIN DASHBOARD                                                    */
/* ------------------------------------------------------------------ */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('subscriptions');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight">
              foodback.management&nbsp;
              <span className="text-amber-500">Admin</span>
            </h1>
          </div>
        </div>

        {/* Tab Bar */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    isActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-500 rounded-t" />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'managers' && <ManagersTab />}
        {activeTab === 'hostels' && <HostelsTab />}
        {activeTab === 'revenue' && <RevenueTab />}
      </main>
    </div>
  );
}

/* ================================================================== */
/*  TAB 1 — SUBSCRIPTION PLANS                                        */
/* ================================================================== */
function SubscriptionsTab() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationDays: '',
    features: '',
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/subscriptions');
      setPlans(data.data ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        price: Number(formData.price),
        durationDays: Number(formData.durationDays),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f)
      };
      
      const { data } = await api.post('/api/admin/subscriptions', payload);
      setPlans(prev => [data.data, ...prev]);
      setFormData({ name: '', price: '', durationDays: '', features: '', isActive: true });
      setShowForm(false);
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await api.delete(`/api/admin/subscriptions/${id}`);
      setPlans(prev => prev.filter(p => p._id !== id));
    } catch {
      /* silent */
    }
  };

  const togglePlanActive = async (plan) => {
    try {
      const { data } = await api.put(`/api/admin/subscriptions/${plan._id}`, { isActive: !plan.isActive });
      setPlans(prev => prev.map(p => p._id === plan._id ? data.data : p));
    } catch {
      /* silent */
    }
  };

  const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition';

  return (
    <div className="space-y-6">
      {/* Add Plan Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Subscription Models</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-md shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Plan
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Collapsible Form */}
      <div className={`grid transition-all duration-300 ease-in-out ${showForm ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <Card>
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Plan Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required placeholder="Monthly Basic" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Price (₹)</label>
                <input name="price" type="number" value={formData.price} onChange={handleChange} required placeholder="3000" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Duration (Days)</label>
                <input name="durationDays" type="number" value={formData.durationDays} onChange={handleChange} required placeholder="30" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Features (comma separated)</label>
                <input name="features" value={formData.features} onChange={handleChange} placeholder="Breakfast, Lunch, Dinner" className={inputCls} />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 mt-2">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} id="isActive" className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">Set as Active immediately</label>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-amber-500/20 transition">
                  {submitting ? 'Saving…' : 'Save Plan'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Grid of Plans */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">Loading…</div>
      ) : plans.length === 0 ? (
        <Card className="text-center py-12 text-slate-400">No subscription plans found. Create one above.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card key={plan._id} className="flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 inset-x-0 h-1 ${plan.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
              <div className="flex justify-between items-start mt-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{plan.name}</h3>
                <Badge className={plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-extrabold">₹{plan.price}</span>
                <span className="text-slate-500 text-sm font-medium"> / {plan.durationDays} days</span>
              </div>
              
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Features Included</p>
                <ul className="space-y-2">
                  {plan.features?.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {f}
                    </li>
                  ))}
                  {(!plan.features || plan.features.length === 0) && (
                    <li className="text-sm text-slate-400 italic">No specific features listed</li>
                  )}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <button onClick={() => togglePlanActive(plan)} className={`text-sm font-semibold flex items-center gap-1 ${plan.isActive ? 'text-slate-500 hover:text-slate-700' : 'text-emerald-600 hover:text-emerald-700'}`}>
                  {plan.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => deletePlan(plan._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB 2 — MANAGE MANAGERS                                           */
/* ================================================================== */
function ManagersTab() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    managerId: '',
    hostel: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/managers');
      setManagers(Array.isArray(data) ? data : data.managers ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const { data } = await api.post('/api/admin/managers', formData);
      setManagers((prev) => [...prev, data.manager ?? data]);
      setFormData({ name: '', managerId: '', hostel: '', password: '' });
      setShowForm(false);
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  const deleteManager = async (id) => {
    if (!window.confirm('Are you sure you want to delete this manager?')) return;
    try {
      await api.delete(`/api/admin/managers/${id}`);
      setManagers((prev) => prev.filter((m) => m._id !== id));
    } catch {
      /* silent */
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition';

  return (
    <div className="space-y-6">
      {/* Add Manager Toggle */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-md shadow-amber-500/20 transition"
      >
        <Plus className="w-4 h-4" />
        Add Manager
        {showForm ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Collapsible Form */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showForm ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <Card>
            <form
              onSubmit={handleSubmit}
              className="grid sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Manager ID
                </label>
                <input
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleChange}
                  required
                  placeholder="MGR-001"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Hostel
                </label>
                <input
                  name="hostel"
                  value={formData.hostel}
                  onChange={handleChange}
                  required
                  placeholder="Hostel A"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-amber-500/20 transition"
                >
                  {submitting ? 'Saving…' : 'Save Manager'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden !p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50/60 dark:bg-slate-800/60">
                <tr>
                  {['Name', 'Manager ID', 'Hostel', ''].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                        i === 3 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {managers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      No managers found.
                    </td>
                  </tr>
                ) : (
                  managers.map((m) => (
                    <tr
                      key={m._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                        {m.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {m.managerId}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {m.hostel}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-right">
                        <button
                          onClick={() => deleteManager(m._id)}
                          title="Delete manager"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  TAB 3 — HOSTELS                                                    */
/* ================================================================== */
function HostelsTab() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/admin/hostels');
        setHostels(Array.isArray(data) ? data : data.hostels ?? []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Loading…
      </div>
    );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {hostels.length === 0 && (
        <p className="col-span-full text-center text-slate-400 py-12">
          No hostels found.
        </p>
      )}
      {hostels.map((h) => (
        <Card key={h._id} className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold">{h.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Code: {h.code}
              </p>
            </div>
            <Badge
              className={
                h.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }
            >
              {h.status ?? 'N/A'}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Manager</span>
              <span className="font-medium">{h.manager ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Plan</span>
              <Badge className={tierColors[h.plan] ?? tierColors.Starter}>
                {h.plan ?? 'Starter'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">MRR</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                ₹{h.mrr ?? 0}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  TAB 4 — REVENUE ANALYTICS                                         */
/* ================================================================== */
function RevenueTab() {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/admin/revenue');
        setRevenue(data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Loading…
      </div>
    );

  if (!revenue)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
        <AlertCircle className="w-6 h-6" />
        <span>Unable to load revenue data.</span>
      </div>
    );

  const salesTrends = revenue.salesTrends ?? [];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total MRR
            </p>
            <p className="text-2xl font-bold">
              ₹{(revenue.totalMRR ?? 0).toLocaleString()}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total Revenue Collected
            </p>
            <p className="text-2xl font-bold">
              ₹{(revenue.totalRevenueCollected ?? 0).toLocaleString()}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Subscriptions
            </p>
            <p className="text-2xl font-bold">
              {revenue.totalSubscriptions ?? '—'}
            </p>
          </div>
        </Card>
      </div>

      {/* Bar Chart */}
      {salesTrends.length > 0 && (
        <Card>
          <h3 className="text-base font-semibold mb-4">Revenue Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrends}>
                <defs>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-700"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  className="text-slate-500 dark:text-slate-400"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-slate-500 dark:text-slate-400"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: 'none',
                    boxShadow: '0 4px 24px rgba(0,0,0,.12)',
                  }}
                  cursor={{ fill: 'rgba(245,158,11,0.08)' }}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#amberGrad)"
                  radius={[8, 8, 0, 0]}
                  barSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Subscription Breakdown */}
      {revenue.subscriptionBreakdown && (
        <Card>
          <h3 className="text-base font-semibold mb-4">
            Subscription Breakdown
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {Object.entries(revenue.subscriptionBreakdown).map(
              ([tier, count]) => (
                <div
                  key={tier}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40"
                >
                  <Badge className={tierColors[tier] ?? tierColors.Starter}>
                    {tier}
                  </Badge>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              )
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
