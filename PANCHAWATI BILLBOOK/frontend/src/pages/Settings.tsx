import React, { useState } from 'react';
import { User, Briefcase, FileText, Save } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'account' | 'business' | 'invoice'>('account');

  // Dummy states for now (in a real app, fetch from context/API)
  const [account, setAccount] = useState({ name: 'Balasaheb Jawale', mobile: '9822464346', email: 'panchawati4346@gmail.com' });
  const [business, setBusiness] = useState({ name: 'PANCHAWATI AUTO CARE', address: '', gstin: '' });
  const [invoice, setInvoice] = useState({ prefix: 'PB-', terms: 'Thank you for your business!' });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved successfully!');
  };

  return (
    <div className="md:h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex-shrink-0 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800'}`}
          >
            <User className="w-5 h-5 mr-3" /> Account
          </button>
          <button 
            onClick={() => setActiveTab('business')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'business' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800'}`}
          >
            <Briefcase className="w-5 h-5 mr-3" /> Manage Business
          </button>
          <button 
            onClick={() => setActiveTab('invoice')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'invoice' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800'}`}
          >
            <FileText className="w-5 h-5 mr-3" /> Invoice Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-y-auto">
          <form onSubmit={handleSave} className="p-6 md:p-8 max-w-2xl">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-zinc-800 pb-2">Account Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Name *</label>
                    <input required type="text" value={account.name} onChange={e => setAccount({...account, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Mobile Number *</label>
                    <input required type="text" value={account.mobile} onChange={e => setAccount({...account, mobile: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Email</label>
                    <input type="email" value={account.email} onChange={e => setAccount({...account, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-zinc-800 pb-2">Business Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Business Name *</label>
                    <input required type="text" value={business.name} onChange={e => setBusiness({...business, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">GSTIN</label>
                    <input type="text" value={business.gstin} onChange={e => setBusiness({...business, gstin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" placeholder="e.g. 27AADCB2230M1Z2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Business Address</label>
                    <textarea value={business.address} onChange={e => setBusiness({...business, address: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"></textarea>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-zinc-800 pb-2">Invoice Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Invoice Prefix</label>
                    <input type="text" value={invoice.prefix} onChange={e => setInvoice({...invoice, prefix: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" placeholder="e.g. INV-" />
                    <p className="text-xs text-gray-500 mt-1">This prefix will be added to automatically generated invoice numbers.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Default Terms & Conditions</label>
                    <textarea value={invoice.terms} onChange={e => setInvoice({...invoice, terms: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"></textarea>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <button type="submit" className="flex items-center px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

