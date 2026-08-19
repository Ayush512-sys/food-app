import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Settings, FileText, ChevronDown, HelpCircle, Tag, AlertCircle, ArrowUpDown, TrendingUp, ArrowLeft, Edit, Trash2, Printer, Activity, X, FolderTree } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import CreateItemModal from '../components/CreateItemModal';
import AdjustStockModal from '../components/AdjustStockModal';
import EditItemModal from '../components/EditItemModal';
import CategoryManagerModal from '../components/CategoryManagerModal';
import QRCode from 'qrcode';
import { useScanner } from '../hooks/useScanner';
import { socket } from '../socket';
import api from '../api';

export default function Inventory() {
  const { products, setProducts, categories, setCategories } = useDataStore();
  const [loading, setLoading] = useState(products.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [catInput, setCatInput] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  
  // Split view state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Item Details');
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const token = useAuthStore(state => state.token);

  useEffect(() => {
    socket.connect();

    socket.on('stock_updated', (data) => {
      fetchData();
    });

    return () => {
      socket.off('stock_updated');
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (activeTab === 'Stock Details' && selectedProduct) {
      const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
          const res = await api.get(`/inventory/products/${selectedProduct.id}/history`);
          setStockHistory(res.data);
        } catch (err) {
          console.error("Failed to fetch history", err);
        } finally {
          setIsHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab, selectedProduct, token]);

  useEffect(() => {
    if (selectedProduct) {
      const value = selectedProduct.code || selectedProduct.id.toString();
      QRCode.toDataURL(value, { width: 150, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [selectedProduct]);

  const fetchData = async () => {
    try {
      const [res, catRes] = await Promise.all([
        api.get(`/inventory/products`),
        api.get(`/inventory/categories`)
      ]);
      setProducts(res.data);
      setCategories(catRes.data);
      // Update selected product if it exists using functional state update
      setSelectedProduct((prevSelected: any) => {
        if (prevSelected) {
          const updated = res.data.find((p: any) => p.id === prevSelected.id);
          return updated ? updated : null;
        }
        return prevSelected;
      });
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useScanner((scannedCode) => {
    const cleanScan = scannedCode.trim().toLowerCase();
    const product = products.find(p => 
      p.code?.trim().toLowerCase() === cleanScan || 
      p.id.toString() === cleanScan
    );
    
    if (product) {
       setSelectedProduct(product);
       setActiveTab('Item Details');
    } else {
       alert(`Scanned item not found in inventory!`);
    }
  });

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
      (p.code && p.code.toLowerCase().includes(sTerm));
    const matchesCat = selectedCategoryFilter ? p.category_id?.toString() === selectedCategoryFilter : true;
    
    let matchesLowStock = true;
    if (showLowStockOnly) {
      const totalQty = p.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
      matchesLowStock = totalQty <= p.min_stock;
    }

    return matchesSearch && matchesCat && matchesLowStock;
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategoryFilter, showLowStockOnly]);

  const paginatedProducts = filteredProducts;



  const handleDeleteProduct = async (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this product? All related stock history and inventory records will also be deleted.')) {
      try {
        await api.delete(`/inventory/products/${product.id}`);
        fetchData();
        setSelectedProduct(null);
      } catch (error) {
        console.error("Failed to delete product", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedItemIds.size} selected item(s)?`)) return;
    
    try {
      await Promise.all(Array.from(selectedItemIds).map(id => 
        axios.delete(`http://:5555/api/inventory/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
      
      setSelectedItemIds(new Set());
      if (selectedProduct && selectedItemIds.has(selectedProduct.id)) {
        setSelectedProduct(null);
      }
      fetchData();
    } catch (err) {
      alert("Failed to delete some products. Please try again.");
      fetchData(); 
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedItemIds(new Set());
    }
  };

  const handleSelectRow = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newSet = new Set(selectedItemIds);
    if (e.target.checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedItemIds(newSet);
  };

  const handlePrintBarcode = () => {
    window.print();
  };

  const totalStockValue = products.reduce((acc, product) => {
    const totalQty = product.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
    const price = product.purchase_price > 0 ? product.purchase_price : product.selling_price;
    return acc + (totalQty * price);
  }, 0);

  const lowStockCount = products.filter(product => {
    const totalQty = product.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
    return totalQty <= product.min_stock;
  }).length;



  // If a product is selected, render the Split View
  if (selectedProduct) {
    const totalQty = selectedProduct.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
    const stockValue = totalQty * selectedProduct.purchase_price;

    return (
      <div className="flex flex-col md:flex-row h-full bg-[#f8f9fa] dark:bg-zinc-950 font-sans overflow-hidden print:bg-white print:overflow-visible">
        
        {/* PRINT ONLY QR LABEL */}
        <div className="hidden print:flex flex-col items-center justify-start w-full max-w-[48mm] mx-auto pt-2 text-black">
          <div className="font-bold text-[14px] mb-1 text-center w-full truncate border-b border-black pb-1">PANCHAWATI</div>
          {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: '110px', height: '110px' }} />}
          <div className="text-[12px] text-center mt-2 font-bold leading-tight w-full break-words">{selectedProduct.name}</div>
          <div className="text-[16px] font-bold mt-1 border-t border-black pt-1 w-full text-center">Rs. {selectedProduct.selling_price}</div>
        </div>

        {/* Left Pane: Master List */}
        <div className="w-full md:w-80 h-1/3 md:h-full flex-shrink-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col print:hidden overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-indigo-300 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Item
            </button>
          </div>
          <div className="flex-col">
            {paginatedProducts.map(product => {
              const qty = product.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
              const isSelected = product.id === selectedProduct.id;
              return (
                <div 
                  key={product.id} 
                  onClick={() => setSelectedProduct(product)}
                  className={`p-4 border-b border-gray-100 dark:border-zinc-800/50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600 dark:bg-indigo-900/10 dark:border-l-indigo-500' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">{product.name}</h4>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 uppercase">
                      In Stock
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{qty} {product.unit}</span>
                  </div>
                </div>
              );
            })}
            {paginatedProducts.length < filteredProducts.length && (
              <div className="p-4 text-center border-t border-gray-100 dark:border-zinc-800">
                <button 
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-md text-sm font-medium transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Detail View */}
        <div className="flex-1 flex flex-col bg-[#f8f9fa] dark:bg-zinc-950 overflow-auto print:hidden">
          {/* Header */}
          <div className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div className="flex items-center">
                <button onClick={() => setSelectedProduct(null)} className="mr-4 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate mr-3">{selectedProduct.name}</h2>
                {totalQty <= 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Out of Stock
                  </span>
                ) : totalQty <= selectedProduct.min_stock ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    Low Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    In Stock
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                <button onClick={handlePrintBarcode} className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700">
                  <Printer className="w-4 h-4 mr-2" /> Print Barcode
                </button>
                <button onClick={() => setIsAdjustStockOpen(true)} className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700">
                  <Activity className="w-4 h-4 mr-2" /> Adjust Stock
                </button>
                <button onClick={() => setIsEditModalOpen(true)} className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </button>
                <button onClick={() => handleDeleteProduct(selectedProduct)} className="flex items-center px-2 py-1.5 border border-red-200 rounded-md text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-6 border-b border-gray-200 dark:border-zinc-800">
              {['Item Details', 'Stock Details', 'Party Wise Report'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                >
                  <span className="flex items-center">
                    {tab === 'Item Details' && <FileText className="w-4 h-4 mr-2" />}
                    {tab === 'Stock Details' && <Tag className="w-4 h-4 mr-2" />}
                    {tab}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6 flex-1 overflow-auto">
            {activeTab === 'Item Details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* General Details */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" /> General Details
                    </h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Item Name</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white uppercase">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Item Code</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.code || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category / Brand</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                        {selectedProduct.category?.name || 'UNCATEGORIZED'} {selectedProduct.brand ? `• ${selectedProduct.brand}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">OEM Number</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.oem_number || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vehicle Compatibility</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.vehicle_compatibility || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Stock</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{totalQty} {selectedProduct.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">Stock Value <HelpCircle className="w-3 h-3 ml-1" /></p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">₹ {stockValue.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Low Stock Quantity</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.min_stock} {selectedProduct.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Low Stock Warning</p>
                      <p className={`text-sm font-medium ${totalQty <= selectedProduct.min_stock ? 'text-orange-500' : 'text-gray-500'}`}>
                        {totalQty <= selectedProduct.min_stock ? 'Active' : 'Normal'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Item Description</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">-</p>
                    </div>
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-gray-400" /> Pricing Details
                      </h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sales Price</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ₹ {selectedProduct.selling_price?.toLocaleString('en-IN')} <span className="text-xs font-normal text-gray-400">With Tax</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Purchase Price</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ₹ {selectedProduct.purchase_price?.toLocaleString('en-IN')} <span className="text-xs font-normal text-gray-400">With Tax</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">GST Tax Rate</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.gst_rate ? `${selectedProduct.gst_rate}%` : 'None'}</p>
                      </div>
                      <div></div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">HSN Code</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.hsn_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Secondary Unit</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.secondary_unit || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Details Component in Detail Tab */}
                  <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-gray-400" /> Stock Details
                      </h3>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Batching</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                        Disabled <span className="text-blue-600 dark:text-blue-400 ml-2 cursor-pointer hover:underline text-xs">Enable →</span>
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}
            
            {activeTab === 'Stock Details' && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                {isHistoryLoading ? (
                  <div className="p-6 text-center text-gray-500">Loading...</div>
                ) : (
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-400 font-medium">
                      <tr>
                        <th className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">Date</th>
                        <th className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">Transaction Type</th>
                        <th className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">Quantity</th>
                        <th className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">Invoice Number</th>
                        <th className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">Closing Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockHistory.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No stock history found.</td></tr>
                      ) : stockHistory.map((history) => (
                        <tr key={history.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                          <td className="px-4 py-3">{new Date(history.date).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                          <td className="px-4 py-3">{history.action}</td>
                          <td className="px-4 py-3">
                            {history.action === 'Decrease' || history.action === 'Damaged' || history.action === 'Missing' 
                              ? `- ${history.quantity}` 
                              : `+ ${history.quantity}`} {selectedProduct.measuring_unit || 'PCS'}
                          </td>
                          <td className="px-4 py-3">{history.reference_id || '-'}</td>
                          <td className="px-4 py-3">{history.new_qty} {selectedProduct.measuring_unit || 'PCS'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {activeTab === 'Party Wise Report' && (
               <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm text-center text-gray-500">
                  Party Wise Report coming soon.
               </div>
            )}
          </div>
        </div>

        <AdjustStockModal isOpen={isAdjustStockOpen} onClose={() => setIsAdjustStockOpen(false)} onStockAdjusted={fetchData} product={selectedProduct} />
        <EditItemModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onItemEdited={fetchData} product={selectedProduct} />
      </div>
    );
  }

  // If no product is selected, render the Full View
  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-zinc-950 font-sans relative md:overflow-hidden overflow-y-auto">
      {/* Desktop Header */}
      <div className="hidden md:flex flex-none justify-between items-center px-6 py-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-20 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Stock Management</h1>
        <div className="flex space-x-4">
          <button 
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Item
          </button>
          
          <button 
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md text-sm font-medium transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 shadow-sm"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <FolderTree className="w-4 h-4 mr-2" />
            Categories
          </button>
        </div>
      </div>

      {/* Mobile Header (Matching Mockup) */}
      <div className="md:hidden flex flex-col px-4 py-3 bg-[#f8f9fa] dark:bg-zinc-950 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Items</h1>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-1.5 border border-indigo-600 text-indigo-600 rounded-md text-xs font-medium dark:border-indigo-500 dark:text-indigo-400">
              <Tag className="w-3 h-3 mr-1" /> Manage Offer
            </button>
            <button className="flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-md text-xs font-medium dark:border-blue-500 dark:text-blue-400">
               Reports <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            <button className="p-1 text-gray-500 dark:text-gray-400">
               <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 md:p-6 md:flex-1 md:min-h-0 flex flex-col pb-32">
        {/* KPI Cards */}
        {/* Desktop KPI Cards */}
        <div className="hidden md:grid grid-cols-3 gap-6 mb-6 flex-shrink-0">
          <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-900/10">
            <p className="text-xs text-gray-500 font-medium mb-1">Total Stock Value</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">₹ {totalStockValue.toLocaleString('en-IN')}</p>
          </div>
          <div 
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`border rounded-xl p-4 cursor-pointer transition-colors ${showLowStockOnly ? 'border-orange-300 bg-orange-100 dark:bg-orange-900/40 dark:border-orange-700' : 'border-orange-100 bg-orange-50/30 dark:border-orange-900/30 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
          >
            <p className="text-xs text-gray-500 font-medium mb-1">Low Stock Items {showLowStockOnly && '(Filtered)'}</p>
            <p className="text-xl font-bold text-orange-600">{lowStockCount}</p>
          </div>
          <div 
            onClick={() => {
              setShowLowStockOnly(false);
              setSearchTerm('');
              setCatInput('');
              setSelectedCategoryFilter('');
            }}
            className={`border rounded-xl p-4 cursor-pointer transition-colors ${!showLowStockOnly && !searchTerm && !selectedCategoryFilter ? 'border-green-300 bg-green-100 dark:bg-green-900/40 dark:border-green-700' : 'border-green-100 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
          >
            <p className="text-xs text-gray-500 font-medium mb-1">Total Items {!showLowStockOnly && !searchTerm && !selectedCategoryFilter && '(Active)'}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{products.length}</p>
          </div>
        </div>

        {/* Mobile KPI Cards (Matching Mockup) */}
        <div className="md:hidden flex flex-col space-y-3 mb-4">
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 shadow-sm dark:border-none dark:bg-[#1a1a1a] rounded-lg">
            <div className="flex flex-col">
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">Stock Value <HelpCircle className="w-3 h-3 ml-1" /></div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">₹ {totalStockValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 shadow-sm dark:border-none dark:bg-[#1a1a1a] rounded-lg">
            <div className="flex flex-col">
              <div className="flex items-center text-orange-500 dark:text-orange-400 text-xs font-medium mb-1"><AlertCircle className="w-3 h-3 mr-1" /> Low Stock</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{lowStockCount}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 shadow-sm dark:border-none dark:bg-[#1a1a1a] rounded-lg">
            <div className="flex flex-col">
              <div className="flex items-center text-red-500 dark:text-red-400 text-xs font-medium mb-1"><AlertCircle className="w-3 h-3 mr-1" /> Items Expiring (30 days)</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">0</div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:bg-white md:dark:bg-zinc-900 md:p-2 md:rounded-lg md:border md:border-gray-200 md:dark:border-zinc-800 flex-shrink-0 mb-4 md:mb-6">
          <div className="flex flex-1 items-center space-x-2 w-full">
            <div className="relative flex-1 md:max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-[#1a1a1a] dark:border-zinc-800 dark:text-white"
                placeholder="Search items by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Mobile Low Stock Filter Button */}
            <button 
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`md:hidden flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors ${showLowStockOnly ? 'bg-indigo-50 border-indigo-600 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-400' : 'bg-white border-gray-300 text-gray-700 dark:bg-[#1a1a1a] dark:border-zinc-800 dark:text-gray-300'}`}
            >
               Low Stock
            </button>

            {/* Desktop Clear Filters */}
            <div className="hidden md:flex">
              {(showLowStockOnly || selectedCategoryFilter || searchTerm) && (
                <button
                  onClick={() => {
                    setShowLowStockOnly(false);
                    setSearchTerm('');
                    setCatInput('');
                    setSelectedCategoryFilter('');
                  }}
                  className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 whitespace-nowrap shadow-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Cascading Filters */}
            <div className="relative flex-shrink-0">
              <input 
                list="category-search-list"
                className="block w-36 md:w-48 pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-300"
                placeholder="Categories..."
                value={catInput}
                onChange={(e) => {
                  setCatInput(e.target.value);
                  const cat = categories.find(c => c.name === e.target.value);
                  setSelectedCategoryFilter(cat ? cat.id.toString() : '');
                }}
              />
              <datalist id="category-search-list">
                {categories.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              {catInput && (
                <button 
                  onClick={() => {
                    setCatInput('');
                    setSelectedCategoryFilter('');
                  }}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center">
              {selectedItemIds.size > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-md text-sm font-medium hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors mr-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedItemIds.size})
                </button>
              )}

              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md text-sm hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800 transition-colors mr-3"
              >
                <Settings className="w-4 h-4 mr-2 text-gray-400" /> Manage Categories
              </button>
              
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Create Item
              </button>
            </div>
          </div>
        </div>

        {/* Table / List View */}
        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
              <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={filteredProducts.length > 0 && selectedItemIds.size === filteredProducts.length}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center cursor-pointer">
                      Item Name <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center cursor-pointer">
                      Stock QTY <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading products...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No items found. Click 'Create Item' to add one.</td>
                  </tr>
                ) : (
                  <>
                  {paginatedProducts.map((product) => {
                    const totalQty = product.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
                    return (
                      <tr 
                        key={product.id} 
                        onClick={() => setSelectedProduct(product)}
                        className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedItemIds.has(product.id)}
                            onChange={(e) => handleSelectRow(product.id, e)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                            {product.name}
                          </div>
                          <div className="text-xs flex items-center mt-1">
                            <span className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                              {product.category?.name || product.brand || 'Uncategorized'}
                            </span>
                            {product.brand && (
                               <span className="bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ml-2">
                                 {product.brand}
                               </span>
                            )}
                            {product.is_batched && (
                               <span className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ml-2">
                                 Batched
                               </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product.item_code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                          {totalQty} <span className="text-xs text-gray-500 font-normal uppercase">{product.unit || 'PCS'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ₹ {product.selling_price?.toLocaleString('en-IN') || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product.purchase_price ? `₹ ${product.purchase_price.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={e => e.stopPropagation()}>
                          <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedProducts.length < filteredProducts.length && (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-center">
                        <button 
                          onClick={() => setPage(p => p + 1)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                        >
                          Load More Products ({filteredProducts.length - paginatedProducts.length} remaining)
                        </button>
                      </td>
                    </tr>
                  )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden flex flex-col divide-y divide-gray-200 dark:divide-zinc-800">
            {paginatedProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">No items found.</div>
            ) : (
              paginatedProducts.map(product => {
                const qty = product.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
                return (
                  <div 
                    key={product.id} 
                    className="p-4 flex flex-col gap-2 active:bg-gray-50 dark:active:bg-zinc-800 cursor-pointer transition-colors" 
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white uppercase leading-tight">{product.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.item_code || 'No Code'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">₹{product.selling_price?.toFixed(2) || '0.00'}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                          qty === 0 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                            : qty < 10 
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {qty} {product.unit || 'PCS'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                        {product.category?.name || product.brand || 'Uncategorized'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="md:hidden fixed bottom-24 right-4 z-30 flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isCreateModalOpen && (
        <CreateItemModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onItemCreated={fetchData}
          existingProducts={products}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryManagerModal 
          isOpen={isCategoryModalOpen} 
          onClose={() => setIsCategoryModalOpen(false)} 
          onCategoriesChanged={fetchData}
        />
      )}
    </div>
  );
}

