import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import axios from "axios";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  FiCamera,
  FiCameraOff,
  FiEdit3,
  FiShoppingCart,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiAlertCircle,
  FiCheckCircle,
  FiUpload,
  FiSmartphone,
  FiCreditCard
} from "react-icons/fi";
import { useCartContext } from "./context/cart_context";
import FormatPrice from "./Helpers/FormatPrice";
import API_BASE_URL from "./config/api";

const InStoreCheckout = () => {
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [scanFeedback, setScanFeedback] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanCooldownRef = useRef(false);
  const { addToCart, clearCart } = useCartContext();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  // Scan barcode from uploaded image file
  const scanFromFile = async (file) => {
    if (!file) return;

    setIsProcessing(true);
    setScannerError(null);

    try {
      const html5QrCode = new Html5Qrcode("file-scanner-temp", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
        ],
        verbose: false
      });

      const result = await html5QrCode.scanFile(file, true);
      await html5QrCode.clear();

      if (result) {
        handleScanSuccess(result);
      }
    } catch (error) {
      console.error('File scan error:', error);
      toast.error('Could not read QR code from image. Try a clearer image or use manual entry.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Start scanning
  const startScanning = async () => {
    setScannerError(null);
    setCameraReady(true); // Show the div first

    // Wait for DOM to update
    setTimeout(async () => {
      try {
        // QR Code first (primary), then other formats as fallback
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ];

        // Check if element exists
        const element = document.getElementById("barcode-reader");
        if (!element) {
          throw new Error("Scanner element not found");
        }

        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("barcode-reader", {
            formatsToSupport: formatsToSupport,
            verbose: false
          });
        }

        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 30,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              // Square box for QR codes
              const size = Math.min(Math.floor(viewfinderWidth * 0.7), Math.floor(viewfinderHeight * 0.7), 280);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
            disableFlip: false
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Ignore scan failures
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error('Scanner error:', err);
        setCameraReady(false);

        // Better error messages
        let errorMsg = 'Failed to start camera';
        if (err.message?.includes('Permission')) {
          errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
        } else if (err.message?.includes('NotFoundError') || err.message?.includes('not found')) {
          errorMsg = 'No camera found. Please use manual entry below.';
        } else if (err.message?.includes('NotAllowedError')) {
          errorMsg = 'Camera access blocked. Please enable camera in browser settings.';
        } else if (err.message?.includes('NotReadableError')) {
          errorMsg = 'Camera is being used by another application.';
        }

        setScannerError(errorMsg);
        toast.error(errorMsg);
      }
    }, 100);
  };

  // Stop scanning
  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Stop error:', err);
      }
    }
    setIsScanning(false);
    setCameraReady(false);
  };

  // Handle successful scan
  const handleScanSuccess = async (decodedText) => {
    // Prevent duplicate scans with cooldown
    if (scanCooldownRef.current) return;
    if (decodedText === lastScannedCode) return;

    // Set cooldown to prevent rapid duplicate scans
    scanCooldownRef.current = true;
    setLastScannedCode(decodedText);

    // Play beep
    try {
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
    } catch (e) {}

    // Pause scanner briefly to prevent multiple reads
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.pause(true);
      } catch (e) {}
    }

    await lookupBarcode(decodedText);

    // Resume scanner after 3 seconds cooldown
    setTimeout(() => {
      scanCooldownRef.current = false;
      setLastScannedCode("");
      if (scannerRef.current && isScanning) {
        try {
          scannerRef.current.resume();
        } catch (e) {}
      }
    }, 3000);
  };

  // Cleanup on unmount
  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Clear scan feedback after 3 seconds
  useEffect(() => {
    if (scanFeedback) {
      const timer = setTimeout(() => setScanFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [scanFeedback]);

  // Lookup barcode via API
  const lookupBarcode = async (barcode) => {
    if (!barcode || barcode.trim() === "") {
      toast.error("Please enter a valid barcode");
      return;
    }

    setIsProcessing(true);
    setScanFeedback(null);

    try {
      console.log(`[LOOKUP] Attempting barcode lookup for: ${barcode.trim()}`);
      
      const response = await axios.get(`${API_BASE_URL}/barcode/lookup/${barcode.trim()}`);

      if (response.data.success) {
        const product = response.data.product;
        console.log(`[LOOKUP] SUCCESS - Found product:`, product);

        // Use functional update to get latest state and update correctly
        setScannedItems(prevItems => {
          const existingIndex = prevItems.findIndex(
            item => item.id === product.id && item.selectedWeight === product.selectedWeight
          );

          if (existingIndex !== -1) {
            // Item exists - increment quantity
            const updatedItems = [...prevItems];
            if (updatedItems[existingIndex].amount < updatedItems[existingIndex].stock) {
              updatedItems[existingIndex].amount += 1;
              setScanFeedback({ type: "success", message: `${product.name} - Qty: ${updatedItems[existingIndex].amount}` });
              toast.success(`${product.name} quantity updated to ${updatedItems[existingIndex].amount}`);
              return updatedItems;
            } else {
              setScanFeedback({ type: "warning", message: "Maximum stock reached" });
              toast.warning("Maximum stock reached");
              return prevItems;
            }
          } else {
            // New item - add to list
            setScanFeedback({ type: "success", message: `${product.name} added!` });
            toast.success(`${product.name} (${product.selectedWeight}) added!`);
            return [...prevItems, { ...product, amount: 1 }];
          }
        });
      }
    } catch (error) {
      console.error(`[LOOKUP] Error:`, error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message || "Product not found";
      const scannedCode = error.response?.data?.scannedCode || barcode;
      
      toast.error(errorMessage);
      setScanFeedback({ type: "error", message: errorMessage });
      
      // Log for debugging
      console.log(`[DEBUG] Scanned: ${scannedCode}`);
    } finally {
      setIsProcessing(false);
      setManualBarcode("");
    }
  };

  // Handle manual submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    lookupBarcode(manualBarcode);
  };

  // Update item quantity
  const updateQuantity = (index, delta) => {
    const updatedItems = [...scannedItems];
    const newAmount = updatedItems[index].amount + delta;

    if (newAmount < 1) return;
    if (newAmount > updatedItems[index].stock) {
      toast.warning("Maximum stock reached");
      return;
    }

    updatedItems[index].amount = newAmount;
    setScannedItems(updatedItems);
  };

  // Remove item
  const removeItem = (index) => {
    const removedItem = scannedItems[index];
    setScannedItems(prev => prev.filter((_, i) => i !== index));
    toast.info(`${removedItem.name} removed`);
  };

  // Calculate total
  const calculateTotal = () => {
    return scannedItems.reduce((total, item) => total + (item.price * item.amount), 0);
  };

  // Proceed to payment
  const handleProceedToPayment = () => {
    if (scannedItems.length === 0) {
      toast.error("Please scan at least one product");
      return;
    }

    if (!isSignedIn) {
      toast.error("Please sign in to continue");
      navigate("/login");
      return;
    }

    setIsProcessing(true);

    // Clear existing cart first
    clearCart();

    // Use setTimeout to ensure cart is cleared before adding new items
    setTimeout(() => {
      // Add each scanned item to cart
      scannedItems.forEach(item => {
        const productForCart = {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          selectedWeight: item.selectedWeight,
          stock: item.stock,
          colors: item.colors || ["#F5DEB3"]
        };

        addToCart(
          item.id,
          item.colors?.[0] || "#F5DEB3",
          item.amount,
          productForCart
        );
      });

      // Navigate after a small delay to ensure cart is updated
      setTimeout(() => {
        toast.success("Items added to cart! Redirecting to payment...");
        setIsProcessing(false);
        // Scroll to top and pass state to indicate this is an in-store purchase (no delivery needed)
        window.scrollTo(0, 0);
        navigate("/payment", { state: { isInStoreCheckout: true } });
      }, 300);
    }, 100);
  };

  // Clear all scanned items
  const handleClearAll = () => {
    setScannedItems([]);
    toast.info("All items cleared");
  };

  return (
    <Wrapper>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-badge">In-Store Experience</span>
          <h1>Scan & Pay</h1>
          <p>Skip the queue! Scan product QR codes and pay instantly at the store</p>
          <div className="hero-features">
            <div className="hero-feature">
              <FiSmartphone className="feature-icon" />
              <span>Scan QR Code</span>
            </div>
            <div className="hero-feature">
              <FiShoppingCart className="feature-icon" />
              <span>Add to Cart</span>
            </div>
            <div className="hero-feature">
              <FiCreditCard className="feature-icon" />
              <span>Pay & Go</span>
            </div>
          </div>
        </div>
      </div>

      <div className="main-container">
        {/* Scanner Section */}
        <div className="scanner-section">
          <div className="scanner-card">
            <h2>
              <FiCamera /> QR Code Scanner
            </h2>

            {/* Camera Preview */}
            <div className="scanner-wrapper">
              {/* Scanner Container */}
              <div className={`scanner-container ${isScanning ? 'active' : ''}`}>
                {/* Always render this div, but hide when not scanning */}
                <div
                  id="barcode-reader"
                  style={{ display: cameraReady ? 'block' : 'none' }}
                ></div>

                {/* Placeholder when not scanning */}
                {!cameraReady && (
                  <div className="scanner-placeholder">
                    <FiCamera size={56} />
                    <p>Tap "Start Camera" to scan QR codes</p>
                    <span className="hint">Or use manual entry below</span>
                  </div>
                )}

                {/* Scanning Overlay */}
                {isScanning && (
                  <div className="scan-overlay">
                    <div className="scan-region">
                      <div className="corner top-left"></div>
                      <div className="corner top-right"></div>
                      <div className="corner bottom-left"></div>
                      <div className="corner bottom-right"></div>
                      <div className="scan-line"></div>
                    </div>
                    <p className="scan-instruction">Position QR code within the frame</p>
                  </div>
                )}
              </div>

              {/* Scan Feedback */}
              {scanFeedback && (
                <div className={`scan-feedback ${scanFeedback.type}`}>
                  {scanFeedback.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                  <span>{scanFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="scanner-controls">
              {!isScanning ? (
                <button
                  className="scan-btn start"
                  onClick={startScanning}
                  disabled={isProcessing}
                >
                  <FiCamera /> Start Camera
                </button>
              ) : (
                <button
                  className="scan-btn stop"
                  onClick={stopScanning}
                >
                  <FiCameraOff /> Stop Camera
                </button>
              )}

              {/* File Upload Option */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    scanFromFile(e.target.files[0]);
                  }
                }}
              />
              <button
                className="scan-btn upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <FiUpload /> Scan Image
              </button>
            </div>

            {/* Hidden div for file scanning */}
            <div id="file-scanner-temp" style={{ display: 'none' }}></div>

            {/* Scanner Error */}
            {scannerError && (
              <div className="scanner-error">
                <FiAlertCircle />
                <div className="error-content">
                  <span>{scannerError}</span>
                  <p>You can still add products using manual entry below.</p>
                </div>
              </div>
            )}

            {/* Manual Entry */}
            <div className="manual-entry">
              <h3>
                <FiEdit3 /> Or Enter Manually
              </h3>
              <form onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  placeholder="Enter product code (e.g., SAW-product1-250g)"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualBarcode.trim()}
                >
                  {isProcessing ? "Looking up..." : "Add"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Scanned Items Section */}
        <div className="items-section">
          <div className="items-card">
            <div className="items-header">
              <h2>
                <FiShoppingCart /> Your Items ({scannedItems.length})
              </h2>
              {scannedItems.length > 0 && (
                <button className="clear-btn" onClick={handleClearAll}>
                  Clear All
                </button>
              )}
            </div>

            {scannedItems.length === 0 ? (
              <div className="empty-items">
                <FiShoppingCart size={48} />
                <p>No items scanned yet</p>
                <span>Scan a product QR code to get started</span>
              </div>
            ) : (
              <div className="items-list">
                {scannedItems.map((item, index) => (
                  <div key={`${item.id}-${item.selectedWeight}-${index}`} className="scanned-item">
                    <div className="item-image">
                      {item.image ? (
                        <img
                          src={Array.isArray(item.image) ? item.image[0] : item.image}
                          alt={item.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/placeholder.jpg';
                          }}
                        />
                      ) : (
                        <div className="placeholder-image">
                          <FiShoppingCart />
                        </div>
                      )}
                    </div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <span className="item-weight">{item.selectedWeight}</span>
                      <span className="item-price">
                        <FormatPrice price={item.price} />
                      </span>
                    </div>
                    <div className="item-quantity">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        disabled={item.amount <= 1}
                      >
                        <FiMinus />
                      </button>
                      <span>{item.amount}</span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        disabled={item.amount >= item.stock}
                      >
                        <FiPlus />
                      </button>
                    </div>
                    <div className="item-total">
                      <FormatPrice price={item.price * item.amount} />
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(index)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Checkout Section */}
            {scannedItems.length > 0 && (
              <div className="checkout-section">
                <div className="total-row">
                  <span>Total ({scannedItems.reduce((sum, item) => sum + item.amount, 0)} items)</span>
                  <span className="total-amount">
                    <FormatPrice price={calculateTotal()} />
                  </span>
                </div>
                <button
                  className="checkout-btn"
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                >
                  <FiShoppingCart /> Proceed to Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF8E7 0%, #FFF5E1 100%);

  .hero-section {
    background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%);
    padding: 6rem 2rem 5rem;
    text-align: center;
    color: white;
    position: relative;
    overflow: hidden;

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }

    .hero-content {
      max-width: 700px;
      margin: 0 auto;
      position: relative;
      z-index: 1;

      .hero-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        padding: 0.6rem 1.8rem;
        border-radius: 3rem;
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-transform: uppercase;
        letter-spacing: 0.1rem;
      }

      h1 {
        font-size: 4rem;
        margin-bottom: 1rem;
        font-weight: 800;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      }

      p {
        font-size: 1.6rem;
        opacity: 0.95;
        margin-bottom: 2.5rem;
        line-height: 1.6;
      }
    }

    .hero-features {
      display: flex;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;

      .hero-feature {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        background: rgba(255, 255, 255, 0.12);
        padding: 1rem 2rem;
        border-radius: 3rem;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .feature-icon {
          font-size: 1.6rem;
        }

        span:last-child {
          font-size: 1.4rem;
          font-weight: 500;
        }
      }
    }
  }

  .main-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 2rem 4rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
    }
  }

  .scanner-section,
  .items-section {
    .scanner-card,
    .items-card {
      background: white;
      border-radius: 2rem;
      padding: 2.5rem;
      box-shadow: 0 8px 30px rgba(139, 69, 19, 0.1);
      border: 1px solid rgba(139, 69, 19, 0.05);
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 2rem;
      color: #2d2d2d;
      margin-bottom: 2rem;
      font-weight: 700;

      svg {
        color: #CD853F;
      }
    }
  }

  .scanner-wrapper {
    position: relative;
    margin-bottom: 2rem;

    .scanner-container {
      width: 100%;
      min-height: 320px;
      background: #000;
      border-radius: 1.2rem;
      overflow: hidden;
      position: relative;

      &.active {
        border: 3px solid #10B981;
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
      }

      #barcode-reader {
        width: 100%;
        min-height: 320px;

        video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem;
        }

        /* Hide default UI elements from html5-qrcode */
        #barcode-reader__scan_region {
          min-height: 320px !important;
        }

        #barcode-reader__dashboard {
          display: none !important;
        }

        #barcode-reader__header_message {
          display: none !important;
        }
      }

      .scanner-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 320px;
        color: #6b7280;
        text-align: center;
        padding: 2rem;
        background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 180px;
          height: 180px;
          border: 2px dashed rgba(205, 133, 63, 0.3);
          border-radius: 20px;
        }

        svg {
          margin-bottom: 1.5rem;
          color: #CD853F;
          opacity: 0.8;
        }

        p {
          font-size: 1.5rem;
          color: #d1d5db;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .hint {
          font-size: 1.3rem;
          color: #9ca3af;
        }
      }

      .scan-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 100;

        .scan-region {
          width: min(70vw, 250px);
          height: min(70vw, 250px);
          position: relative;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          background: transparent;

          .corner {
            position: absolute;
            width: 24px;
            height: 24px;
            border-color: #10B981;
            border-style: solid;
            border-width: 0;

            &.top-left {
              top: -2px;
              left: -2px;
              border-top-width: 4px;
              border-left-width: 4px;
              border-top-left-radius: 12px;
            }
            &.top-right {
              top: -2px;
              right: -2px;
              border-top-width: 4px;
              border-right-width: 4px;
              border-top-right-radius: 12px;
            }
            &.bottom-left {
              bottom: -2px;
              left: -2px;
              border-bottom-width: 4px;
              border-left-width: 4px;
              border-bottom-left-radius: 12px;
            }
            &.bottom-right {
              bottom: -2px;
              right: -2px;
              border-bottom-width: 4px;
              border-right-width: 4px;
              border-bottom-right-radius: 12px;
            }
          }

          .scan-line {
            position: absolute;
            left: 10px;
            right: 10px;
            height: 3px;
            background: linear-gradient(90deg, transparent, #10B981, #10B981, transparent);
            border-radius: 2px;
            animation: scanAnimation 2s ease-in-out infinite;
            box-shadow: 0 0 10px #10B981, 0 0 20px #10B981;
          }

          @keyframes scanAnimation {
            0%, 100% {
              top: 10px;
              opacity: 1;
            }
            50% {
              top: calc(100% - 13px);
              opacity: 0.8;
            }
          }
        }

        .scan-instruction {
          margin-top: 1.5rem;
          padding: 0.8rem 1.5rem;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 1.4rem;
          border-radius: 2rem;
          backdrop-filter: blur(4px);
        }
      }
    }

    .scan-feedback {
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 1rem 2rem;
      border-radius: 5rem;
      font-size: 1.4rem;
      font-weight: 500;
      animation: slideUp 0.3s ease;

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      &.success {
        background: #10B981;
        color: white;
      }

      &.error {
        background: #EF4444;
        color: white;
      }

      &.warning {
        background: #F59E0B;
        color: white;
      }
    }
  }

  .scanner-controls {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;

    .scan-btn {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 1.2rem 2rem;
      font-size: 1.5rem;
      font-weight: 600;
      border: none;
      border-radius: 0.8rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &.start {
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: white;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
      }

      &.stop {
        background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        color: white;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
      }

      &.upload {
        background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
        color: white;
        padding: 1.2rem 2rem;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    }
  }

  .scanner-error {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
    border: 1px solid #FECACA;
    color: #DC2626;
    border-radius: 1rem;
    margin-bottom: 2rem;
    font-size: 1.4rem;

    svg {
      flex-shrink: 0;
      margin-top: 0.2rem;
    }

    .error-content {
      span {
        font-weight: 500;
      }

      p {
        margin-top: 0.5rem;
        color: #991B1B;
        font-size: 1.3rem;
      }
    }
  }

  .manual-entry {
    border-top: 1px solid #e5e7eb;
    padding-top: 2rem;

    h3 {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 1.6rem;
      color: #4b5563;
      margin-bottom: 1.5rem;
    }

    form {
      display: flex;
      gap: 1rem;

      input {
        flex: 1;
        padding: 1.2rem 1.5rem;
        font-size: 1.5rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.8rem;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: ${({ theme }) => theme.colors.helper};
        }

        &:disabled {
          background: #f9fafb;
        }
      }

      button {
        padding: 1.2rem 2.5rem;
        font-size: 1.5rem;
        font-weight: 600;
        background: ${({ theme }) => theme.colors.btn};
        color: white;
        border: none;
        border-radius: 0.8rem;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background: ${({ theme }) => theme.colors.helper};
          transform: translateY(-2px);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      }
    }
  }

  .items-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h2 {
      margin-bottom: 0;
    }

    .clear-btn {
      padding: 0.8rem 1.5rem;
      font-size: 1.3rem;
      font-weight: 500;
      background: #f3f4f6;
      color: #6b7280;
      border: none;
      border-radius: 0.6rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #EF4444;
        color: white;
      }
    }
  }

  .empty-items {
    text-align: center;
    padding: 4rem 2rem;
    background: linear-gradient(135deg, #FFF8E7 0%, #FFF5E1 100%);
    border-radius: 1.5rem;
    border: 2px dashed rgba(139, 69, 19, 0.2);

    svg {
      margin-bottom: 1.5rem;
      color: #CD853F;
      opacity: 0.6;
    }

    p {
      font-size: 1.8rem;
      color: #5D4E3A;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    span {
      font-size: 1.4rem;
      color: #8B7355;
      display: block;
      margin-top: 0.5rem;
    }
  }

  .items-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .scanned-item {
    display: grid;
    grid-template-columns: 60px 1fr auto auto auto;
    gap: 1.5rem;
    align-items: center;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 1rem;
    margin-bottom: 1rem;

    @media (max-width: 600px) {
      grid-template-columns: 50px 1fr auto;

      .item-quantity,
      .item-total {
        grid-column: 2;
      }

      .remove-btn {
        grid-column: 3;
        grid-row: 1 / 3;
      }
    }

    .item-image {
      width: 60px;
      height: 60px;
      border-radius: 0.8rem;
      overflow: hidden;
      background: white;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .placeholder-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #d1d5db;
      }
    }

    .item-details {
      h4 {
        font-size: 1.5rem;
        color: #1f2937;
        margin-bottom: 0.3rem;
      }

      .item-weight {
        display: inline-block;
        padding: 0.2rem 0.8rem;
        background: ${({ theme }) => theme.colors.helper};
        color: white;
        font-size: 1.1rem;
        border-radius: 0.4rem;
        margin-right: 0.8rem;
      }

      .item-price {
        font-size: 1.3rem;
        color: #6b7280;
      }
    }

    .item-quantity {
      display: flex;
      align-items: center;
      gap: 0.8rem;

      button {
        width: 3rem;
        height: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          background: ${({ theme }) => theme.colors.helper};
          color: white;
          border-color: ${({ theme }) => theme.colors.helper};
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      span {
        font-size: 1.6rem;
        font-weight: 600;
        min-width: 2rem;
        text-align: center;
      }
    }

    .item-total {
      font-size: 1.6rem;
      font-weight: 600;
      color: #1f2937;
    }

    .remove-btn {
      width: 3.5rem;
      height: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      color: #9ca3af;
      border: 1px solid #e5e7eb;
      border-radius: 0.6rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #EF4444;
        color: white;
        border-color: #EF4444;
      }
    }
  }

  .checkout-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #f0f0f0;

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #FFF8E7 0%, #FFF5E1 100%);
      border-radius: 1rem;

      span {
        font-size: 1.6rem;
        color: #5D4E3A;
        font-weight: 500;
      }

      .total-amount {
        font-size: 2.6rem;
        font-weight: 800;
        color: #8B4513;
      }
    }

    .checkout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1.6rem;
      font-size: 1.8rem;
      font-weight: 700;
      background: linear-gradient(135deg, #CD853F 0%, #8B4513 100%);
      color: white;
      border: none;
      border-radius: 1.2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.05rem;
      box-shadow: 0 6px 20px rgba(139, 69, 19, 0.3);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #8B4513 0%, #5D3A1A 100%);
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(139, 69, 19, 0.4);
      }

      &:active:not(:disabled) {
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    }
  }
`;

export default InStoreCheckout;
