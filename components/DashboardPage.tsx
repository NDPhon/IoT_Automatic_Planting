import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  LogOut, 
  Droplets, 
  Thermometer, 
  Wind, 
  Sun, 
  Moon, 
  Zap, 
  Settings, 
  Waves,
  History,
  Bot,
  RefreshCw // Icon for loading status
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('Admin');
  
  // Real Sensor Data State
  const [sensorData, setSensorData] = useState({
    soilMoisture: 0,
    temp: 0,
    airHumidity: 0,
    waterLevel: 0,
    light: 0
  });

  // Chart Data State - Start empty
  const [chartData, setChartData] = useState<any[]>([]);

  // System States
  const [pumpStatus, setPumpStatus] = useState(false); // Default OFF
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [threshold] = useState(50); // Hardcoded threshold for now
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Retrieve username
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    // 2. Initial Fetch
    fetchHistoricalData(); // Load history first
    fetchSensorData(); // Then load current status

    // 3. Setup Polling (Auto-refresh every 5 minutes)
    const intervalId = setInterval(fetchSensorData, 5 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchHistoricalData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/sensors/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      let jsonData;
      try {
        jsonData = JSON.parse(responseText);
      } catch (e) {
        console.error("Invalid JSON history:", e);
        return;
      }

      if (jsonData.code === 200 && Array.isArray(jsonData.data)) {
        // Sort data ascending by time (Oldest -> Newest)
        const sortedData = jsonData.data.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Map to chart format
        const formattedData = sortedData.map((item: any) => {
          const date = new Date(item.created_at);
          return {
            // Using HH:mm:ss with forced Vietnam Timezone
            time: date.toLocaleTimeString('vi-VN', { 
              timeZone: 'Asia/Ho_Chi_Minh',
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            }),
            moisture: parseFloat(item.do_am_dat)
          };
        });

        // Keep last 20 points for better visibility
        setChartData(formattedData.slice(-20));
      }
    } catch (error) {
      console.error("Failed to fetch historical data:", error);
    }
  };

  const fetchSensorData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("No token found, redirecting to login...");
      navigate('/auth/login');
      return;
    }

    try {
      // Updated to new endpoint
      const response = await fetch('http://localhost:8000/api/sensors', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token expired
        localStorage.removeItem('token');
        navigate('/auth/login');
        return;
      }

      const responseText = await response.text();
      // Safely parse JSON
      let jsonData;
      try {
        jsonData = JSON.parse(responseText);
      } catch (e) {
        console.error("Invalid JSON response:", responseText);
        return;
      }

      // Handle both wrapped {code: 200, data: ...} and flat object structures
      let data = jsonData;
      if (jsonData.code === 200 && jsonData.data) {
        data = jsonData.data;
      }

      // Validate data existence
      if (data && (data.nhiet_do !== undefined || data.do_am_dat !== undefined)) {
        
        // Parse string values to numbers
        const newTemp = parseFloat(data.nhiet_do || 0);
        const newHumidity = parseFloat(data.do_am_khong_khi || 0);
        const newSoil = parseFloat(data.do_am_dat || 0);
        const newWater = parseFloat(data.muc_nuoc || 0);
        const newLight = parseFloat(data.anh_sang || 0);

        // Update Sensor State
        setSensorData({
          temp: newTemp,
          airHumidity: newHumidity,
          soilMoisture: newSoil,
          waterLevel: newWater,
          light: newLight
        });

        // Update Chart Data (Real-time effect)
        // Use client-side current time as requested "(created_at sẽ lấy thời gian hiện tại giống trang Control)"
        const timestamp = new Date();
        const timeString = timestamp.toLocaleTimeString('vi-VN', { 
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
        
        setChartData(prevData => {
          // Avoid duplicate time points if API returns same data quickly
          if (prevData.length > 0 && prevData[prevData.length - 1].time === timeString) {
            return prevData;
          }

          const newData = [...prevData, { time: timeString, moisture: newSoil }];
          // Keep only last 20 points to match historical view
          if (newData.length > 20) return newData.slice(newData.length - 20);
          return newData;
        });

      } else {
        console.error("API response format not recognized:", jsonData);
      }

    } catch (error) {
      console.error("Failed to fetch sensor data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('chat_history');
    navigate('/auth/login');
  };

  // Logic to determine if it is "Day" or "Night" based on light sensor
  // Assuming Light > 100 is Day
  const isDaytime = sensorData.light > 100;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-lg text-green-600">
                <LayoutDashboard size={24} />
              </div>
              <h1 className="text-xl font-bold text-green-700 tracking-tight">SmartFarm Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
               {/* Chatbot Button */}
               <button 
                onClick={() => navigate('/chatbot')}
                className="hidden sm:flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-200"
              >
                <Bot size={18} />
                Hỏi trợ lý AI
              </button>

              <span className="text-sm text-gray-500 hidden md:block">Xin chào, <span className="font-semibold text-gray-800">**{username}**</span></span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut size={16} />
                Đăng Xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mobile AI Button */}
        <div className="sm:hidden mb-6">
          <button 
            onClick={() => navigate('/chatbot')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-md"
          >
            <Bot size={20} />
            Chat với Trợ Lý Cây Trồng
          </button>
        </div>
        
        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Soil Moisture (Main Metric) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between relative overflow-hidden">
             {/* Background decoration */}
             <div className="absolute -right-6 -top-6 bg-blue-50 w-32 h-32 rounded-full opacity-50 blur-2xl"></div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Droplets size={20} className="text-blue-500" />
                Thông số Độ ẩm Đất
              </h2>
              <div className="flex items-end justify-between mt-6 relative z-10">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Độ ẩm hiện tại:</p>
                  <div className="text-6xl font-bold text-blue-600 flex items-start transition-all duration-500">
                    {sensorData.soilMoisture}
                    <span className="text-2xl mt-2 ml-1">%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs mb-1">Ngưỡng đặt: {threshold}%</p>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${sensorData.soilMoisture > threshold ? 'text-green-500' : 'text-orange-500'}`}>
                    {sensorData.soilMoisture > threshold ? 'Đủ nước' : 'Cần tưới'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-200">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(sensorData.soilMoisture, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: Status & Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2 flex items-center justify-between">
              <span>Trạng thái & Cài đặt</span>
              <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Live
              </span>
            </h2>
            
            <div className="space-y-6">
              {/* Pump Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Trạng thái Bơm:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${pumpStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${pumpStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {pumpStatus ? 'Đang Bật' : 'Đang Tắt'}
                </span>
              </div>

              {/* Operating Mode */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Chế độ Hoạt động:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${isAutoMode ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {isAutoMode ? <Zap size={14} /> : <Settings size={14} />}
                  {isAutoMode ? 'Tự động' : 'Thủ công'}
                </span>
              </div>

               {/* Threshold */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Ngưỡng Độ ẩm:</span>
                <span className="text-lg font-bold text-gray-800">{threshold}%</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <button 
                  onClick={() => navigate('/control')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Settings size={18} />
                  Chuyển sang Manual Control
                </button>
                <button 
                  onClick={() => navigate('/history')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <History size={18} />
                  Xem Lịch sử Tưới
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Environment Sensors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-6 border-b border-gray-100 pb-2">Môi trường Không khí</h2>
            
            <div className="grid grid-cols-1 gap-6">
              
              {/* Temperature */}
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 transition-colors group">
                <div className="bg-red-100 p-3 rounded-full text-red-500 group-hover:bg-red-200 transition-colors">
                  <Thermometer size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Nhiệt độ</p>
                  <p className="text-3xl font-bold text-gray-800">{sensorData.temp}<span className="text-lg text-gray-500 ml-0.5">°C</span></p>
                </div>
              </div>

              {/* Humidity */}
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-cyan-50 transition-colors group">
                <div className="bg-cyan-100 p-3 rounded-full text-cyan-500 group-hover:bg-cyan-200 transition-colors">
                  <Wind size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Độ ẩm KK</p>
                  <p className="text-3xl font-bold text-gray-800">{sensorData.airHumidity}<span className="text-lg text-gray-500 ml-0.5">%</span></p>
                </div>
              </div>

              {/* Light (Sun/Moon) */}
              <div className={`flex items-center gap-4 p-3 rounded-xl transition-colors group ${isDaytime ? 'hover:bg-amber-50' : 'hover:bg-indigo-50'}`}>
                <div className={`p-3 rounded-full transition-colors ${isDaytime ? 'bg-amber-100 text-amber-500 group-hover:bg-amber-200' : 'bg-indigo-100 text-indigo-500 group-hover:bg-indigo-200'}`}>
                  {isDaytime ? <Sun size={24} /> : <Moon size={24} />}
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Ánh sáng</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-800">{sensorData.light}</p>
                    <span className="text-sm text-gray-500 font-medium">{isDaytime ? 'Sáng' : 'Tối'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Biểu đồ Độ ẩm Đất (Realtime)</h2>
            <div className="flex items-center gap-2">
               <span className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-3 h-0.5 bg-green-500"></div> Độ ẩm Đất (%)
               </span>
               <span className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                  <div className="w-3 h-0.5 border-t border-dashed border-orange-400"></div> Ngưỡng {threshold}%
               </span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickMargin={10}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  domain={[0, 100]} 
                  label={{ value: 'Độ ẩm (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: '12px' } }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#059669', fontWeight: 'bold' }}
                />
                <ReferenceLine y={threshold} stroke="#f97316" strokeDasharray="5 5" />
                <Line 
                  type="monotone" 
                  dataKey="moisture" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, fill: '#15803d' }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
             <p className="text-xs text-gray-400">Thời gian (Giờ:Phút:Giây - GMT+7) - Cập nhật tự động mỗi 5 phút</p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;