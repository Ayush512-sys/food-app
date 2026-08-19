import React, { useState } from 'react';
import api from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { X, Search, ChevronDown, CheckSquare, Square, Info, Plus, FileText as FileTextIcon, Archive as ArchiveIcon, Tag as TagIcon, LayoutGrid as MenuSquareIcon } from 'lucide-react';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: () => void;
  existingProducts?: any[];
}

export default function CreateItemModal({ isOpen, onClose, onItemCreated, existingProducts = [] }: CreateItemModalProps) {
  const token = useAuthStore(state => state.token);
  
  const initialFormState = {
    name: '',
    code: '',
    brand: '',
    oem_number: '',
    vehicle_compatibility: '',
    unit: 'Pieces(PCS)',
    min_stock: '5',
    item_type: 'Product',
    show_online: false,
    batching: false,
    opening_stock: '',
    category_id: '',
    purchase_price: '',
    selling_price: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Basic Details');
  const [categories, setCategories] = useState<any[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get(`/inventory/categories`);
        setCategories(res.data);
        if (res.data.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: res.data[0].id.toString() }));
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Derive suggested brands based on selected category
  const suggestedBrands = Array.from(new Set(
    existingProducts
      .filter(p => formData.category_id ? p.category_id?.toString() === formData.category_id.toString() : true)
      .map(p => p.brand)
      .filter(Boolean)
  ));

  const handleSubmit = async (e?: React.FormEvent, isSaveAndNew = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let categoryId = formData.category_id ? parseInt(formData.category_id) : 1;
      if (!formData.category_id) {
        try {
          const catRes = await api.get(`/inventory/categories`);
          if (catRes.data.length > 0) categoryId = catRes.data[0].id;
          else {
            const newCat = await api.post(`/inventory/categories`, {
              name: 'General', description: 'Default category'
            });
            categoryId = newCat.data.id;
          }
        } catch (e) {
          console.error("Category fetch failed", e);
        }
      }

      const productRes = await api.post(`/inventory/products`, {
        name: formData.name,
        code: formData.code,
        brand: formData.brand,
        oem_number: formData.oem_number,
        vehicle_compatibility: formData.vehicle_compatibility,
        unit: formData.unit.split('(')[0] || 'PCS',
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        min_stock: parseInt(formData.min_stock) || 5,
        category_id: categoryId
      });
      
      const initialStockNum = parseInt(formData.opening_stock);
      if (initialStockNum > 0) {
        let locationId = 1;
        try {
          const locRes = await api.get(`/inventory/locations`);
          if (locRes.data.length > 0) locationId = locRes.data[0].id;
          else {
            const newLoc = await api.post(`/inventory/locations`, { name: 'Main Godown', type: 'Main Shop' });
            locationId = newLoc.data.id;
          }
          await api.post(`/inventory/stock/adjust`, {
            product_id: productRes.data.id,
            location_id: locationId,
            quantity: initialStockNum,
            action: 'Increase',
            reason: 'Opening Stock'
          });
        } catch (err) {
          console.error("Opening stock failed", err);
        }
      }
      
      onItemCreated();
      
      if (isSaveAndNew) {
        setFormData(initialFormState);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['Basic Details', 'Advance Details', 'Stock Details', 'Pricing Details'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-0 font-sans">
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl dark:bg-zinc-900 flex flex-col h-[90vh] sm:h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-zinc-800 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Item</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="md:w-64 flex md:flex-col border-b md:border-b-0 md:border-r border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50 overflow-x-auto md:overflow-y-auto py-2 md:py-4 shrink-0">
            {tabs.map((tab, idx) => {
              if (tab === 'Advance Details') {
                return <div key={tab} className="hidden md:block px-6 py-3 mt-4 text-xs font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider">{tab}</div>;
              }
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 md:w-full text-left px-4 md:px-6 py-3 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border-b-2 md:border-b-0 md:border-l-4 border-indigo-600 dark:border-indigo-500' 
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 border-b-2 md:border-b-0 md:border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center whitespace-nowrap">
                    {tab === 'Basic Details' && <FileTextIcon className="w-4 h-4 mr-3" />}
                    {tab === 'Stock Details' && <ArchiveIcon className="w-4 h-4 mr-3" />}
                    {tab === 'Pricing Details' && <TagIcon className="w-4 h-4 mr-3" />}
                    {tab} {tab === 'Basic Details' && <span className="text-red-500 ml-1">*</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {error && <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
            
            {activeTab === 'Basic Details' && (
              <form className="space-y-6" onSubmit={e => handleSubmit(e, false)}>
                {/* Item Type & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Item Type <span className="text-red-500">*</span></label>
                    <div className="flex items-center space-x-6 mt-3">
                      <label className="flex items-center cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input type="radio" name="item_type" checked={formData.item_type === 'Product'} onChange={() => setFormData({...formData, item_type: 'Product'})} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2 ${formData.item_type === 'Product' ? 'border-indigo-600' : 'border-gray-300'}`}>
                          {formData.item_type === 'Product' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                        </div>
                        Product
                      </label>
                      <label className="flex items-center cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                        <input type="radio" name="item_type" checked={formData.item_type === 'Service'} onChange={() => setFormData({...formData, item_type: 'Service'})} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2 ${formData.item_type === 'Service' ? 'border-indigo-600' : 'border-gray-300'}`}>
                          {formData.item_type === 'Service' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                        </div>
                        Service
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                      {!isAddingCategory && (
                        <button type="button" onClick={() => setIsAddingCategory(true)} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold flex items-center">
                          <Plus className="w-3 h-3 mr-1" /> Add New
                        </button>
                      )}
                    </label>
                    {isAddingCategory ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          placeholder="New Category Name"
                          className="flex-1 rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                        />
                        <button type="button" onClick={async () => {
                          if (!newCategoryName.trim()) return;
                          try {
                            const res = await api.post(`/inventory/categories`, { name: newCategoryName.trim(), description: '' });
                            setCategories([...categories, res.data]);
                            setFormData({...formData, category_id: res.data.id.toString()});
                            setIsAddingCategory(false);
                            setNewCategoryName('');
                          } catch (err) { console.error(err); }
                        }} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">Save</button>
                        <button type="button" onClick={() => setIsAddingCategory(false)} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-300">Cancel</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select 
                          className="block w-full appearance-none rounded-lg border border-gray-300 bg-white p-2.5 pr-8 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300"
                          value={formData.category_id}
                          onChange={e => setFormData({...formData, category_id: e.target.value})}
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Name & Brand */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-end">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Item Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-lg border border-indigo-300 bg-white p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm dark:border-indigo-900 dark:bg-zinc-900 dark:text-white"
                      placeholder="ex: Pulsar 150 Front Shockup"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Brand (Company)</label>
                    <input
                      type="text"
                      list="brand-suggestions"
                      className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      placeholder="ex: Bajaj"
                      value={formData.brand}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                      autoComplete="off"
                    />
                    <datalist id="brand-suggestions">
                      {suggestedBrands.map((b: any) => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                </div>

                {/* Automobile specifics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-end">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">OEM Number</label>
                    <input
                      type="text"
                      className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      placeholder="ex: 1A2B3C"
                      value={formData.oem_number}
                      onChange={e => setFormData({...formData, oem_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Compatibility</label>
                    <input
                      type="text"
                      className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      placeholder="ex: Splendor Plus, HF Deluxe"
                      value={formData.vehicle_compatibility}
                      onChange={e => setFormData({...formData, vehicle_compatibility: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pb-2">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={formData.show_online} onChange={e => setFormData({...formData, show_online: e.target.checked})} />
                      <div className={`block h-6 w-10 rounded-full transition-colors ${formData.show_online ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}></div>
                      <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${formData.show_online ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Show Item in Online Store</span>
                  </label>
                </div>
              </form>
            )}

            {activeTab === 'Stock Details' && (
              <form className="space-y-6" onSubmit={e => handleSubmit(e, false)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-end">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Item Code</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                        placeholder="ex: ITM12549"
                        value={formData.code}
                        onChange={e => setFormData({...formData, code: e.target.value})}
                      />
                      <button type="button" className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap px-2 font-medium">Generate Barcode</button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">HSN code</label>
                    <input
                      type="text"
                      className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                      placeholder="ex: 4010"
                    />
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-700 mt-1 font-medium block">Find HSN Code</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Measuring Unit</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <select className="block w-full appearance-none rounded-lg border border-gray-300 bg-white p-2.5 pl-9 pr-8 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300"
                        value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                        <option>Pieces(PCS)</option>
                        <option>Numbers(NOS)</option>
                        <option>Kilograms(KG)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-700 mt-2 font-medium flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Alternative Unit
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Opening Stock</label>
                    <div className="flex relative">
                      <input
                        type="number"
                        className="block w-full min-w-0 flex-1 rounded-l-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                        placeholder="ex: 150"
                        value={formData.opening_stock}
                        onChange={e => setFormData({...formData, opening_stock: e.target.value})}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800">
                        PCS
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">As of Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
                    <Plus className="w-3 h-3 mr-1" /> Enable Low stock quantity warning <Info className="w-4 h-4 ml-1 text-gray-400" />
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    placeholder="Enter Description"
                  ></textarea>
                </div>
              </form>
            )}

            {activeTab === 'Pricing Details' && (
              <form className="space-y-6" onSubmit={e => handleSubmit(e, false)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sales Price</label>
                    <div className="flex relative">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        className="block w-full min-w-0 flex-1 border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                        placeholder="ex: 200"
                        value={formData.selling_price}
                        onChange={e => setFormData({...formData, selling_price: e.target.value})}
                      />
                      <select className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800">
                        <option>With Tax</option>
                        <option>Without Tax</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Price</label>
                    <div className="flex relative">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        className="block w-full min-w-0 flex-1 border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                        placeholder="ex: 200"
                        value={formData.purchase_price}
                        onChange={e => setFormData({...formData, purchase_price: e.target.value})}
                      />
                      <select className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800">
                        <option>With Tax</option>
                        <option>Without Tax</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">GST Tax Rate(%)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <select className="block w-full appearance-none rounded-lg border border-gray-300 bg-white p-2.5 pl-9 pr-8 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300">
                        <option>None</option>
                        <option>0%</option>
                        <option>5%</option>
                        <option>12%</option>
                        <option>18%</option>
                        <option>28%</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">Discount on Sales Price <Info className="w-4 h-4 ml-1 text-gray-400" /></label>
                    <div className="flex relative">
                      <input
                        type="number"
                        className="block w-full rounded-l-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                        placeholder="ex: 12"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {activeTab !== 'Basic Details' && activeTab !== 'Stock Details' && activeTab !== 'Pricing Details' && (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Fields for {activeTab} will appear here.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <div className="space-x-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Save & New
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
              className="rounded-lg bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 dark:bg-indigo-600 px-6 py-2.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: loading ? '' : '#f5f3ff', color: loading ? '' : '#5b21b6' }} // Light purple matching screenshot
            >
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
