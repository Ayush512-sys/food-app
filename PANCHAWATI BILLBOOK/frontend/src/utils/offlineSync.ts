import { create } from 'zustand';
import api from '../api';
import {
  getQueuedInvoices,
  removeQueuedInvoice,
  getQueuedAdjustments,
  removeQueuedAdjustment,
  saveProductsOffline,
  saveCategoriesOffline
} from './offlineStorage';
import { useDataStore } from '../store/useDataStore';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  syncMessage: string | null;
  setOnline: (status: boolean) => void;
  updatePendingCount: () => Promise<void>;
  syncAll: () => Promise<{ success: boolean; syncedInvoices: number; syncedAdjustments: number }>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  syncMessage: null,

  setOnline: (status: boolean) => {
    set({ isOnline: status });
    if (status) {
      get().syncAll();
    }
  },

  updatePendingCount: async () => {
    try {
      const [invoices, adjustments] = await Promise.all([
        getQueuedInvoices(),
        getQueuedAdjustments()
      ]);
      set({ pendingCount: invoices.length + adjustments.length });
    } catch (e) {
      console.error('Error counting pending items:', e);
    }
  },

  syncAll: async () => {
    const state = get();
    if (state.isSyncing) return { success: false, syncedInvoices: 0, syncedAdjustments: 0 };
    if (!navigator.onLine) {
      set({ syncMessage: 'Device is offline. Connect to internet to sync.' });
      return { success: false, syncedInvoices: 0, syncedAdjustments: 0 };
    }

    set({ isSyncing: true, syncMessage: 'Syncing offline records with cloud database...' });

    let syncedInvoices = 0;
    let syncedAdjustments = 0;

    try {
      // 1. Sync Stock Adjustments first
      const adjustments = await getQueuedAdjustments();
      for (const adj of adjustments) {
        try {
          await api.post('/inventory/stock/adjust', {
            product_id: adj.product_id,
            location_id: adj.location_id,
            quantity: adj.quantity,
            action: adj.action,
            reason: adj.reason
          });
          await removeQueuedAdjustment(adj.local_id);
          syncedAdjustments++;
        } catch (err: any) {
          console.error(`Failed to sync adjustment ${adj.local_id}:`, err);
          // If server rejects due to negative stock or error, remove or flag
          if (err.response?.status === 400) {
            await removeQueuedAdjustment(adj.local_id);
          }
        }
      }

      // 2. Sync Offline Invoices
      const invoices = await getQueuedInvoices();
      for (const inv of invoices) {
        try {
          await api.post('/billing/invoices', inv.payload);
          await removeQueuedInvoice(inv.local_id);
          syncedInvoices++;
        } catch (err: any) {
          console.error(`Failed to sync invoice ${inv.local_id}:`, err);
          // If server error 400 (validation), avoid blocking
          if (err.response?.status === 400) {
            await removeQueuedInvoice(inv.local_id);
          }
        }
      }

      // 3. Refresh live product & category cache after sync
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/inventory/products'),
          api.get('/inventory/categories')
        ]);
        if (prodRes.data) {
          useDataStore.getState().setProducts(prodRes.data);
          await saveProductsOffline(prodRes.data);
        }
        if (catRes.data) {
          useDataStore.getState().setCategories(catRes.data);
          await saveCategoriesOffline(catRes.data);
        }
      } catch (refreshErr) {
        console.error('Failed to refresh data after sync:', refreshErr);
      }

      const totalSynced = syncedInvoices + syncedAdjustments;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      await state.updatePendingCount();

      set({
        isSyncing: false,
        lastSyncTime: nowStr,
        syncMessage: totalSynced > 0 
          ? `Synced ${syncedInvoices} bill(s) & ${syncedAdjustments} stock adjustment(s)!` 
          : 'Everything is up to date!'
      });

      setTimeout(() => {
        set({ syncMessage: null });
      }, 4000);

      return { success: true, syncedInvoices, syncedAdjustments };
    } catch (globalErr: any) {
      console.error('Global sync error:', globalErr);
      set({
        isSyncing: false,
        syncMessage: 'Sync failed: ' + (globalErr.message || 'Network error')
      });
      return { success: false, syncedInvoices, syncedAdjustments };
    }
  }
}));

// Setup global window event listeners for online/offline
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });

  // Background sync check every 25 seconds
  setInterval(() => {
    const store = useSyncStore.getState();
    if (navigator.onLine) {
      store.updatePendingCount().then(() => {
        if (useSyncStore.getState().pendingCount > 0 && !useSyncStore.getState().isSyncing) {
          store.syncAll();
        }
      });
    }
  }, 25000);
}
