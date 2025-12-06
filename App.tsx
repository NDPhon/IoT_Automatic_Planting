import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import ControlPage from './components/ControlPage';
import HistoryPage from './components/HistoryPage';
import ChatbotPage from './components/ChatbotPage';

const App: React.FC = () => {

  // --- GLOBAL BACKGROUND TASK: SIMULATE ESP32 SENSOR READING ---
  useEffect(() => {
    // Helper: Format Date for API
    const formatDateForApi = (date: Date) => {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(date);
      const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value || '';
      
      return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`;
    };

    const triggerReadSensorESP32 = async () => {
      const token = localStorage.getItem('token');
      // Nếu chưa đăng nhập (không có token), bỏ qua lần chạy này
      if (!token) return;

      try {
        const now = new Date();
        const formattedTime = formatDateForApi(now);

        const payload = {
          nhiet_do: "25",
          do_am_khong_khi: "65",
          do_am_dat: "60",
          muc_nuoc: "250",
          anh_sang: "200",
          created_at: formattedTime
        };

        await fetch('http://localhost:8000/api/sensors', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        console.log("[Global] Đã gọi API đọc dữ liệu ESP32 (Background Task):", payload);
      } catch (e) {
        console.error("[Global] Lỗi khi gọi API đọc dữ liệu ESP32:", e);
      }
    };

    // Thiết lập interval chạy mỗi 5 phút (300,000 ms)
    const intervalId = setInterval(triggerReadSensorESP32, 5 * 60 * 1000);

    // Dọn dẹp interval khi App unmount (thường chỉ khi tắt tab)
    return () => clearInterval(intervalId);
  }, []);
  // -------------------------------------------------------------

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
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        
        {/* Fallback for other routes */}
        <Route path="*" element={
          <div className="flex items-center justify-center h-screen text-gray-500">Page not found</div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;