import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { Search, Plus, Trash2, Printer, ChevronDown, ScanLine, Camera, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useScanner } from '../hooks/useScanner';
import { MobileScanner } from '../components/scanner/MobileScanner';
import { queueOfflineInvoice } from '../utils/offlineStorage';
import { useSyncStore } from '../utils/offlineSync';

export default function Billing() {
  const token = useAuthStore(state => state.token);
  const { products, setProducts, categories, setCategories, adjustProductStockLocally, loadOfflineData } = useDataStore();
  const { isOnline, pendingCount, syncAll, isSyncing, syncMessage } = useSyncStore();
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
        console.error('Failed to fetch data for billing, loading offline cache...', err);
        await loadOfflineData();
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
      p.id.toString() === cleanScan ||
      p.barcode?.trim().toLowerCase() === cleanScan ||
      p.sku?.trim().toLowerCase() === cleanScan
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
      p.id.toString() === cleanScan ||
      p.barcode?.trim().toLowerCase() === cleanScan ||
      p.sku?.trim().toLowerCase() === cleanScan
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
      p.id.toString() === cleanScan ||
      p.barcode?.trim().toLowerCase() === cleanScan ||
      p.sku?.trim().toLowerCase() === cleanScan
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
      let customerId = null;
      if (navigator.onLine) {
        try {
          const custRes = await api.post(`/billing/customers`, {
            name: customerName,
            mobile: customerMobile
          }).catch(() => api.get(`/billing/customers`));

          if (custRes?.data?.id) customerId = custRes.data.id;
          else if (Array.isArray(custRes?.data)) {
            const existing = custRes.data.find((c: any) => c.mobile === customerMobile);
            if (existing) customerId = existing.id;
          }
        } catch (e) {
          console.warn('Customer lookup skipped in fallback/offline mode');
        }
      }

      const payload = {
        customer_id: customerId,
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

      let newInvoice: any = null;

      if (!navigator.onLine) {
        // Direct offline flow
        const localId = await queueOfflineInvoice({
          customerName,
          customerMobile,
          payload,
          items: [...items],
          grandTotal
        });

        // Deduct quantities locally immediately
        for (const it of items) {
          if (it.product_id) {
            adjustProductStockLocally(it.product_id, -it.quantity);
          }
        }

        await useSyncStore.getState().updatePendingCount();

        newInvoice = {
          invoice_number: localId,
          customerName,
          customerMobile,
          items: [...items],
          grandTotal,
          gstAmount: Math.round(grandTotal * 0.18),
          finalTotal: grandTotal + Math.round(grandTotal * 0.18),
          isOffline: true
        };
      } else {
        try {
          const invRes = await api.post(`/billing/invoices`, payload);
          newInvoice = {
            ...invRes.data,
            customerName,
            customerMobile,
            items: [...items],
            grandTotal,
            gstAmount: Math.round(grandTotal * 0.18),
            finalTotal: grandTotal + Math.round(grandTotal * 0.18)
          };
          for (const it of items) {
            if (it.product_id) {
              adjustProductStockLocally(it.product_id, -it.quantity);
            }
          }
        } catch (netErr: any) {
          console.warn('Network request failed, saving bill offline:', netErr);
          const localId = await queueOfflineInvoice({
            customerName,
            customerMobile,
            payload,
            items: [...items],
            grandTotal
          });
          for (const it of items) {
            if (it.product_id) {
              adjustProductStockLocally(it.product_id, -it.quantity);
            }
          }
          await useSyncStore.getState().updatePendingCount();

          newInvoice = {
            invoice_number: localId,
            customerName,
            customerMobile,
            items: [...items],
            grandTotal,
            gstAmount: Math.round(grandTotal * 0.18),
            finalTotal: grandTotal + Math.round(grandTotal * 0.18),
            isOffline: true
          };
        }
      }

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
                @page { size: 76mm auto; margin: 0; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace; 
                  padding: 12px; 
                  margin: 0 auto; 
                  max-width: 76mm; 
                  color: #000;
                }
                h1 { text-align: center; font-size: 15px; margin: 0 0 2px 0; font-weight: 800; letter-spacing: 0.5px; }
                p { margin: 2px 0; font-size: 11px; }
                .center { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
                th { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 2px; text-align: left; }
                td { border-bottom: 1px dashed #e5e5e5; padding: 4px 2px; text-align: left; }
                .text-right { text-align: right; }
                .total-section { margin-top: 8px; border-top: 1px dashed #000; padding-top: 6px; }
                .total-row { font-weight: bold; font-size: 13px; }
                .footer { margin-top: 14px; text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 6px; }
              </style>
            </head>
            <body>
              <h1>PANCHAWATI AUTOMOBILES</h1>
              <p class="center" style="font-weight:600;">TAX INVOICE / CASH MEMO</p>
              <p class="center">Receipt: <b>${inv.invoice_number}</b></p>
              <p class="center">Date: ${new Date().toLocaleDateString('en-GB')}</p>
              <p class="center">Customer: ${inv.customerName} (${inv.customerMobile})</p>
              ${inv.isOffline ? '<p class="center" style="color:#d97706; font-size:10px; font-weight:bold;">[OFFLINE INVOICE - SYNC PENDING]</p>' : ''}
              
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="width:28px;">Qty</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${inv.items.map((i: any) => `
                    <tr>
                      <td>${i.name}</td>
                      <td>${i.quantity}</td>
                      <td class="text-right">${i.price}</td>
                      <td class="text-right font-medium">${i.total}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="total-section">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                  <span>Subtotal:</span>
                  <span>Rs. ${inv.grandTotal}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>GST (18%):</span>
                  <span>Rs. ${inv.gstAmount}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px solid #000; padding-top:4px;" class="total-row">
                  <span>Grand Total:</span>
                  <span>Rs. ${inv.finalTotal}</span>
                </div>
              </div>
              
              <div class="footer">
                <p>Thank you for your visit!</p>
                <p>Goods once sold will not be taken back.</p>
              </div>

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
      billSummary += `*TAX INVOICE / CASH MEMO*\n`;
      billSummary += `--------------------------------\n`;
      billSummary += `Receipt: *${inv.invoice_number}*\n`;
      billSummary += `Date: ${new Date().toLocaleDateString('en-GB')}\n`;
      billSummary += `Customer: ${inv.customerName}\n`;
      billSummary += `--------------------------------\n`;
      billSummary += `*Items Details:*\n`;
      inv.items.forEach((i: any, idx: number) => {
        billSummary += `${idx + 1}. ${i.name} - ${i.quantity} x Rs. ${i.price} = Rs. ${i.total}\n`;
      });
      billSummary += `--------------------------------\n`;
      billSummary += `Subtotal: Rs. ${inv.grandTotal}\n`;
      billSummary += `GST (18%): Rs. ${inv.gstAmount}\n`;
      billSummary += `*Total Amount: Rs. ${inv.finalTotal}*\n`;
      billSummary += `--------------------------------\n`;
      billSummary += `Thank you for your business! 🙏\n`;
      billSummary += `*Panchawati BillBook*`;

      let phone = inv.customerMobile.replace(/\D/g, '');
      if (phone.length === 10) phone = '91' + phone;

      const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(billSummary)}` : `https://wa.me/?text=${encodeURIComponent(billSummary)}`;
      window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="md:h-full flex flex-col space-y-4">
      {/* Top Offline / Sync Banner if offline or pending items */}
      {(!isOnline || pendingCount > 0 || syncMessage) && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium ${
          !isOnline 
            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300' 
            : 'bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300'
        }`}>
          <div className="flex items-center space-x-2">
            {!isOnline ? (
              <>
                <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Working in Offline Mode. Invoices & stock deductions are saved locally on this device.</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncMessage || `${pendingCount} offline transaction(s) pending sync`}</span>
              </>
            )}
          </div>
          {isOnline && pendingCount > 0 && (
            <button
              onClick={() => syncAll()}
              disabled={isSyncing}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      )}

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Side: Product Selection & Bill Items */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          {/* Barcode & Search Controls */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Scan or enter barcode / item code..." 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSubmit()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Mobile Camera Scanner Button */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center justify-center px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium text-sm shadow-sm"
                title="Scan with Mobile Camera"
              >
                <Camera className="w-5 h-5 mr-1.5" />
                Scan Camera
              </button>

              {/* Custom Item Button */}
              <button
                type="button"
                onClick={() => setIsCustomItemModalOpen(true)}
                className="flex items-center justify-center px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors font-medium text-sm shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Custom Item
              </button>
            </div>

            {/* Filter by Category & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search item by name, OEM, model..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="relative">
                <input 
                  list="billing-cat-list"
                  placeholder="Filter category..."
                  value={catInput}
                  onChange={(e) => {
                    setCatInput(e.target.value);
                    const found = categories.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                    setSelectedCategoryFilter(found ? found.id.toString() : '');
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <datalist id="billing-cat-list">
                  {categories.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
            </div>
          </div>

          {/* Product Quick-Select Grid if searching */}
          {searchTerm.trim() !== '' && (
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Matching Products ({filteredProducts.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredProducts.slice(0, 8).map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => handleAddProductToBill(prod)}
                    className="flex justify-between items-center p-2.5 border border-gray-100 hover:border-indigo-400 bg-gray-50 dark:bg-zinc-800/60 rounded-lg text-left transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{prod.name}</p>
                      <p className="text-xs text-gray-500">{prod.code || 'No code'}</p>
                    </div>
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 ml-2">₹{prod.selling_price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bill Items Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden flex-1 flex flex-col min-h-[300px]">
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-zinc-900 dark:divide-zinc-800">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                        {item.code && <span className="block text-xs text-gray-500 font-normal">{item.code}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => {
                              if (item.quantity > 1) {
                                const newQty = item.quantity - 1;
                                setItems(items.map((it, i) => i === idx ? { ...it, quantity: newQty, total: newQty * it.price } : it));
                              } else {
                                setItems(items.filter((_, i) => i !== idx));
                              }
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Customer Details</h3>
              <button 
                type="button"
                onClick={() => {
                  setCustomerName('Walk-in Customer');
                  setCustomerMobile('9999999999');
                }}
                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold rounded transition-colors"
                title="Fill Walk-in Cash Customer"
              >
                ⚡ Walk-in / Cash
              </button>
            </div>
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
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Processing...' : 'Complete Payment (Cash)'}
              </button>
              <button 
                onClick={() => { setPaymentMethod('UPI'); handleCreateInvoice(); }}
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
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
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invoice Created!</h3>
              <p className="text-gray-500 dark:text-zinc-400 mb-2">
                Receipt {lastInvoice.invoice_number} has been generated successfully.
              </p>
              {lastInvoice.isOffline && (
                <div className="mb-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  ⚡ Saved Offline (Will automatically sync to server when connected)
                </div>
              )}
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleWhatsAppShare(lastInvoice)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Share on WhatsApp
                </button>
                <button 
                  onClick={() => handlePrint(lastInvoice)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
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
