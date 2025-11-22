import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Redirect root to the requested auth/login path */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        
        {/* Specific route requested by the user */}
        <Route path="/auth/login" element={<LoginPage />} />
        
        {/* Fallback for other routes */}
        <Route path="*" element={<div className="flex items-center justify-center h-screen text-gray-500">Page not found</div>} />
      </Routes>
    </HashRouter>
  );
};

export default App;