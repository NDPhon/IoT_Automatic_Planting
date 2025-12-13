import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import ControlPage from './components/ControlPage';
import HistoryPage from './components/HistoryPage';
import ChatbotPage from './components/ChatbotPage';

const App: React.FC = () => {

  // --- GLOBAL BACKGROUND TASK: SYNC REAL SENSOR DATA FROM ESP32 ---
  useEffect(() => {
    // Helper: Format Date for API (YYYY-MM-DD HH:mm:ss)
    const formatDateForApi = (date: Date) => {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(date);
      const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value || '';
      
      return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
    };

    const triggerReadSensorESP32 = async () => {
      const token = localStorage.getItem('token');
      // Nếu chưa đăng nhập (không có token), bỏ qua lần chạy này
      if (!token) return;

      try {
        // 1. GET dữ liệu thực tế từ ESP32 (Endpoint Group 7)
        const getResponse = await fetch('http://localhost:8000/api/sensors/group7', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!getResponse.ok) {
           console.warn(`[Global] Không thể lấy dữ liệu từ ESP32: ${getResponse.statusText}`);
           return;
        }

        const resJson = await getResponse.json();

        // Kiểm tra cấu trúc dữ liệu trả về
        if (!resJson || !resJson.data) {
           console.warn("[Global] Dữ liệu ESP32 trả về không đúng định dạng mong đợi.");
           return;
        }

        const data = resJson.data;
        const now = new Date();
        const formattedTime = formatDateForApi(now);

        // 2. Chuẩn bị payload để lưu vào lịch sử (POST /api/sensors)
        // Mapping dữ liệu từ response của GET sang payload của POST
        const payload = {
          nhiet_do: data.temperature_humidity?.temperature?.toString() || "0",
          do_am_khong_khi: data.temperature_humidity?.humidity_air?.toString() || "0",
          do_am_dat: data.soil_light?.humidity_soil?.toString() || "0",
          muc_nuoc: data.water_level?.water_percent?.toString() || "0",
          anh_sang: data.soil_light?.light_raw?.toString() || "0",
          created_at: formattedTime
        };

        // 3. Gọi API lưu dữ liệu (POST)
        await fetch('http://localhost:8000/api/sensors', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        console.log("[Global] Đã đồng bộ dữ liệu từ ESP32 thành công:", payload);

      } catch (e) {
        console.error("[Global] Lỗi khi đồng bộ dữ liệu ESP32:", e);
      }
    };

    // Thiết lập interval chạy mỗi 30 giây (30,000 ms)
    const intervalId = setInterval(triggerReadSensorESP32, 30 * 1000);

    // Gọi ngay một lần khi app load (nếu đã đăng nhập)
    triggerReadSensorESP32();

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