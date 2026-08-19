import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Trash2, Tag, FileText } from 'lucide-react';
import api from '../api';

export default function Purchases() {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [bills, setBills] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Add Form State
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  
  // New Supplier Modal State
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', mobile: '', email: '', address: '' });

  const [items, setItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (view === 'list') {
      fetchBills();
    } else {
      api.get('/billing/suppliers').then(res => setSuppliers(res.data)).catch(console.error);
      api.get('/inventory/products').then(res => setProducts(res.data)).catch(console.error);
    }
  }, [view]);

  const fetchBills = () => {
    api.get('/purchases/bills').then(res => setBills(res.data)).catch(console.error);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/billing/suppliers', newSupplier);
      setSuppliers([...suppliers, res.data]);
      setSelectedSupplier(res.data.id.toString());
      setIsAddSupplierModalOpen(false);
      setNewSupplier({ name: '', mobile: '', email: '', address: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add supplier');
    }
  };

  const handleProductSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && productSearch.trim() !== '') {
      e.preventDefault();
      let match = products.find(p => p.barcode?.toLowerCase() === productSearch.toLowerCase() || p.code?.toLowerCase() === productSearch.toLowerCase());
      
      if (!match) {
        const filtered = products.filter(p => 
          p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
          (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase())) ||
          (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase()))
        );
        if (filtered.length === 1) match = filtered[0];
      }

      if (match) handleAddProduct(match);
    }
  };

  const handleAddProduct = (product: any) => {
    const exists = items.find(i => i.product_id === product.id);
    if (exists) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, line_total: (i.quantity + 1) * i.unit_price } : i));
    } else {
      setItems([...items, {
        product_id: product.id,
        name: product.name,
        code: product.code,
        quantity: 1,
        unit_price: product.purchase_price || 0,
        line_total: product.purchase_price || 0
      }]);
    }
    setProductSearch('');
  };

  const handleUpdateItem = (index: number, field: string, value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].line_total = newItems[index].quantity * newItems[index].unit_price;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + item.line_total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return alert("Select a supplier");
    if (items.length === 0) return alert("Add at least one product");
    
    setSubmitting(true);
    try {
      await api.post('/billing/purchases', {
        supplier_id: parseInt(selectedSupplier),
        invoice_number: invoiceNumber || `PB-${Date.now()}`,
        date: invoiceDate,
        total_amount: grandTotal,
        paid_amount: paidAmount === '' ? 0 : paidAmount,
        items: items
      });
      alert('Purchase bill saved successfully!');
      setView('list');
      setItems([]);
      setSelectedSupplier('');
      setInvoiceNumber('');
      setPaidAmount('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save purchase bill');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = productSearch.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase())) ||
    (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 6);

  if (view === 'add') {
    return (
      <div className="md:h-full flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-zinc-400">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Purchase Bill</h2>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Left Side: Product Selection & Bill Items */}
          <div className="lg:w-2/3 flex flex-col space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col h-[500px]">
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search and add products by name or code..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  onKeyDown={handleProductSearchKeyDown}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                />
                
                {/* Search Dropdown */}
                {filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <div 
                        key={product.id}
                        onClick={() => handleAddProduct(product)}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-zinc-700/50 last:border-0"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                          <div className="text-xs text-gray-500 dark:text-zinc-400">{product.code}</div>
                        </div>
                        <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">₹{product.purchase_price}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto border border-gray-200 dark:border-zinc-800 rounded-lg rounded-b-none border-b-0">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Price (₹)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-800">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" min="1" 
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" min="0" 
                            value={item.unit_price}
                            onChange={(e) => handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">₹{item.line_total}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-zinc-500">
                          Search and select products to add to bill
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-800 rounded-b-lg p-4 flex justify-between items-center">
                <span className="font-medium text-gray-700 dark:text-zinc-300">Total Items: {items.length}</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Grand Total: ₹{grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Bill Details */}
          <div className="lg:w-1/3 flex flex-col space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 flex justify-between items-start">
              <div className="w-1/2 pr-4">
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Supplier (From)</label>
                <div className="flex items-center space-x-2">
                  <select 
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Party --</option>
                    {suppliers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setIsAddSupplierModalOpen(true)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors"
                    title="Add New Supplier"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="w-1/3 space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Number (Optional)</label>
                <input 
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Date</label>
                <input 
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Paid Upfront (₹)</label>
                <input 
                  type="number"
                  placeholder="0"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                <button 
                  onClick={handleSubmit}
                  disabled={submitting || items.length === 0 || !selectedSupplier}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save Purchase Bill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Bills</h2>
        <button 
          onClick={() => setView('add')}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Purchase Bill
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
            <thead className="bg-gray-50 dark:bg-zinc-900 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-800">
              {bills.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No purchase bills found.</td></tr>
              ) : bills.map((bill, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(bill.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                      {bill.invoice_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                    {bill.supplier?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {bill.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                    ₹{bill.total_amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add Supplier Modal */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Add New Supplier</h2>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input required type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile *</label>
                <input required type="text" value={newSupplier.mobile} onChange={e => setNewSupplier({...newSupplier, mobile: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" rows={2}></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsAddSupplierModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

