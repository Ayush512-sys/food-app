// IndexedDB offline storage for Panchawati BillBook

const DB_NAME = 'PanchawatiBillBookDB';
const DB_VERSION = 1;

export interface QueuedInvoice {
  local_id: string;
  created_at: string;
  customerName: string;
  customerMobile: string;
  payload: any;
  items: any[];
  grandTotal: number;
}

export interface QueuedAdjustment {
  local_id: string;
  created_at: string;
  product_id: number;
  product_name?: string;
  location_id: number;
  quantity: number;
  action: string;
  reason?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offline_invoices')) {
        db.createObjectStore('offline_invoices', { keyPath: 'local_id' });
      }
      if (!db.objectStoreNames.contains('offline_adjustments')) {
        db.createObjectStore('offline_adjustments', { keyPath: 'local_id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Products Offline Cache ---
export async function saveProductsOffline(products: any[]): Promise<void> {
  if (!products || !Array.isArray(products)) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    store.clear();
    for (const p of products) {
      store.put(p);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getProductsOffline(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// --- Categories Offline Cache ---
export async function saveCategoriesOffline(categories: any[]): Promise<void> {
  if (!categories || !Array.isArray(categories)) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    store.clear();
    for (const c of categories) {
      store.put(c);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCategoriesOffline(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// --- Offline Invoices Queue ---
export async function queueOfflineInvoice(data: Omit<QueuedInvoice, 'local_id' | 'created_at'>): Promise<string> {
  const db = await openDB();
  const local_id = 'INV-LOCAL-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const queuedItem: QueuedInvoice = {
    ...data,
    local_id,
    created_at: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_invoices', 'readwrite');
    const store = tx.objectStore('offline_invoices');
    store.put(queuedItem);
    tx.oncomplete = () => resolve(local_id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedInvoices(): Promise<QueuedInvoice[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_invoices', 'readonly');
    const store = tx.objectStore('offline_invoices');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedInvoice(local_id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_invoices', 'readwrite');
    const store = tx.objectStore('offline_invoices');
    store.delete(local_id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Offline Stock Adjustments Queue ---
export async function queueOfflineAdjustment(data: Omit<QueuedAdjustment, 'local_id' | 'created_at'>): Promise<string> {
  const db = await openDB();
  const local_id = 'ADJ-LOCAL-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const queuedItem: QueuedAdjustment = {
    ...data,
    local_id,
    created_at: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_adjustments', 'readwrite');
    const store = tx.objectStore('offline_adjustments');
    store.put(queuedItem);
    tx.oncomplete = () => resolve(local_id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedAdjustments(): Promise<QueuedAdjustment[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_adjustments', 'readonly');
    const store = tx.objectStore('offline_adjustments');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedAdjustment(local_id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_adjustments', 'readwrite');
    const store = tx.objectStore('offline_adjustments');
    store.delete(local_id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Update Local Product Stock in IndexedDB ---
export async function updateLocalProductStock(productId: number, quantityChange: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    const req = store.get(productId);

    req.onsuccess = () => {
      const prod = req.result;
      if (prod) {
        if (!prod.inventory || prod.inventory.length === 0) {
          prod.inventory = [{ quantity: 0, location_id: 1 }];
        }
        prod.inventory[0].quantity = Math.max(0, (prod.inventory[0].quantity || 0) + quantityChange);
        store.put(prod);
      }
    };
  } catch (err) {
    console.error('Failed to update local product stock in IndexedDB:', err);
  }
}
