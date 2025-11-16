import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import "./App.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import History from "./pages/History";
import Dashboard from "./components/Dashboard";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./AuthContext";

// --- Inner component som håller alla routes ---
function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  // Visa inte navbar på login / register
  const hideNavbar =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Roten: skicka beroende på om man är inloggad eller inte */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/upload" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Offentliga sidor */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Skyddade sidor */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        {/* Fångar allt annat och skickar hem */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// --- Huvudkomponent ---
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
