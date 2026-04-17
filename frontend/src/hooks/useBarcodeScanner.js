import { useState, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export const useBarcodeScanner = (containerId, onScanSuccess, onScanError) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const isInitializing = useRef(false);

  const startScanning = useCallback(async () => {
    if (isInitializing.current || isScanning) return;

    isInitializing.current = true;
    setError(null);

    try {
      // QR Code first (primary), then other formats as fallback
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A,
      ];

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId, {
          formatsToSupport: formatsToSupport,
          verbose: false
        });
      }

      const config = {
        fps: 30,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          // Square box for QR codes
          const size = Math.min(Math.floor(viewfinderWidth * 0.7), Math.floor(viewfinderHeight * 0.7), 300);
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
        disableFlip: false
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          // Play a beep sound on successful scan
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 1000;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.3;
          oscillator.start();
          setTimeout(() => oscillator.stop(), 100);

          if (onScanSuccess) {
            onScanSuccess(decodedText, decodedResult);
          }
        },
        (errorMessage) => {
          // Ignore - this fires constantly when no barcode detected
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err) {
      console.error('Scanner start error:', err);
      setError(err.message || 'Failed to start scanner');
      setHasPermission(false);

      if (onScanError) {
        onScanError(err);
      }
    } finally {
      isInitializing.current = false;
    }
  }, [containerId, isScanning, onScanSuccess, onScanError]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Scanner stop error:', err);
      }
    }
  }, [isScanning]);

  const pauseScanning = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.pause(true); // pause video as well
      } catch (err) {
        console.error('Scanner pause error:', err);
      }
    }
  }, [isScanning]);

  const resumeScanning = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.resume();
      } catch (err) {
        console.error('Scanner resume error:', err);
      }
    }
  }, [isScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, []);

  return {
    isScanning,
    hasPermission,
    error,
    startScanning,
    stopScanning,
    pauseScanning,
    resumeScanning
  };
};

export default useBarcodeScanner;
