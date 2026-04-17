import React, { useEffect, useRef, lazy, Suspense } from "react";
import {BrowserRouter,Routes,Route,useLocation, Navigate} from 'react-router-dom'
import { useUser, useAuth, SignedIn, SignedOut, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import CustomSignIn from './CustomSignIn';
import CustomSignUp from './CustomSignUp';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import Home from "./Home"; // Keep Home eager-loaded
import Error from "./Error"; // Keep Error eager-loaded
import { GlobalStyle } from "./GlobalStyle";
import { ThemeProvider } from "styled-components";
import Header from "./components/Header";
import Footer from "./components/Footer";
import GoToTop from "./components/GoToTop";
import ChatbotWidget from "./components/ChatbotWidget";
import StickyCart from "./components/StickyCart";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/WidgetPositioning.css";
import { API_ENDPOINTS } from "./config/api";
import API_BASE_URL from "./config/api";

// New Enhancement Components
import LoadingBar from "./components/LoadingBar";
import PageTransition from "./components/PageTransition";
import PageLoader from "./components/PageLoader";

// Lazy load pages for better performance
const About = lazy(() => import('./About'));
const Products = lazy(() => import('./Products'));
const Contact = lazy(() => import('./Contact'));
const Cart = lazy(() => import('./Cart'));
const OrderConfirmation = lazy(() => import('./OrderConfirmation'));
const SingleProduct = lazy(() => import('./SingleProduct'));
const Orders = lazy(() => import('./Orders'));
const Wishlist = lazy(() => import('./Wishlist'));
const FAQ = lazy(() => import('./FAQ'));
const Payment = lazy(() => import('./Payment'));
const OrderSuccess = lazy(() => import('./OrderSuccess'));
const Feedback = lazy(() => import('./Feedback'));
const Profile = lazy(() => import('./Profile'));
const PaymentHistoryPage = lazy(() => import('./PaymentHistoryPage'));
const AdminProduct = lazy(() => import('./AdminProduct'));
const AdminAnalytics = lazy(() => import('./AdminAnalytics'));
const LoyaltyDashboard = lazy(() => import('./LoyaltyDashboard'));
const Blog = lazy(() => import('./Blog'));
const SingleBlog = lazy(() => import('./SingleBlog'));
const AvailableCoupons = lazy(() => import('./AvailableCoupons'));
const InStoreCheckout = lazy(() => import('./InStoreCheckout'));
const Privacy = lazy(() => import('./Privacy'));
const Terms = lazy(() => import('./Terms'));

// Referral Handler - captures referral code from URL and stores it
const ReferralHandler = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');

    if (refCode) {
      // Store referral code in localStorage
      localStorage.setItem('sawaikar_referral_code', refCode);
      console.log('[REFERRAL] Referral code captured:', refCode);
      toast.success(`Welcome! Referral code ${refCode} applied. Sign up to get bonus points!`, {
        position: "top-center",
        autoClose: 5000
      });
    }
  }, [location.search]);

  return null;
};

// User sync component - syncs Clerk user to MongoDB (only once per session)
const UserSync = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const hasSynced = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && user && !hasSynced.current) {
        hasSynced.current = true;
        
        try {
          console.log('[SYNC] Starting user sync with Clerk user:', user.id);
          
          // Get the Clerk session token
          let token = null;
          try {
            token = await getToken();
            console.log('[SYNC] Token retrieved:', token ? 'Token obtained' : 'No token');
          } catch (tokenError) {
            console.error('[SYNC] Error getting token:', tokenError);
            // Retry getting token
            if (retryCount.current < maxRetries) {
              retryCount.current++;
              hasSynced.current = false; // Reset so we can retry
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.current)); // Exponential backoff
              console.log(`[SYNC] Retrying token fetch (attempt ${retryCount.current}/${maxRetries})...`);
              syncUser();
              return;
            }
          }

          if (!token) {
            console.warn('[SYNC] No token available, cannot sync user data');
            // Only show toast if not on admin page
            if (!isAdminPage) {
              toast.error('Authentication required. Please sign in again.');
            }
            return;
          }

          // Prepare user data
          const userData = {
            clerkId: user.id,
            name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.primaryEmailAddress?.emailAddress || ''
          };

          console.log('[SYNC] Syncing user data:', userData);

          // Sync user to MongoDB
          const response = await axios.post(
            API_ENDPOINTS.USER_SYNC,
            userData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 8000 // 8 second timeout
            }
          );
          
          console.log('[✓] User synced to MongoDB:', response.data);

          // Check if there's a referral code to apply (only for non-admin pages)
          if (!isAdminPage) {
            const referralCode = localStorage.getItem('sawaikar_referral_code');
            if (referralCode) {
              try {
                console.log('[REFERRAL] Applying referral code:', referralCode);
                const refResponse = await axios.post(
                  `${API_BASE_URL}/loyalty/referral/apply`,
                  {
                    userId: user.id,
                    referralCode: referralCode
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                if (refResponse.data.success) {
                  toast.success('Referral bonus applied! You earned bonus points!', {
                    position: "top-center",
                    autoClose: 5000
                  });
                  // Clear the referral code from localStorage
                  localStorage.removeItem('sawaikar_referral_code');
                  console.log('[✓] Referral code applied successfully');
                }
              } catch (refError) {
                console.log('[REFERRAL] Referral apply result:', refError.response?.data?.message || refError.response?.data?.error || 'No referral applied');
                // Clear invalid/used referral codes
                if (refError.response?.status === 400 || refError.response?.status === 404) {
                  localStorage.removeItem('sawaikar_referral_code');
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ User sync error:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            config: error.config?.url
          });

          // Retry logic for network errors (not auth errors)
          if (retryCount.current < maxRetries && error.response?.status !== 401 && error.response?.status !== 403) {
            retryCount.current++;
            hasSynced.current = false; // Reset so we can retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.current)); // Exponential backoff
            console.log(`[SYNC] Retrying user sync (attempt ${retryCount.current}/${maxRetries})...`);
            syncUser();
            return;
          }

          // Only show error toast for critical auth errors on non-admin pages
          if (!isAdminPage && error.response?.status !== 500) {
            toast.error(error.response?.data?.message || 'Failed to sync user data');
          } else if (error.response?.status === 401 || error.response?.status === 403) {
            // Auth error
            if (!isAdminPage) {
              toast.error('Authentication failed. Please sign in again.');
            }
          }
        }
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, getToken, location.pathname]);

  return null;
};

