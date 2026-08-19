import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, Trash2, FileText } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';

export default function Sales() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customer_id');
  const [view, setView] = useState<'list' | 'add' | 'details'>(initialCustomerId ? 'add' : 'list');
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Add Form State
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomerId || '');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  
  // New Customer Modal State
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', mobile: '', email: '', address: '' });
  
  // Totals & Payment
  const [globalDiscount, setGlobalDiscount] = useState<number | ''>('');
  const [gstRate, setGstRate] = useState<number | ''>(0);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (view === 'list') {
      api.get(`/sales/invoices`).then(res => setInvoices(res.data)).catch(console.error);
    } else {
      api.get('/billing/customers').then(res => setCustomers(res.data)).catch(console.error);
      api.get('/inventory/products').then(res => setProducts(res.data)).catch(console.error);
    }
  }, [view]);

  // Update selected customer if URL changes
  useEffect(() => {
    if (initialCustomerId) {
      setView('add');
      setSelectedCustomer(initialCustomerId);
    }
  }, [initialCustomerId]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/billing/customers', newCustomer);
      setCustomers([...customers, res.data]);
      setSelectedCustomer(res.data.id.toString());
      setIsAddCustomerModalOpen(false);
      setNewCustomer({ name: '', mobile: '', email: '', address: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add customer');
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
        unit_price: product.selling_price || 0,
        line_total: product.selling_price || 0
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

  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const discountVal = globalDiscount === '' ? 0 : globalDiscount;
  const taxableAmount = subtotal - discountVal;
  const gstPercent = gstRate === '' ? 0 : gstRate;
  const gstAmount = (taxableAmount * gstPercent) / 100;
  const grandTotal = taxableAmount + gstAmount;
  
  const selectedCustomerObj = customers.find(c => c.id.toString() === selectedCustomer);
  const previousBalance = selectedCustomerObj?.outstanding_balance || 0;
  
  const paidVal = paidAmount === '' ? 0 : paidAmount;
  const balanceAmount = grandTotal - paidVal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return alert("Select a Customer");
    if (items.length === 0) return alert("Add at least one product");
    
    setSubmitting(true);
    try {
      await api.post('/billing/invoices', {
        customer_id: parseInt(selectedCustomer),
        date: invoiceDate,
        items: items,
        discount: discountVal,
        gst_amount: gstAmount,
        paid_amount: paidVal
      });
      alert('Sales invoice created successfully!');
      
      // Clear URL params
      setSearchParams({});
      setView('list');
      setItems([]);
      setSelectedCustomer('');
      setPaidAmount('');
      setGlobalDiscount('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save invoice');
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
      <div className="md:h-full flex flex-col space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center space-x-4">
            <button onClick={() => { setSearchParams({}); setView('list'); }} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-zinc-400">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Sales Invoice</h2>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => { setSearchParams({}); setView('list'); }} className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
          {/* Main Invoice Area */}
          <div className="lg:w-3/4 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
            {/* Header / Customer Select */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 flex justify-between items-start">
              <div className="w-1/2 pr-4">
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Bill To</label>
                <div className="flex items-center space-x-2">
                  <select 
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Party --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setIsAddCustomerModalOpen(true)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors"
                    title="Add New Customer"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {selectedCustomerObj && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-zinc-400">
                    <div>{selectedCustomerObj.mobile}</div>
                    {selectedCustomerObj.address && <div>{selectedCustomerObj.address}</div>}
                  </div>
                )}
              </div>
              <div className="w-1/3 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Invoice Date</label>
                  <input 
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 flex-1 flex flex-col min-h-[300px]">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search and add items by name or barcode..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  onKeyDown={handleProductSearchKeyDown}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                />
                
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
                          <div className="text-xs text-gray-500 dark:text-zinc-400">{product.code} - {product.inventory?.[0]?.quantity || 0} in stock</div>
                        </div>
                        <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">₹{product.selling_price}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items / Services</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Price/Item (₹)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount (₹)</th>
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
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-zinc-500 border border-dashed border-gray-300 dark:border-zinc-700 m-4 rounded-lg">
                          + Add Item (Scan Barcode or Search)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Side: Totals & Payment */}
          <div className="lg:w-1/4 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-zinc-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{subtotal}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-zinc-400">Add Discount (₹)</span>
                <input 
                  type="number" 
                  value={globalDiscount}
                  onChange={e => setGlobalDiscount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-24 px-2 py-1 border border-gray-300 rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white text-right"
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-zinc-400">GST (%)</span>
                <input 
                  type="number" 
                  value={gstRate}
                  onChange={e => setGstRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-24 px-2 py-1 border border-gray-300 rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white text-right"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              
              {gstAmount > 0 && (
                <div className="flex justify-between items-center text-sm border-t border-gray-100 dark:border-zinc-800 pt-2">
                  <span className="text-gray-600 dark:text-zinc-400">GST Amount</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{gstAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm border-b border-gray-200 dark:border-zinc-800 pb-4">
                <span className="text-gray-600 dark:text-zinc-400">Taxable Amount</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{taxableAmount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">₹{grandTotal}</span>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 space-y-3 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Amount Received</span>
                  <input 
                    type="number" 
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-right font-medium text-green-600 dark:text-green-400"
                    placeholder="0"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Balance Amount</span>
                  <span className={`font-bold ${balanceAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    ₹{balanceAmount}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-gray-500 dark:text-zinc-400">Previous Party Balance</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{previousBalance}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'details' && selectedInvoice) {
    const handlePrint = () => {
      window.print();
    };

    return (
      <div className="md:h-full flex flex-col space-y-4">
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 print:hidden">
          <div className="flex items-center space-x-4">
            <button onClick={() => { setView('list'); setSelectedInvoice(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-zinc-400">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sales Invoice #{selectedInvoice.invoice_number}</h2>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
              selectedInvoice.status === 'Partial' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {selectedInvoice.status}
            </span>
          </div>
          <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center">
            <FileText className="h-4 w-4 mr-2" /> Print PDF
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Invoice A4 Preview (Left/Main) */}
          <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-zinc-950 flex justify-center print:bg-white print:p-0 print:overflow-visible">
            <div className="bg-white p-8 max-w-4xl w-full shadow-lg border border-gray-200 print:shadow-none print:border-none print:max-w-none h-fit">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-indigo-700 mb-1">BILL OF SUPPLY</h1>
                <div className="text-sm text-gray-500 font-medium">ORIGINAL FOR RECIPIENT</div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900">PANCHAWATI AUTO CARE</h2>
                <p className="text-gray-600 text-sm mt-1">Chanda, Newasa, Ahmed Nagar, Maharashtra, 414606</p>
                <p className="text-gray-600 text-sm">Mobile: 9822464346</p>
              </div>
            </div>

            {/* Bill To & Details */}
            <div className="flex justify-between mb-8 border border-gray-200 rounded-lg p-4">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bill To</h3>
                <div className="font-bold text-lg text-gray-900">{selectedInvoice.customer?.name}</div>
                <div className="text-gray-600 mt-1">{selectedInvoice.customer?.mobile}</div>
              </div>
              <div className="flex space-x-12 text-right">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invoice No.</h3>
                  <div className="font-bold text-gray-900">{selectedInvoice.invoice_number}</div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invoice Date</h3>
                  <div className="font-bold text-gray-900">{new Date(selectedInvoice.date || selectedInvoice.created_at || Date.now()).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="bg-indigo-50 border-y border-gray-200">
                  <th className="py-3 px-4 text-left text-xs font-bold text-indigo-900 uppercase">S.No.</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-indigo-900 uppercase">Items</th>
                  <th className="py-3 px-4 text-center text-xs font-bold text-indigo-900 uppercase">Qty</th>
                  <th className="py-3 px-4 text-right text-xs font-bold text-indigo-900 uppercase">Rate</th>
                  <th className="py-3 px-4 text-right text-xs font-bold text-indigo-900 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-b border-gray-200">
                {selectedInvoice.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 text-sm text-gray-600">{idx + 1}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.product?.name || 'Product'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">₹{item.unit_price}</td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900 text-right">₹{item.line_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-between items-start">
              <div className="w-1/2">
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Terms and Conditions</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                  Goods once sold will not be taken back or exchanged.
                </div>
              </div>
              <div className="w-1/3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between mb-2 text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{selectedInvoice.subtotal}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between mb-2 text-sm text-gray-600">
                    <span>Discount</span>
                    <span>-₹{selectedInvoice.discount}</span>
                  </div>
                )}
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <span className="font-bold text-indigo-700 text-lg">₹{selectedInvoice.grand_total}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Received Amount</span>
                    <span className="font-medium text-gray-900">₹{selectedInvoice.paid_amount}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Balance</span>
                    <span className="font-bold text-red-600">₹{selectedInvoice.due_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-gray-200 flex justify-end text-center print:mt-auto">
              <div>
                <div className="w-48 h-12 border-b border-gray-300 border-dashed mb-2"></div>
                <div className="text-sm font-bold text-gray-700">Authorized Signatory</div>
                <div className="text-xs text-gray-500 mt-1">PANCHAWATI AUTO CARE</div>
              </div>
            </div>
            </div>
          </div>
          
          {/* Payment History Sidebar (Right) */}
          <div className="w-80 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 flex flex-col print:hidden overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white">Payment History</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Payment Summary */}
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-zinc-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-zinc-400">Total Bill</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{selectedInvoice.grand_total}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-zinc-400">Total Paid</span>
                  <span className="font-medium text-green-600">₹{selectedInvoice.paid_amount}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-zinc-700">
                  <span className="font-bold text-gray-900 dark:text-white">Remaining Due</span>
                  <span className="font-bold text-red-600">₹{selectedInvoice.due_amount}</span>
                </div>
              </div>

              {/* Add Payment Button (Placeholder for feature) */}
              {selectedInvoice.due_amount > 0 && (
                <button className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-medium hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/50 mb-6 transition-colors flex items-center justify-center">
                  <Plus className="w-4 h-4 mr-2" /> Record Payment
                </button>
              )}

              {/* Transaction Log */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Transactions</h4>
                <div className="space-y-3">
                  {selectedInvoice.paid_amount > 0 ? (
                    <div className="flex justify-between items-center p-3 border border-gray-100 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Payment Received</div>
                        <div className="text-xs text-gray-500">{new Date(selectedInvoice.date || selectedInvoice.created_at || Date.now()).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm font-bold text-green-600">₹{selectedInvoice.paid_amount}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">No payments recorded yet.</div>
                  )}
                </div>
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Invoices</h2>
        <button 
          onClick={() => { setSearchParams({}); setView('add'); }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-900/10">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Sales</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            ₹{invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="border border-green-100 rounded-xl p-4 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/10">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Paid</p>
          <p className="text-xl font-bold text-green-600">
            ₹{invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="border border-orange-100 rounded-xl p-4 bg-orange-50/30 dark:border-orange-900/30 dark:bg-orange-900/10">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Unpaid (Due)</p>
          <p className="text-xl font-bold text-orange-600">
            ₹{invoices.reduce((sum, inv) => sum + (inv.due_amount || 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
            <thead className="bg-gray-50 dark:bg-zinc-900 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-800">
              {invoices.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No invoices found.</td></tr>
              ) : invoices.map((inv, idx) => (
                <tr key={idx} onClick={() => { setSelectedInvoice(inv); setView('details'); }} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{new Date(inv.date || inv.created_at || Date.now()).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{inv.invoice_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{inv.customer?.name || 'Walk-in'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">₹{inv.grand_total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      inv.status === 'Partial' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Add New Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile *</label>
                <input required type="text" value={newCustomer.mobile} onChange={e => setNewCustomer({...newCustomer, mobile: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" rows={2}></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsAddCustomerModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

