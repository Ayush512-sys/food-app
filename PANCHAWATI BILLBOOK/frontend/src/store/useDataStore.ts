import { create } from 'zustand';
import { getProductsOffline, getCategoriesOffline, saveProductsOffline, saveCategoriesOffline, updateLocalProductStock } from '../utils/offlineStorage';

interface DataState {
  products: any[];
  categories: any[];
  lastFetch: number;
  setProducts: (products: any[]) => void;
  setCategories: (categories: any[]) => void;
  setLastFetch: (timestamp: number) => void;
  adjustProductStockLocally: (productId: number, deltaQty: number) => void;
  loadOfflineData: () => Promise<boolean>;
}

export const useDataStore = create<DataState>((set, get) => ({
  products: [],
  categories: [],
  lastFetch: 0,
  
  setProducts: (products) => {
    set({ products });
    if (products && products.length > 0) {
      saveProductsOffline(products);
    }
  },

  setCategories: (categories) => {
    set({ categories });
    if (categories && categories.length > 0) {
      saveCategoriesOffline(categories);
    }
  },

  setLastFetch: (timestamp) => set({ lastFetch: timestamp }),

  adjustProductStockLocally: (productId: number, deltaQty: number) => {
    set((state) => {
      const updatedProducts = state.products.map((p) => {
        if (p.id === productId) {
          const currentInv = p.inventory && p.inventory.length > 0 ? p.inventory[0].quantity : 0;
          const newQty = Math.max(0, currentInv + deltaQty);
          const newInv = p.inventory && p.inventory.length > 0 
            ? [{ ...p.inventory[0], quantity: newQty }] 
            : [{ quantity: newQty, location_id: 1 }];
          return { ...p, inventory: newInv };
        }
        return p;
      });
      return { products: updatedProducts };
    });

    updateLocalProductStock(productId, deltaQty);
  },

  loadOfflineData: async () => {
    try {
      const [cachedProds, cachedCats] = await Promise.all([
        getProductsOffline(),
        getCategoriesOffline()
      ]);
      if (cachedProds && cachedProds.length > 0) {
        set({ products: cachedProds });
      }
      if (cachedCats && cachedCats.length > 0) {
        set({ categories: cachedCats });
      }
      return (cachedProds && cachedProds.length > 0);
    } catch (err) {
      console.error('Failed to load offline data from IndexedDB:', err);
      return false;
    }
  }
}));
