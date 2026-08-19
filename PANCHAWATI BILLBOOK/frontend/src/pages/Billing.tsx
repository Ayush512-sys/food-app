import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { Search, Plus, Trash2, Printer, ChevronDown, ScanLine, Camera } from 'lucide-react';
import { useScanner } from '../hooks/useScanner';
import { MobileScanner } from '../components/scanner/MobileScanner';

export default function Billing() {
  const token = useAuthStore(state => state.token);
  const { products, setProducts, categories, setCategories } = useDataStore();
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [catInput, setCatInput] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemForm, setCustomItemForm] = useState({ name: '', price: '', quantity: '1' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get(`/inventory/products`),
          api.get(`/inventory/categories`)
        ]);
        setProducts(prodRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error('Failed to fetch data for billing', err);
      }
    };
    fetchData();
  }, [token]);

  // Derived available brands based on selected category filter
  const availableBrands = Array.from(new Set(
    products
      .filter(p => selectedCategoryFilter ? p.category_id?.toString() === selectedCategoryFilter : true)
      .map(p => p.brand)
      .filter(Boolean)
  ));

  const filteredProducts = products.filter(p => {
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch = !sTerm || 
      (p.name && p.name.toLowerCase().includes(sTerm)) || 
      (p.code && p.code.toLowerCase().includes(sTerm)) ||
      (p.vehicle_compatibility && p.vehicle_compatibility.toLowerCase().includes(sTerm)) ||
      (p.oem_number && p.oem_number.toLowerCase().includes(sTerm));
    const matchesCat = selectedCategoryFilter ? p.category_id?.toString() === selectedCategoryFilter : true;
    return matchesSearch && matchesCat;
  });


  const handleAddProductToBill = (product: any) => {
    setItems(prev => {
      const existingItem = prev.find(i => i.product_id === product.id);
      if (existingItem) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i);
      } else {
        return [...prev, {
          product_id: product.id,
          name: product.name,
          code: product.code,
          quantity: 1,
          price: product.selling_price,
          total: product.selling_price
        }];
      }
    });
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemForm.name.trim() || !customItemForm.price || !customItemForm.quantity) return;
    
    const price = parseFloat(customItemForm.price);
    const qty = parseInt(customItemForm.quantity, 10);
    
    setItems(prev => [...prev, {
      product_id: null,
      custom_name: customItemForm.name.trim(),
      name: customItemForm.name.trim() + " (Custom)",
      code: "CUSTOM",
      quantity: qty,
      price: price,
      total: price * qty
    }]);
    
    setCustomItemForm({ name: '', price: '', quantity: '1' });
    setIsCustomItemModalOpen(false);
  };

  useScanner((scannedCode) => {
    const cleanScan = scannedCode.trim().toLowerCase();
    const product = products.find(p => 
      p.code?.trim().toLowerCase() === cleanScan || 
      p.id.toString() === cleanScan
    );
    
    if (product) {
       handleAddProductToBill(product);
    } else {
       alert(`Scanned item not found in inventory!`);
    }
  });

  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) return;
    const cleanScan = barcodeInput.trim().toLowerCase();
    const product = products.find(p => 
      p.code?.trim().toLowerCase() === cleanScan || 
      p.id.toString() === cleanScan
    );
    
    if (product) {
       handleAddProductToBill(product);
       setBarcodeInput('');
    } else {
       alert(`Item code '${barcodeInput}' not found!`);
       setBarcodeInput('');
    }
  };

  const handleCameraScan = (barcode: string) => {
    const cleanScan = barcode.trim().toLowerCase();
    const product = products.find(p => 
      p.code?.trim().toLowerCase() === cleanScan || 
      p.id.toString() === cleanScan
    );
    
    if (product) {
       handleAddProductToBill(product);
    } else {
       alert(`Scanned item '${barcode}' not found in inventory!`);
    }
  };

  const grandTotal = items.reduce((acc, item) => acc + item.total, 0);

  const handleCreateInvoice = async () => {
    if (items.length === 0) return alert('Add at least one item');
    if (!customerName || !customerMobile) return alert('Enter customer details');
    
    setIsSubmitting(true);
    try {
      // 1. Create or get customer
      const custRes = await api.post(`/billing/customers`, {
        name: customerName,
        mobile: customerMobile
      }).catch(err => {
        // If mobile exists, it might fail or we need to handle it. For now, assume it works or we should fetch existing.
        // Quick hack for demo: if it fails, just fetch all and find by mobile
        return api.get(`/billing/customers`);
      });
      
      let customerId = custRes.data?.id;
      if (!customerId && Array.isArray(custRes.data)) {
        const existing = custRes.data.find((c: any) => c.mobile === customerMobile);
        if (existing) customerId = existing.id;
        else throw new Error('Customer creation failed');
      }

      const payload = {
        customer_id: null,
        location_id: 1,
        items: items.map(i => ({
          product_id: i.product_id,
          custom_name: i.custom_name,
          quantity: i.quantity,
          unit_price: i.price,
          line_total: i.total
        })),
        payment_method: paymentMethod,
        paid_amount: parseFloat(paidAmount) || 0,
        discount: 0,
        gst_amount: 0
      };

      const invRes = await api.post(`/billing/invoices`, payload);
      
      const newInvoice = {
         ...invRes.data,
         customerName,
         customerMobile,
         items: [...items],
         grandTotal,
         gstAmount: Math.round(grandTotal * 0.18),
         finalTotal: grandTotal + Math.round(grandTotal * 0.18)
      };
      
      setLastInvoice(newInvoice);

      // Reset POS
      setItems([]);
      setCustomerName('');
      setCustomerMobile('');
      setPaidAmount('');
      
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = (inv: any) => {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${inv.invoice_number}</title>
              <style>
                body { font-family: monospace; padding: 20px; }
                h1 { text-align: center; margin-bottom: 5px; }
                p { margin: 2px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border-bottom: 1px dashed #000; padding: 5px; text-align: left; }
                .text-right { text-align: right; }
                .center { text-align: center; }
                .total-row { font-weight: bold; }
              </style>
            </head>
            <body>
              <h1>PANCHAWATI AUTOMOBILES</h1>
              <p class="center">Receipt: ${inv.invoice_number}</p>
              <p class="center">Customer: ${inv.customerName} (${inv.customerMobile})</p>
              <hr style="border:1px dashed #000" />
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${inv.items.map((i: any) => `
                    <tr>
                      <td>${i.name}</td>
                      <td>${i.quantity}</td>
                      <td>${i.price}</td>
                      <td class="text-right">${i.total}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div style="margin-top:15px; text-align:right;">
                <p>Subtotal: Rs. ${inv.grandTotal}</p>
                <p>GST (18%): Rs. ${inv.gstAmount}</p>
                <h3 style="margin-top:5px;">Grand Total: Rs. ${inv.finalTotal}</h3>
              </div>
              <p class="center" style="margin-top:20px;">Thank you for your business!</p>
              <script>
                window.onload = function() { window.print(); window.close(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
  };

  const handleWhatsAppShare = (inv: any) => {
      let billSummary = `*PANCHAWATI AUTOMOBILES*\n`;
      billSummary += `Receipt: ${inv.invoice_number}\n`;
      billSummary += `Customer: ${inv.customerName}\n\n`;
      billSummary += `*Items:*\n`;
      inv.items.forEach((i: any) => {
        billSummary += `- ${i.name} (${i.quantity}) : Rs. ${i.total}\n`;
      });
      billSummary += `\n*Total: Rs. ${inv.finalTotal}* (inc GST)\n`;
      billSummary += `Thank you for your business!`;

      // if mobile starts with 0 or +91, clean it. We assume Indian numbers (91)
      let phone = inv.customerMobile.replace(/\D/g, '');
      if (phone.length === 10) phone = '91' + phone;

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(billSummary)}`;
      window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="md:h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">POS / Billing</h2>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          <Printer className="mr-2 h-4 w-4" /> Print Previous
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Side: Product Selection & Bill Items */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
            
            {/* Filters Row */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <input 
                  list="billing-category-search-list"
                  className="block w-full pl-3 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300"
                  placeholder="Search Categories..."
                  value={catInput}
                  onChange={(e) => {
                    setCatInput(e.target.value);
                    const cat = categories.find(c => c.name === e.target.value);
                    setSelectedCategoryFilter(cat ? cat.id.toString() : '');
                  }}
                />
                <datalist id="billing-category-search-list">
                  {categories.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Fast Entry Barcode Scanner Row */}
            <div className="flex gap-2">
              <div className="relative flex items-center flex-1">
                <ScanLine className="absolute left-3 h-5 w-5 text-indigo-500" />
                <input 
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-indigo-50/50 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-900/10 dark:border-indigo-800 dark:text-white"
                  placeholder="Scan or type item code here..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeSubmit();
                    }
                  }}
                />
              </div>
              <button 
                onClick={() => setIsCameraOpen(true)}
                className="bg-indigo-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-transform"
                title="Open Camera Scanner"
              >
                <Camera className="h-6 w-6" />
              </button>
            </div>

            {/* Search Row & Custom Item Button */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                  placeholder="Search by name, barcode, OEM, or vehicle (e.g. Splendor Plus)"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsCustomItemModalOpen(true)}
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Add Custom/Manual Item"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
            
            {/* Product Grid - Only show when searching or filtering */}
            {(searchTerm || selectedCategoryFilter) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar mt-4">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => handleAddProductToBill(product)}
                    className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors dark:border-zinc-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20 flex flex-col justify-between h-24"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">{product.name}</h4>
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider block mt-1 line-clamp-1" title={product.vehicle_compatibility}>
                        {product.vehicle_compatibility || product.brand || 'No Brand'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{product.inventory?.[0]?.quantity || 0} in stock</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">₹{product.selling_price}</span>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-6 text-center text-sm text-gray-500 dark:text-zinc-400 border border-dashed border-gray-300 rounded-lg dark:border-zinc-700">
                    No products found. Try adjusting filters.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-zinc-400">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-zinc-400">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-zinc-400">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-zinc-400">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-zinc-400">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-800">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => {
                              const newQty = item.quantity - 1;
                              if (newQty <= 0) setItems(items.filter((_, i) => i !== idx));
                              else setItems(items.map((it, i) => i === idx ? { ...it, quantity: newQty, total: newQty * it.price } : it));
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-zinc-700 rounded-full hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-200 transition-colors font-bold select-none touch-manipulation"
                          >-</button>
                          <span className="w-6 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                          <button 
                            onClick={() => {
                              const newQty = item.quantity + 1;
                              setItems(items.map((it, i) => i === idx ? { ...it, quantity: newQty, total: newQty * it.price } : it));
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-zinc-700 rounded-full hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-200 transition-colors font-bold select-none touch-manipulation"
                          >+</button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">₹{item.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">₹{item.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-600 hover:text-red-900 dark:text-red-400">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-zinc-400">
                        No items added to bill yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Customer & Totals */}
        <div className="flex flex-col space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Details</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Mobile Number" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
              <input type="text" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                <span>Subtotal ({items.length} items)</span>
                <span>₹{grandTotal}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-zinc-400">
                <span>GST (18%)</span>
                <span>+ ₹{Math.round(grandTotal * 0.18)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900 dark:text-white">Grand Total</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{grandTotal + Math.round(grandTotal * 0.18)}</span>
              </div>
              
              <div className="pt-4 pb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Received (₹)</label>
                <input 
                  type="number" 
                  placeholder={`Default: ₹${grandTotal + Math.round(grandTotal * 0.18)}`}
                  value={paidAmount} 
                  onChange={e => setPaidAmount(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-lg font-semibold dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to mark as fully paid.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <button 
                onClick={() => { setPaymentMethod('Cash'); handleCreateInvoice(); }}
                disabled={isSubmitting}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Complete Payment (Cash)'}
              </button>
              <button 
                onClick={() => { setPaymentMethod('UPI'); handleCreateInvoice(); }}
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Complete Payment (UPI)'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      {lastInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invoice Created!</h3>
              <p className="text-gray-500 dark:text-zinc-400 mb-6">
                Receipt {lastInvoice.invoice_number} has been generated successfully.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleWhatsAppShare(lastInvoice)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Share on WhatsApp
                </button>
                <button 
                  onClick={() => handlePrint(lastInvoice)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Print Receipt
                </button>
                <button 
                  onClick={() => setLastInvoice(null)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg font-medium transition-colors"
                >
                  Create New Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal for Billing */}
      {isCameraOpen && (
        <MobileScanner 
          onClose={() => setIsCameraOpen(false)} 
          onScan={handleCameraScan} 
          continuous={true}
        />
      )}

      {/* Custom Item Modal */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Custom Item</h3>
              <button onClick={() => setIsCustomItemModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
            </div>
            <form onSubmit={handleAddCustomItem} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Item Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={customItemForm.name} 
                  onChange={e => setCustomItemForm({...customItemForm, name: e.target.value})}
                  className="w-full border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white p-2 border focus:ring-indigo-500 focus:border-indigo-500" 
                  placeholder="e.g. Labor Charge, Extra Bolt"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    min="0" step="0.01"
                    value={customItemForm.price} 
                    onChange={e => setCustomItemForm({...customItemForm, price: e.target.value})}
                    className="w-full border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white p-2 border focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Qty</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={customItemForm.quantity} 
                    onChange={e => setCustomItemForm({...customItemForm, quantity: e.target.value})}
                    className="w-full border-gray-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white p-2 border focus:ring-indigo-500 focus:border-indigo-500" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 active:scale-95 transition-transform"
              >
                Add to Bill
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

