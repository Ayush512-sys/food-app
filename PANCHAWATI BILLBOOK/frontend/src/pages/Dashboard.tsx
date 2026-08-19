import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  TrendingDown, 
  ArrowRight,
  TrendingUp,
  Download,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const salesData = [
  { name: '27 Jun', sales: 0 },
  { name: '28 Jun', sales: 0 },
  { name: '29 Jun', sales: 0 },
  { name: '30 Jun', sales: 0 },
  { name: '01 Jul', sales: 0 },
  { name: '02 Jul', sales: 0 },
  { name: '03 Jul', sales: 0 },
];

const recentTransactions = [
  { date: '08 Jun 2026', type: 'Sales Invoices', txnNo: '278', party: 'ASHOK KAPSE', amount: '₹ 889' },
  { date: '12 May 2025', type: 'Sales Invoices', txnNo: '277', party: 'PANCHAWATI AUTO', amount: '₹ 1,032' },
  { date: '08 May 2025', type: 'Sales Invoices', txnNo: '276', party: 'PANCHAWATI AUTO', amount: '₹ 2,056' },
  { date: '27 Apr 2025', type: 'Sales Invoices', txnNo: '274', party: 'SHINDE FITTER', amount: '₹ 3,063' },
  { date: '27 Apr 2025', type: 'Sales Invoices', txnNo: '273', party: 'WAGHMARE FITTER', amount: '₹ 279' },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-gray-500 text-sm">
            <span className="mr-2">Last Update: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <button className="text-blue-600 hover:text-blue-700">↻</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Business Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Collect */}
          <div onClick={() => navigate('/sales')} className="border border-green-100 rounded-xl p-5 bg-green-50/30 dark:bg-green-900/10 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
            <div className="flex items-center text-green-600 font-medium text-sm mb-2">
              <TrendingDown className="w-4 h-4 mr-1" />
              To Collect
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">₹ 1,31,658.42</div>
            <ArrowRight className="absolute top-4 right-4 w-5 h-5 text-gray-300 dark:text-gray-600 rotate-[-45deg]" />
          </div>

          {/* To Pay */}
          <div onClick={() => navigate('/purchases')} className="border border-red-100 rounded-xl p-5 bg-red-50/30 dark:bg-red-900/10 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
            <div className="flex items-center text-red-500 font-medium text-sm mb-2">
              <TrendingUp className="w-4 h-4 mr-1" />
              To Pay
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">₹ 3,32,062</div>
            <ArrowRight className="absolute top-4 right-4 w-5 h-5 text-gray-300 dark:text-gray-600 rotate-[-45deg]" />
          </div>

          {/* Total Cash + Bank Balance */}
          <div onClick={() => navigate('/accounting')} className="border border-blue-100 rounded-xl p-5 bg-blue-50/30 dark:bg-blue-900/10 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden">
            <div className="flex items-center text-gray-600 dark:text-gray-400 font-medium text-sm mb-2">
              <IndianRupee className="w-4 h-4 mr-1" />
              Total Cash + Bank Balance
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">₹ 1,27,124.32</div>
            <ArrowRight className="absolute top-4 right-4 w-5 h-5 text-gray-300 dark:text-gray-600 rotate-[-45deg]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Middle Column spanning 2 - Latest Transactions & Sales Report */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Latest Transactions */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Latest Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                <thead className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">DATE</th>
                    <th className="px-4 py-3 font-semibold">TYPE</th>
                    <th className="px-4 py-3 font-semibold">TXN NO</th>
                    <th className="px-4 py-3 font-semibold">PARTY NAME</th>
                    <th className="px-4 py-3 font-semibold">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {recentTransactions.map((tx, idx) => (
                    <tr key={idx} onClick={() => navigate('/sales')} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white">{tx.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{tx.type}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{tx.txnNo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white font-medium">{tx.party}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white font-medium">{tx.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-zinc-800/30 text-center border-t border-gray-200 dark:border-zinc-800">
              <button onClick={() => navigate('/reports')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">See All Transactions</button>
            </div>
          </div>

          {/* Sales Report */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                Sales Report - 27 Jun 2026 to 03 Jul 2026
              </h3>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 text-gray-700 py-1.5 px-4 pr-8 rounded-md leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="flex h-64 w-full">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-700" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} tickFormatter={(val) => `₹ ${val}`} />
                    <Tooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    <Line type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="w-32 flex flex-col justify-end pb-8 text-right space-y-4 border-l border-gray-100 dark:border-zinc-800 pl-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last 7 days sales</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">₹ 0</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Invoices Made</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Checklist */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex flex-col h-full min-h-[400px]">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Today's Checklist</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <div className="w-32 h-32 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl text-yellow-500">⚠️</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Coming Soon...</h4>
              <p className="text-sm">Smarter daily checklist for overdue and follow-ups</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

