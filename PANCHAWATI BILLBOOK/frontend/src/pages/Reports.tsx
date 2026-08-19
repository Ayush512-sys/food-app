import React, { useState, useEffect } from 'react';
import api from '../api';
import { IndianRupee, TrendingUp, TrendingDown, Package, Activity } from 'lucide-react';

export default function Reports() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [gstData, setGstData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [dashRes, topRes, gstRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/top-products'),
        api.get('/reports/gst')
      ]);
      setDashboardData(dashRes.data);
      setTopProducts(topRes.data);
      setGstData(gstRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return <div className="p-8 flex justify-center items-center h-full">Loading Reports...</div>;
  }

  const profit = dashboardData.totalSales - dashboardData.totalPurchases - dashboardData.totalExpenses;

  return (
    <div className="p-4 md:p-8 h-full overflow-auto space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Overview</h2>
        <button onClick={fetchReports} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          Refresh Data
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Total Sales</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{dashboardData.totalSales.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Purchases</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{dashboardData.totalPurchases.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Expenses</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{dashboardData.totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Net Profit</p>
              <h3 className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                ₹{profit.toLocaleString()}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GST Report */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-indigo-500" />
            GST Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total GST Collected (Sales)</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">₹{gstData?.gstCollected?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total GST Paid (Purchases)</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">₹{gstData?.gstPaid?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
              <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Net GST Liability</span>
              <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
                ₹{((gstData?.gstCollected || 0) - (gstData?.gstPaid || 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Package className="mr-2 h-5 w-5 text-indigo-500" />
            Top Selling Products
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
              <thead>
                <tr>
                  <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                  <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {topProducts.length === 0 ? (
                  <tr><td colSpan={3} className="py-4 text-center text-sm text-gray-500">No sales data yet.</td></tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{p.code}</div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-1 text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">
                          {p.total_sold} units
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                        ₹{p.total_revenue.toLocaleString()}
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

