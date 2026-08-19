import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { X } from 'lucide-react';
import api from '../api';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockAdjusted: () => void;
  product: any;
}

export default function AdjustStockModal({ isOpen, onClose, onStockAdjusted, product }: AdjustStockModalProps) {
  const [formData, setFormData] = useState({
    action: 'Increase',
    quantity: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchLocations = async () => {
        try {
          const locRes = await api.get(`/inventory/locations`);
          setLocations(locRes.data);
          if (locRes.data.length > 0) {
            setLocationId(locRes.data[0].id.toString());
          } else {
            const newLoc = await api.post(`/inventory/locations`, {
              name: 'Main Godown',
              type: 'Main Shop'
            });
            setLocations([newLoc.data]);
            setLocationId(newLoc.data.id.toString());
          }
        } catch (e) {
          console.error("Location fetch failed", e);
        }
      };
      fetchLocations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post(`/inventory/stock/adjust`, {
        product_id: product.id,
        location_id: parseInt(locationId),
        quantity: parseInt(formData.quantity) || 0,
        action: formData.action,
        reason: formData.reason
      });
      
      onStockAdjusted();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 sm:p-0">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adjust Stock: {product?.name}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Action</label>
              <select
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={formData.action}
                onChange={e => setFormData({...formData, action: e.target.value})}
              >
                <option value="Increase">Increase Stock (+)</option>
                <option value="Decrease">Decrease Stock (-)</option>
                <option value="Damaged">Mark as Damaged (-)</option>
              </select>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Quantity ({product?.unit})</label>
              <input
                type="number"
                min="1"
                required
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Reason (Optional)</label>
              <input
                type="text"
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:border-zinc-600 dark:text-gray-400 dark:hover:bg-zinc-700 dark:hover:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">{loading ? 'Saving...' : 'Save Adjustment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
