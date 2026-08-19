import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api';
import { useAuthStore } from '../store/useAuthStore';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemEdited: () => void;
  product: any;
}

export default function EditItemModal({ isOpen, onClose, onItemEdited, product }: EditItemModalProps) {
  const [formData, setFormData] = useState({
    name: '', code: '', purchase_price: '', selling_price: '', brand: '', oem_number: '', vehicle_compatibility: '', unit: '', min_stock: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        purchase_price: product.purchase_price?.toString() || '0',
        selling_price: product.selling_price?.toString() || '0',
        brand: product.brand || '',
        oem_number: product.oem_number || '',
        vehicle_compatibility: product.vehicle_compatibility || '',
        unit: product.unit || 'pcs',
        min_stock: product.min_stock?.toString() || '5'
      });
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.put(`/inventory/products/${product.id}`, {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        min_stock: parseInt(formData.min_stock) || 5,
      });
      
      onItemEdited();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-0">
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Item: {product.name}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Item Name</label>
              <input type="text" required className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Item Code</label>
              <input type="text" required className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Brand</label>
              <input type="text" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">OEM Number</label>
              <input type="text" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" value={formData.oem_number} onChange={e => setFormData({...formData, oem_number: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Vehicle Compatibility</label>
              <input type="text" placeholder="ex: Splendor Plus, Activa" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" value={formData.vehicle_compatibility} onChange={e => setFormData({...formData, vehicle_compatibility: e.target.value})} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Purchase Price</label>
              <input type="number" step="0.01" required className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: e.target.value})} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Selling Price</label>
              <input type="number" step="0.01" required className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:border-zinc-600 dark:text-gray-400 dark:hover:bg-zinc-700 dark:hover:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
