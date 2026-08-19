import React, { useState, useEffect } from 'react';
import api from '../api';
import { IndianRupee, TrendingDown, Trash2, Plus } from 'lucide-react';

export default function Accounting() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Expense form
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/accounting/expenses');
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/accounting/expenses', {
        category, amount, payment_mode: paymentMode, remarks
      });
      fetchExpenses();
      setCategory('');
      setAmount('');
      setRemarks('');
      setPaymentMode('Cash');
    } catch (err) {
      alert('Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/accounting/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="p-4 md:p-8 md:h-full flex flex-col md:flex-row gap-6">
      
      {/* Add Expense Form */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Plus className="mr-2 h-5 w-5 text-red-500" />
            Log New Expense
          </h3>
          
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">
                <option value="">Select Category...</option>
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Salaries">Salaries</option>
                <option value="Tea/Snacks">Tea & Snacks</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input type="number" required min="1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-8 p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
              <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white" placeholder="Optional notes" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              {isSubmitting ? 'Saving...' : 'Save Expense'}
            </button>
          </form>
        </div>
      </div>

      {/* Expenses Ledger */}
      <div className="w-full md:w-2/3 flex flex-col">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Expense Ledger</h3>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Expenses</p>
              <p className="text-xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
              <thead className="bg-gray-50 dark:bg-zinc-900 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-800">
                {loading ? (
                  <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-8 text-gray-500">No expenses logged yet.</td></tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{exp.category}</div>
                        <div className="text-xs text-gray-500">{exp.remarks}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">
                        ₹{exp.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exp.payment_mode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleDelete(exp.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

