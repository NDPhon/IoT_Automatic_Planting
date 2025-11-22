import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import ControlPage from './components/ControlPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to the requested auth/login path */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        
        {/* Auth routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        
        {/* Main App Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/control" element={<ControlPage />} />
        
        {/* Fallback for other routes */}
        <Route path="*" element={<div className="flex items-center justify-center h-screen text-gray-500">Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;