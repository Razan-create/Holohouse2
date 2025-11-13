import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import History from './pages/History';   // 👈 NY IMPORT

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Historik-sidan – kräver inloggning */}
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />

          {/* Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Upload-sidan */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
