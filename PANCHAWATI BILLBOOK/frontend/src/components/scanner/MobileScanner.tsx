import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ProductActionModal } from './ProductActionModal';
import api from '../../api';
import { useAuthStore } from '../../store/useAuthStore';

export const MobileScanner = ({ onClose, onScan, continuous = false }: { onClose: () => void; onScan?: (barcode: string) => void; continuous?: boolean }) => {
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const token = useAuthStore((state) => state.token);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const lastScannedRef = useRef<{ barcode: string, time: number } | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode;

    const startScanner = async () => {
      if (!isScanning || scannerRef.current) return;
      
      try {
        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // If multiple cameras exist, prefer the back camera (usually last in list on mobile)
          // On laptops, there is usually only 1 camera.
          const cameraId = devices.length > 1 ? devices[devices.length - 1].id : devices[0].id;
          
          await html5QrCode.start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            onScanSuccess,
            onScanFailure
          );
        } else {
          // Fallback if getCameras is empty but API exists
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            onScanSuccess,
            onScanFailure
          );
        }
      } catch (err) {
        console.error("Camera start failed:", err);
        setError("Failed to start camera. Please ensure permissions are granted.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        try {
          // Only attempt to stop if it's currently scanning to prevent errors
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
              scannerRef.current = null;
            }).catch(() => {
              // Ignore stop errors on unmount
              scannerRef.current?.clear();
              scannerRef.current = null;
            });
          } else {
            scannerRef.current.clear();
            scannerRef.current = null;
          }
        } catch (err) {
          console.error("Cleanup error ignored:", err);
          scannerRef.current = null;
        }
      }
    };
  }, [isScanning]);

  const fetchProduct = async (barcode: string) => {
    if (processingRef.current) return;
    
    const now = Date.now();
    if (lastScannedRef.current && lastScannedRef.current.barcode === barcode && (now - lastScannedRef.current.time) < 3000) {
      return;
    }
    
    processingRef.current = true;
    lastScannedRef.current = { barcode, time: now };

    if (onScan) {
      // Custom onScan handler
      onScan(barcode);
      
      if (continuous) {
         setSuccessMsg(`Added item: ${barcode}`);
         setTimeout(() => {
           setSuccessMsg(null);
           processingRef.current = false;
         }, 1500);
      } else {
         onClose();
      }
      return;
    }

    try {
      setError(null);
      const res = await api.get(`/inventory/stock/scan/${barcode}`);
      if (res.data) {
        setIsScanning(false);
        setScannedProduct(res.data);
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          }).catch(console.error);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Product is not available');
    } finally {
      processingRef.current = false;
    }
  };

  const onScanSuccess = (decodedText: string) => {
    fetchProduct(decodedText);
  };

  const onScanFailure = (err: any) => {
    // frequent errors happen on every frame without a barcode, ignore them
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      fetchProduct(manualBarcode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95">
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 shadow-xl">
        <h2 className="text-white text-lg font-semibold tracking-wide">Scan Barcode</h2>
        <button onClick={onClose} className="text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Close
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center overflow-hidden relative">
        {isScanning && !scannedProduct && (
          <div className="w-full max-w-sm px-4">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-zinc-800 bg-black">
              <div id="reader" className="w-full"></div>
            </div>
            
            <form onSubmit={handleManualSubmit} className="mt-8 w-full">
              <div className="flex shadow-lg rounded-xl overflow-hidden border border-zinc-700">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Or enter barcode manually"
                  className="flex-1 bg-zinc-800 text-white px-4 py-4 text-base focus:outline-none placeholder-zinc-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-semibold transition-colors">
                  Search
                </button>
              </div>
              {error && (
                <div className="mt-4 bg-red-900/30 border border-red-500/50 p-3 rounded-xl animate-fade-in">
                  <p className="text-red-400 text-center text-sm font-medium">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="mt-4 bg-green-900/30 border border-green-500/50 p-3 rounded-xl animate-fade-in">
                  <p className="text-green-400 text-center text-sm font-medium">{successMsg}</p>
                </div>
              )}
            </form>
          </div>
        )}

        {scannedProduct && (
          <ProductActionModal 
            product={scannedProduct} 
            onClose={() => {
              setScannedProduct(null);
              setIsScanning(true);
            }} 
            onSuccess={() => {
              setScannedProduct(null);
              setIsScanning(true);
            }}
          />
        )}
      </div>
    </div>
  );
};
