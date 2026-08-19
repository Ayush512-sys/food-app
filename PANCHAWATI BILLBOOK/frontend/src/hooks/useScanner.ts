import { useEffect } from 'react';

export function useScanner(onScan: (barcode: string) => void) {
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();
    let timeoutId: any = null;

    const processScan = () => {
      const code = barcodeBuffer.trim();
      if (code.length >= 2) {
        onScan(code);
      }
      barcodeBuffer = '';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

      const currentTime = Date.now();
      
      // If more than 50ms passed since last keystroke, reset buffer
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = '';
      }
      lastKeyTime = currentTime;

      if (timeoutId) clearTimeout(timeoutId);

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 2) {
          // If we are in an input, we let the input do its thing but still process scan
          processScan();
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer += e.key;
        
        // Auto-process after 50ms if no Enter is sent
        timeoutId = setTimeout(() => {
          if (barcodeBuffer.length > 5) { // Only auto-submit long strings to prevent accidental human typing triggers
            processScan();
          }
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onScan]);
}
