import Header from "./Components/Header.jsx";
import Body from "./Components/Homepage/Body.jsx";
import PortfolioPage from "./Components/PortfolioPage/PortfolioPage.jsx";
import Book from "./Components/Book.jsx";
import Footer from "./Components/Footer.jsx";
import "./App.css";
import { Box } from "@mantine/core";
import ProjectPage from "./Components/PortfolioPage/ProjectPage.jsx";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./Context/AuthContext.jsx";
import GalleryPage from "./Components/GalleryPage.jsx";
import AdminDashboard from "./Components/Admin/AdminDashboard.jsx";
import AdminLogin from "./Components/GalleryPage/AdminLogin.jsx";
import AdminBookings from "./Components/Admin/AdminBookings.jsx";
import AdminGalleries from "./Components/Admin/AdminGalleries.jsx";

function AdminRoute() {
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
  return user ? <AdminDashboard /> : <AdminLogin />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <div className="body">
            <Header />
            <Box component="main" style={{ minHeight: "calc(100vh - 180px)" }}>
              <Routes>
                <Route path="/" element={<Body />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/book" element={<Book />} />
                <Route path="/portfolio/:category" element={<ProjectPage />} />

                {/* ── Gallery system ── */}
                <Route
                  path="/admin/gallery/:slug"
                  element={<GalleryPage isAdmin={true} />}
                />
                <Route path="/gallery/:slug" element={<GalleryPage />} />
                <Route path="/admin" element={<AdminRoute />} />
                <Route path="/admin/galleries" element={<AdminGalleries />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
            <Footer />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
