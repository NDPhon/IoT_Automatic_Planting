import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import ControlPage from './components/ControlPage';
import HistoryPage from './components/HistoryPage';
import ChatbotPage from './components/ChatbotPage';

const App: React.FC = () => {

  // --- GLOBAL BACKGROUND TASK: SYNC REAL SENSOR DATA FROM ESP32 & AUTO CONTROL ---
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

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        // --- BƯỚC 1: GET dữ liệu thực tế từ ESP32 ---
        const getResponse = await fetch('http://localhost:8000/api/sensors/group7', {
          method: 'GET',
          headers: headers
        });

        if (!getResponse.ok) {
           console.warn(`[Global] Không thể lấy dữ liệu từ ESP32: ${getResponse.statusText}`);
           return;
        }

        const resJson = await getResponse.json();
        if (!resJson || !resJson.data) {
           console.warn("[Global] Dữ liệu ESP32 trả về không đúng định dạng mong đợi.");
           return;
        }

        const data = resJson.data;
        
        // Parse giá trị cảm biến hiện tại
        const currentSoil = parseFloat(data.soil_light?.humidity_soil || 0);
        const currentTemp = parseFloat(data.temperature_humidity?.temperature || 0);
        const currentAirHumid = parseFloat(data.temperature_humidity?.humidity_air || 0);
        const currentLight = parseFloat(data.soil_light?.light_raw || 0);
        const currentWater = parseFloat(data.water_level?.water_percent || 0);

        const now = new Date();
        const formattedTime = formatDateForApi(now);

        // --- BƯỚC 2: Lưu vào lịch sử (POST /api/sensors) ---
        const payload = {
          nhiet_do: currentTemp.toString(),
          do_am_khong_khi: currentAirHumid.toString(),
          do_am_dat: currentSoil.toString(),
          muc_nuoc: currentWater.toString(),
          anh_sang: currentLight.toString(),
          created_at: formattedTime
        };

        await fetch('http://localhost:8000/api/sensors', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });
        console.log("[Global] Đã đồng bộ dữ liệu cảm biến.");

        // --- BƯỚC 3: XỬ LÝ LOGIC TỰ ĐỘNG (AUTO MODE) ---
        // Lấy Cấu hình hệ thống (Thresholds) và Trạng thái thiết bị (Mode/Pump)
        const [systemRes, deviceRes] = await Promise.all([
          fetch('http://localhost:8000/api/system/get', { headers }),
          fetch('http://localhost:8000/api/device/get', { headers })
        ]);

        if (systemRes.ok && deviceRes.ok) {
          const systemData = await systemRes.json();
          const deviceData = await deviceRes.json();

          if (systemData.code === 200 && deviceData.code === 200) {
            const config = systemData.data; // Chứa thresholds
            const device = deviceData.data; // Chứa mode và pump_status

            // Chỉ thực hiện logic nếu đang ở chế độ TỰ ĐỘNG
            if (device.mode === 'AUTO') {
              console.log("[Global] Hệ thống đang chạy AUTO. Kiểm tra điều kiện tưới...");

              // Điều kiện logic theo yêu cầu:
              // 1. Độ ẩm đất < Cấu hình
              // 2. Độ ẩm KK < Cấu hình
              // 3. Nhiệt độ > Cấu hình
              // 4. Ánh sáng < Cấu hình
              // 5. Còn nước (> 10%)
              
              const isSoilDry = currentSoil < config.soil_moisture_threshold;
              const isAirDry = currentAirHumid < config.air_humidity_threshold;
              const isHot = currentTemp > config.temperature_limit;
              const isDark = currentLight < config.light_threshold;
              const hasWater = currentWater > 10; // Giả định < 10% là cạn

              const shouldWater = isSoilDry && isAirDry && isHot && isDark && hasWater;

              console.log(`[Logic Check] Soil: ${isSoilDry}, Air: ${isAirDry}, Hot: ${isHot}, Dark: ${isDark}, Water: ${hasWater} => SHOULD WATER: ${shouldWater}`);

              const isPumpOn = device.pump_status === 'ON';

              if (shouldWater && !isPumpOn) {
                // Điều kiện thỏa mãn mà bơm đang tắt -> BẬT BƠM
                console.log("[Auto] Kích hoạt tưới cây...");
                await fetch('http://localhost:8000/api/device/change-pump-status', {
                  method: 'PATCH',
                  headers: headers,
                  body: JSON.stringify({ pump_status: 1 })
                });
              } else if (!shouldWater && isPumpOn) {
                // Điều kiện không còn thỏa mãn mà bơm đang bật -> TẮT BƠM
                console.log("[Auto] Dừng tưới cây...");
                await fetch('http://localhost:8000/api/device/change-pump-status', {
                  method: 'PATCH',
                  headers: headers,
                  body: JSON.stringify({ pump_status: 0 })
                });
              }
            }
          }
        }

      } catch (e) {
        console.error("[Global] Lỗi xử lý background task:", e);
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