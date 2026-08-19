import React, { useState, useEffect } from 'react';
import api from '../api';
import { UserPlus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuthStore();
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/employees', { name, email, password, role });
      fetchEmployees();
      setName('');
      setEmail('');
      setPassword('');
      setRole('Staff');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">Only Admins can manage employees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 md:h-full flex flex-col md:flex-row gap-6">
      {/* Add Employee Form */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-indigo-500" />
            Add New Employee
          </h3>
          
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Login ID)</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">
                <option value="Staff">Staff (Can Bill/Scan)</option>
                <option value="Admin">Admin (Full Access)</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              {isSubmitting ? 'Adding...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      {/* Employees List */}
      <div className="w-full md:w-2/3 flex flex-col">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Staff</h3>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employees.map((emp) => (
                  <div key={emp.id} className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg flex items-center justify-between bg-white dark:bg-zinc-800/50">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${emp.role === 'Admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-400'}`}>
                        {emp.role === 'Admin' ? <Shield size={20} /> : <UserIcon size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{emp.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">{emp.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${emp.role === 'Admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                          {emp.role}
                        </span>
                      </div>
                    </div>
                    {currentUser?.id !== emp.id && (
                      <button onClick={() => handleDelete(emp.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

