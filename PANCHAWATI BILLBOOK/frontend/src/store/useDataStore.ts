import { create } from 'zustand';

interface DataState {
  products: any[];
  categories: any[];
  lastFetch: number;
  setProducts: (products: any[]) => void;
  setCategories: (categories: any[]) => void;
  setLastFetch: (timestamp: number) => void;
}

export const useDataStore = create<DataState>((set) => ({
  products: [],
  categories: [],
  lastFetch: 0,
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setLastFetch: (timestamp) => set({ lastFetch: timestamp }),
}));
