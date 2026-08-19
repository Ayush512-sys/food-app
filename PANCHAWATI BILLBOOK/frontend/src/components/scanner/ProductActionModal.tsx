import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuthStore } from '../../store/useAuthStore';

interface ProductActionModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductActionModal = ({ product, onClose, onSuccess }: ProductActionModalProps) => {
  const [action, setAction] = useState<'Increase' | 'Decrease'>('Increase');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((state) => state.token);

  // Collect device info
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [geoLoc, setGeoLoc] = useState<string>('');

  useEffect(() => {
    // Get basic device type
    const ua = navigator.userAgent;
    let device = "Desktop Browser";
    if (/android/i.test(ua)) device = "Mobile Android";
    if (/iPad|iPhone|iPod/.test(ua)) device = "Mobile iOS";
    setDeviceInfo(device);

    // Try to get geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLoc(`Lat: ${position.coords.latitude.toFixed(4)}, Long: ${position.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          setGeoLoc("Location Denied/Unavailable");
        }
      );
    } else {
      setGeoLoc("Geolocation Not Supported");
    }
  }, []);

  const totalCurrentStock = product.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0;
  // Default to first location for adjustment if multiple exist
  const primaryLocationId = product.inventory?.[0]?.location_id || 1; 

  const handleSubmit = async () => {
    if (!quantity || quantity <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    if (action === 'Decrease' && quantity > totalCurrentStock) {
      setError("Cannot reduce more than current stock!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/inventory/stock/adjust`, {
        product_id: product.id,
        location_id: primaryLocationId,
        quantity: Number(quantity),
        action: action,
        reason: "Mobile Scan Adjustment",
        reference_type: "Mobile Scan",
        device_type: deviceInfo,
        geo_location: geoLoc
      });
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col mx-4 border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
      
      {/* Product Info Header */}
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">
            {product.name}
          </h3>
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ml-3">
            {totalCurrentStock} in stock
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-zinc-500 dark:text-zinc-400">Code:</div>
          <div className="font-medium text-zinc-900 dark:text-white text-right">{product.code}</div>
          
          <div className="text-zinc-500 dark:text-zinc-400">Barcode:</div>
          <div className="font-medium text-zinc-900 dark:text-white text-right">{product.barcode || 'N/A'}</div>
          
          <div className="text-zinc-500 dark:text-zinc-400">Price:</div>
          <div className="font-medium text-green-600 dark:text-green-400 text-right font-bold">₹{product.selling_price}</div>
        </div>
      </div>

      {/* Action Area */}
      <div className="p-6">
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-6">
          <button
            onClick={() => setAction('Increase')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              action === 'Increase' 
                ? 'bg-white dark:bg-zinc-600 shadow-sm text-zinc-900 dark:text-white' 
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
            }`}
          >
            Add Stock
          </button>
          <button
            onClick={() => setAction('Decrease')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              action === 'Decrease' 
                ? 'bg-white dark:bg-zinc-600 shadow-sm text-zinc-900 dark:text-white' 
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
            }`}
          >
            Reduce Stock
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Quantity to {action === 'Increase' ? 'Add' : 'Reduce'}
            </label>
            <div className="text-right">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Total Available</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalCurrentStock} {product.unit || 'pcs'}</span>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="block w-full text-center text-3xl font-bold rounded-xl border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-blue-500 focus:ring-blue-500 py-4 shadow-sm"
              placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="text-zinc-400 font-medium">{product.unit || 'pcs'}</span>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-4 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-sm text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white transition-colors ${
              action === 'Increase' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-red-600 hover:bg-red-700'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
