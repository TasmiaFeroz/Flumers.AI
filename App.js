import React, { useState, lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Snackbar, Alert } from '@mui/material';
import { lightTheme, darkTheme } from './styles/theme';
import "./App.css";
import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/Navbar";
import HomePage from './components/HomePage';
import Login from './auth/Login';
import Signup from './auth/Signup';
import InfluencerProfile from './features/profile/InfluencerProfile';
import BrandProfile from './features/profile/BrandProfile';
import InfluencerDashboard from './features/profile/InfluencerDashboard';
import BrandDashboard from './features/profile/BrandDashboard';
import SelectRole from './components/SelectRole';
import UserInfo from './components/UserInfo';
import { auth, getUserRole } from './api/firebaseConfig';
import InfluencerRecords from './features/profile/InfluencerDashboard';
import ShowProfile from './features/profile/ShowProfile';
import SearchInfluencers from './features/profile/SearchInfluencers';
import FloatingChatbot from "./features/chat/FloatingChatbot";

const UserProfile = lazy(() => import('./features/profile/UserProfile'));
const BrandChats = lazy(() => import('./features/chat/BrandChats'));
const BrandOrders = lazy(() => import('./features/profile/BrandOrders'));
const InfluencerOrders = lazy(() => import('./features/profile/InfluencerOrders'));
const InfluencerChats = lazy(() => import('./features/chat/InfluencerChats'));

const DashboardRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToDashboard = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const role = await getUserRole(user.uid);
          // Redirect only if the user is on the root or explicitly navigates to /dashboard
          if (location.pathname === "/" || location.pathname === "/dashboard") {
            if (role === "brand") {
              navigate("/brand-dashboard", { replace: true });
            } else if (role === "influencer") {
              navigate("/influencer-dashboard", { replace: true });
            } else {
              navigate("/", { replace: true }); // Redirect to home if role is undefined
            }
          }
        } else {
          navigate("/login", { replace: true }); // Redirect to login if not authenticated
        }
      } catch (error) {
        console.error("Error during redirection:", error);
        navigate("/", { replace: true }); // Redirect to home on error
      } finally {
        setLoading(false);
      }
    };

    redirectToDashboard();
  }, [navigate, location.pathname]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while redirecting
  }

  return null; // No UI needed for this component
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
        <Router>
          <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Brand Routes */}
              <Route
                path="/brand-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["brand"]}>
                    <BrandDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search-influencers"
                element={
                  <ProtectedRoute allowedRoles={["brand"]}>
                    <SearchInfluencers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/show-profile/:id"
                element={
                  <ProtectedRoute allowedRoles={["brand"]}>
                    <ShowProfile />
                  </ProtectedRoute>
                }
              />

              {/* Influencer Routes */}
              <Route
                path="/influencer-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["influencer"]}>
                    <InfluencerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer-profile"
                element={
                  <ProtectedRoute allowedRoles={["influencer"]}>
                    <InfluencerProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={["brand", "influencer"]}>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route path="/influencer-profile/:id" element={<InfluencerProfile />} />
              <Route path="/brand-profile" element={<BrandProfile />} />
              <Route path="/select-role" element={<SelectRole />} />
              <Route path="/user-info" element={<UserInfo />} />
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/brand-chats" element={<BrandChats />} />
              <Route path="/brand-orders" element={<BrandOrders />} />
              <Route
                path="/influencer-chats"
                element={
                  <ProtectedRoute allowedRoles={["influencer"]}>
                    <InfluencerChats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer-records"
                element={
                  <ProtectedRoute allowedRoles={["influencer"]}>
                    <InfluencerRecords />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/influencer-orders"
                element={
                  <ProtectedRoute allowedRoles={["influencer"]}>
                    <InfluencerOrders />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity="success" // Default severity
              sx={{ width: "100%" }}
            >
              {/* Snackbar message placeholder */}
            </Alert>
          </Snackbar>
          <FloatingChatbot />
        </Router>
    </ThemeProvider>
  );
};

export default App;