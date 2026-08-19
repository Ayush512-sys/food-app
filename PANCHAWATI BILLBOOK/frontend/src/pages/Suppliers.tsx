import React, { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import api from '../api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', address: '', gst_number: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchSuppliers = () => {
    api.get(`/billing/suppliers`)
      .then(res => setSuppliers(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/billing/suppliers', formData);
      setIsModalOpen(false);
      setFormData({ name: '', mobile: '', email: '', address: '', gst_number: '' });
      fetchSuppliers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.mobile.includes(searchTerm) ||
    (s.gst_number && s.gst_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="md:h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Search suppliers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
              <thead className="bg-gray-50 dark:bg-zinc-900 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payables</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-800">
                {filteredSuppliers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No suppliers found.</td></tr>
                ) : filteredSuppliers.map((s, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{s.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{s.mobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{s.gst_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600 dark:text-orange-400">₹{s.outstanding_payable || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Supplier</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier Name *</label>
                <input 
                  type="text" required 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
                <input 
                  type="text" required 
                  value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number (Optional)</label>
                <input 
                  type="text" 
                  value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Optional)</label>
                <input 
                  type="email" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address (Optional)</label>
                <textarea 
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                  rows={2}
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

