import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/AdminLogin';
import AdminPanel from './pages/admin/AdminPanel';

const ProtectedAdmin = ({ children }) => {
  // Check if token is passed in URL (from main site login)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    localStorage.setItem('adminToken', tokenFromUrl);
    // Clean up URL without refreshing
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const token = localStorage.getItem('adminToken');
  if (!token) {
    const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
    window.location.href = `${siteUrl}/login`;
    return null;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedAdmin>
            <AdminPanel />
          </ProtectedAdmin>
        } />
      </Routes>
    </Router>
  );
}

export default App;
