import { lazy, Suspense } from "react";
import { isAdminUser } from "./adminAccess";
import Header from "./Components/Header.jsx";
import Body from "./Components/Homepage/Body.jsx";
import PortfolioPage from "./Components/PortfolioPage/PortfolioPage.jsx";
import Footer from "./Components/Footer.jsx";
import AnimatedPage from "./Components/AnimatedPage.jsx";
import "./App.css";
import { Box } from "@mantine/core";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./Context/AuthContext.jsx";

const Book = lazy(() => import("./Components/Book.jsx"));
const ProjectPage = lazy(() => import("./Components/PortfolioPage/ProjectPage.jsx"));
const GalleryPage = lazy(() => import("./Components/GalleryPage.jsx"));
const AdminDashboard = lazy(() => import("./Components/Admin/AdminDashboard.jsx"));
const AdminLogin = lazy(() => import("./Components/GalleryPage/AdminLogin.jsx"));
const AdminBookings = lazy(() => import("./Components/Admin/AdminBookings.jsx"));
const AdminGalleries = lazy(() => import("./Components/Admin/AdminGalleries.jsx"));
const CancelBooking = lazy(() => import("./Components/Admin/CancelBooking.jsx"));

function AdminRoute({ children = <AdminDashboard /> }) {
  const { user } = useAuth();
  if (user === undefined)
    return (
      // Basic loading indicator for admin route
      <div
        style={{
          padding: "2rem",
          fontFamily: "sans-serif",
          textAlign: "center",
          minHeight: "calc(100vh - 100px)",
        }}
      >
        Loading admin panel...
      </div>
    );
  return isAdminUser(user) ? children : <AdminLogin />;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <Box component="main" style={{ minHeight: "calc(100vh - 180px)" }}>
      {/* The key here forces a remount and re-triggers the animation on every path change */}
      <AnimatedPage key={location.pathname}>
        <Suspense fallback={<Box py={100} ta="center">Loading page...</Box>}>
        <Routes location={location}>
          <Route path="/" element={<Body />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/book" element={<Book />} />
          <Route path="/cancel-booking/:id" element={<CancelBooking />} />
          <Route path="/portfolio/:category" element={<ProjectPage />} />

          {/* ── Gallery system ── */}
          <Route
            path="/admin/gallery/:slug"
            element={<AdminRoute><GalleryPage isAdmin={true} /></AdminRoute>}
          />
          <Route path="/gallery/:slug" element={<GalleryPage />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/admin/galleries" element={<AdminRoute><AdminGalleries /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AnimatedPage>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <div className="body">
            <Header />
            <AppRoutes />
            <Footer />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