// Layout wrapper to conditionally show header/footer
const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = ['/sign-in', '/sign-up', '/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <>
      <ReferralHandler />
      <LoadingBar />
      {!isAdminPage && !isAuthPage && <Header />}
      <PageTransition>
        {children}
      </PageTransition>
      {!isAdminPage && !isAuthPage && <GoToTop />}
      {!isAdminPage && !isAuthPage && <StickyCart />}
      {!isAdminPage && !isAuthPage && <ChatbotWidget />}
      {!isAdminPage && !isAuthPage && <Footer />}
    </>
  );
};

const ProtectedRoute = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <CustomSignIn />
    </SignedOut>
  </>
);

const LoginRoute = () => (
  <>
    <SignedIn>
      <Navigate to="/" replace />
    </SignedIn>
    <SignedOut>
      <CustomSignIn />
    </SignedOut>
  </>
);

const App = () => {
  const theme = {
    colors: {
      // Primary Brand Colors - Cohesive Warm Palette
      primary: "#8B6F47", // Warm earthy brown
      primaryDark: "#6B5435", // Deeper brown
      primaryLight: "#A68A5E", // Lighter warm brown
      
      // Accent Colors
      accent: "#C19A6B", // Soft gold/camel
      accentLight: "#D4AF7A", // Light camel
      success: "#4A7C59", // Muted forest green
      warning: "#D4A574", // Warm tan
      error: "#C85A54", // Muted terracotta
      
      // Neutral Colors
      heading: "#2C2416", // Deep charcoal brown
      text: "#5A4A3A", // Warm dark gray
      textLight: "#8B7B6B", // Medium warm gray
      white: "#F5F1E8", // Warm beige (instead of pure white)
      black: "#1A1410",
      
      // Background Colors - Unified warm tone
      bg: "#FFFBF5", // Very light warm cream (unified)
      bgLight: "#F5F1E8", // Warm beige (matching your image)
      bgDark: "#FFF8F0", // Light warm cream
      bgSection: "#FFF5EB", // Section background
      
      // UI Elements
      border: "rgba(139, 111, 71, 0.15)",
      borderLight: "rgba(139, 111, 71, 0.08)",
      shadow: "0 4px 16px rgba(139, 111, 71, 0.08)",
      shadowMedium: "0 8px 24px rgba(139, 111, 71, 0.12)",
      shadowLarge: "0 16px 48px rgba(139, 111, 71, 0.15)",
      
      // Legacy support (keeping for backward compatibility)
      helper: "#8B6F47",
      btn: "#8B6F47",
      footer_bg: "#2C2416",
      hr: "#E8E4DF",
      gradient: "linear-gradient(135deg, #8B6F47 0%, #6B5435 100%)",
      shadowSupport: "0 4px 16px rgba(139, 111, 71, 0.08)",
    },
    media: {
      mobile: "768px",
      tab: "998px",
    },
  };
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <GlobalStyle/>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Toaster position="top-right" />
          <UserSync />
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public browsing routes */}
                <Route path="/" element={<Home/>}/>
              <Route path="/about" element={<About/>}/>
              <Route path="/products" element={<Products/>}/>
              <Route path="/singleproduct/:id" element={<SingleProduct />} />
              <Route path="/blog" element={<Blog/>}/>
              <Route path="/blog/:slug" element={<SingleBlog/>}/>
              <Route path="/coupons" element={<AvailableCoupons/>}/>
              <Route path="/contact" element={<Contact/>}/>
              <Route path="/scan-pay" element={<ProtectedRoute><InStoreCheckout/></ProtectedRoute>}/>
              <Route path="/faq" element={<FAQ/>}/>
              <Route path="/privacy" element={<Privacy/>}/>
              <Route path="/terms" element={<Terms/>}/>
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/register" element={<LoginRoute />} />
              <Route path="/sign-in" element={<LoginRoute />} />
              <Route path="/sign-up" element={<CustomSignUp />} />
              <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Auth-protected routes */}
              <Route path="/orders" element={<ProtectedRoute><Orders/></ProtectedRoute>}/>
              <Route path="/feedback" element={<Feedback/>}/>
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist/></ProtectedRoute>}/>
              <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
              <Route path="/payment-history" element={<ProtectedRoute><PaymentHistoryPage/></ProtectedRoute>}/>
              <Route path="/loyalty" element={<ProtectedRoute><LoyaltyDashboard/></ProtectedRoute>}/>
              <Route path="/cart" element={<ProtectedRoute><Cart/></ProtectedRoute>}/>
              <Route path="/payment" element={<ProtectedRoute><Payment/></ProtectedRoute>}/>
              <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
              <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />

              {/* Admin routes (auth required, admin check remains inside admin pages) */}
              <Route path="/admin" element={<ProtectedRoute><AdminProduct/></ProtectedRoute>}/>
              <Route path="/admin/products" element={<ProtectedRoute><AdminProduct/></ProtectedRoute>}/>
              <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics/></ProtectedRoute>}/>

              <Route path="*" element={<Error/>}/>
            </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}; 

export default App;
