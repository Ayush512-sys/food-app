import React, { useState, useEffect } from 'react';
import { Search, Plus, X, ArrowUpRight, ArrowDownRight, FileText, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Transactions');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomers = () => {
    api.get(`/billing/customers`)
      .then(res => setCustomers(res.data))
      .catch(console.error);
  };

  const fetchCustomerInvoices = (customerId: number) => {
    // get all invoices and filter
    api.get(`/sales/invoices`)
      .then(res => {
         const filtered = res.data.filter((inv: any) => inv.customer_id === customerId);
         setCustomerInvoices(filtered);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerInvoices(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/billing/customers', formData);
      setIsModalOpen(false);
      setFormData({ name: '', mobile: '', email: '', address: '' });
      fetchCustomers();
      setSelectedCustomer(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add customer');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  return (
    <div className="md:h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Parties (Customers)</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-900/10">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Customers</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
        </div>
        <div className="border border-green-100 rounded-xl p-4 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/10">
          <p className="text-xs text-gray-500 font-medium mb-1">Total to Collect</p>
          <p className="text-xl font-bold text-green-600">
            ₹{customers.reduce((sum, c) => sum + (c.outstanding_balance > 0 ? c.outstanding_balance : 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-4">
        {/* Left Sidebar: Customer List */}
        <div className={`w-full md:w-1/3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex-col h-full ${selectedCustomer ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mb-4"
            >
              <Plus className="mr-2 h-4 w-4" /> Create New Party
            </button>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Party..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredCustomers.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedCustomer(c)}
                className={`p-4 border-b border-gray-100 dark:border-zinc-800/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${selectedCustomer?.id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{c.name}</h4>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 mt-1 block">Customer</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">₹{c.outstanding_balance || 0}</div>
                    {c.outstanding_balance > 0 ? (
                      <span className="text-xs text-red-500 flex items-center justify-end"><ArrowUpRight className="h-3 w-3 mr-1"/> To Collect</span>
                    ) : (
                      <span className="text-xs text-green-500 flex items-center justify-end">Settled</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Main Panel: Customer Details */}
        <div className={`w-full md:w-2/3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex-col h-full overflow-hidden ${!selectedCustomer ? 'hidden md:flex' : 'flex'}`}>
          {selectedCustomer ? (
            <>
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center">
                  <button onClick={() => setSelectedCustomer(null)} className="md:hidden mr-3 p-2 border border-gray-300 rounded-md bg-white text-gray-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 text-sm text-gray-500 dark:text-zinc-400">
                      {selectedCustomer.mobile && <span className="flex items-center mt-1 sm:mt-0"><Phone className="h-4 w-4 mr-1" /> {selectedCustomer.mobile}</span>}
                      {selectedCustomer.email && <span className="flex items-center mt-1 sm:mt-0"><Mail className="h-4 w-4 mr-1" /> {selectedCustomer.email}</span>}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/sales?customer_id=${selectedCustomer.id}`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-5 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center w-full sm:w-auto justify-center"
                >
                  <FileText className="h-4 w-4 mr-2" /> Create Sales Invoice
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-zinc-800 px-6 mt-4 gap-4">
                <button 
                  onClick={() => setActiveTab('Transactions')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'Transactions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
                >
                  Transactions
                </button>
                <button 
                  onClick={() => setActiveTab('Ledger')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'Ledger' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
                >
                  Ledger (Statement)
                </button>
                <button 
                  onClick={() => setActiveTab('Profile')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'Profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
                >
                  Profile
                </button>
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-auto p-6">
                {activeTab === 'Transactions' && (
                  customerInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-zinc-500">
                      <FileText className="h-16 w-16 mb-4 text-gray-300 dark:text-zinc-700" />
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No transactions for the selected time period</p>
                      <p className="text-sm">Click "Create Sales Invoice" to add a new transaction.</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                      <thead className="bg-gray-50 dark:bg-zinc-800/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-800">
                        {customerInvoices.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">{new Date(inv.date || inv.created_at || Date.now()).toLocaleDateString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Sale</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">{inv.invoice_number}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-right">₹{inv.grand_total}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                inv.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                inv.status === 'Partial' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}

                {activeTab === 'Ledger' && (
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                       <span className="font-medium text-gray-700 dark:text-gray-300">Opening Balance:</span>
                       <span className="font-bold text-gray-900 dark:text-white">₹0.00</span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase">Particulars</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-red-600">Debit (-)</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase text-green-600">Credit (+)</th>
                          <th className="px-4 py-3 text-right text-xs font-bold uppercase">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-800">
                        {customerInvoices.length === 0 ? (
                           <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No ledger entries found.</td></tr>
                        ) : customerInvoices.map((inv, idx) => (
                           <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                             <td className="px-4 py-3 text-sm">{new Date(inv.date || inv.created_at || Date.now()).toLocaleDateString()}</td>
                             <td className="px-4 py-3 text-sm">Invoice #{inv.invoice_number}</td>
                             <td className="px-4 py-3 text-sm text-right text-red-600">₹{inv.grand_total}</td>
                             <td className="px-4 py-3 text-sm text-right text-green-600">₹{inv.paid_amount || 0}</td>
                             <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">₹{inv.due_amount}</td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                       <span className="font-medium text-gray-700 dark:text-gray-300">Closing Balance:</span>
                       <span className="font-bold text-gray-900 dark:text-white">₹{selectedCustomer.outstanding_balance} <span className="text-xs text-red-500 ml-2">To Collect</span></span>
                    </div>
                  </div>
                )}
                
                {activeTab === 'Profile' && (
                  <div className="text-gray-500 text-center p-8">Profile details coming soon.</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-zinc-500 p-8 text-center">
              <div className="bg-gray-100 dark:bg-zinc-800 p-6 rounded-full mb-6">
                <Search className="h-12 w-12 text-gray-400 dark:text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Party Selected</h3>
              <p className="max-w-md mx-auto">Select a party from the left menu to view their profile, ledger statement, and transaction history.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Customer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name *</label>
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
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

