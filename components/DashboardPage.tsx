import React, { useState } from 'react';
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
  Bot
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

// Mock Data for the Chart (24 Hours)
const mockChartData = [
  { time: '00:00', moisture: 60 },
  { time: '04:00', moisture: 55 },
  { time: '08:00', moisture: 48 },
  { time: '12:00', moisture: 70 }, // Pump triggered here
  { time: '16:00', moisture: 65 },
  { time: '20:00', moisture: 52 },
  { time: '24:00', moisture: 58 },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Mock State
  const [pumpStatus, setPumpStatus] = useState(true); // true = ON
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [soilMoisture] = useState(65);
  const [threshold] = useState(50);
  const [temp] = useState(28);
  const [airHumidity] = useState(70);
  const [waterLevel] = useState(85); // Tank level %
  const [isDaytime] = useState(true); // Light sensor

  const handleLogout = () => {
    // Clear tokens if any
    navigate('/auth/login');
  };

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

              <span className="text-sm text-gray-500 hidden md:block">Xin chào, <span className="font-semibold text-gray-800">**Admin**</span></span>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Thông số Độ ẩm Đất</h2>
              <div className="flex items-end justify-between mt-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Độ ẩm hiện tại:</p>
                  <div className="text-6xl font-bold text-blue-600 flex items-start">
                    {soilMoisture}
                    <span className="text-2xl mt-2 ml-1">%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs mb-1">Ngưỡng đặt: {threshold}%</p>
                  <div className={`text-2xl font-bold ${soilMoisture > threshold ? 'text-green-500' : 'text-orange-500'}`}>
                    {soilMoisture > threshold ? 'Đủ nước' : 'Cần tưới'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-200">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: `${soilMoisture}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: Status & Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Trạng thái & Cài đặt</h2>
            
            <div className="space-y-6">
              {/* Pump Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium flex items-center gap-2">
                  Trạng thái Bơm:
                </span>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${pumpStatus ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${pumpStatus ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  {pumpStatus ? 'Đang Bật' : 'Đang Tắt'}
                </div>
              </div>

              {/* Operation Mode */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Chế độ Hoạt động:</span>
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isAutoMode ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {isAutoMode ? <Zap size={14} /> : <Settings size={14} />}
                  {isAutoMode ? 'Tự động' : 'Thủ công'}
                </div>
              </div>

              {/* Threshold Display */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Ngưỡng Độ ẩm:</span>
                <span className="text-orange-500 font-bold">{threshold}%</span>
              </div>

              <div className="pt-2 grid gap-2">
                <button 
                  onClick={() => navigate('/control')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                   <Settings size={18} />
                   Cấu Hình & Điều Khiển
                </button>
                <button 
                  onClick={() => navigate('/history')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                   <History size={18} />
                   Xem Lịch sử Tưới
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Environment Sensors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">Môi trường</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Temperature */}
              <div className="bg-red-50 p-4 rounded-xl flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                <Thermometer className="text-red-500 mb-2" size={28} />
                <span className="text-gray-500 text-xs">Nhiệt độ</span>
                <span className="text-xl font-bold text-gray-800">{temp}°C</span>
              </div>

              {/* Air Humidity */}
              <div className="bg-blue-50 p-4 rounded-xl flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                <Wind className="text-blue-500 mb-2" size={28} />
                <span className="text-gray-500 text-xs">Độ ẩm KK</span>
                <span className="text-xl font-bold text-gray-800">{airHumidity}%</span>
              </div>

              {/* Water Tank Level */}
              <div className="bg-cyan-50 p-4 rounded-xl flex flex-col items-center justify-center hover:shadow-md transition-shadow relative overflow-hidden">
                 {/* Simple liquid animation effect */}
                <div className="absolute bottom-0 left-0 right-0 bg-cyan-200/30 transition-all duration-500" style={{ height: `${waterLevel}%` }}></div>
                <div className="relative z-10 flex flex-col items-center">
                    <Waves className="text-cyan-600 mb-2" size={28} />
                    <span className="text-gray-500 text-xs">Mực nước</span>
                    <span className="text-xl font-bold text-gray-800">{waterLevel}%</span>
                </div>
              </div>

              {/* Light Sensor */}
              <div className={`p-4 rounded-xl flex flex-col items-center justify-center hover:shadow-md transition-shadow ${isDaytime ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                {isDaytime ? (
                  <Sun className="text-amber-500 mb-2" size={28} />
                ) : (
                  <Moon className="text-indigo-500 mb-2" size={28} />
                )}
                <span className="text-gray-500 text-xs">Ánh sáng</span>
                <span className="text-lg font-bold text-gray-800">{isDaytime ? 'Sáng' : 'Tối'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section: Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Biểu đồ Độ ẩm Đất (24 Giờ Qua)</h2>
            <div className="flex items-center gap-4 text-sm">
               <div className="flex items-center gap-1">
                 <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                 <span className="text-gray-600">Độ ẩm Đất (%)</span>
               </div>
               <div className="flex items-center gap-1">
                 <div className="w-8 h-0.5 border-t-2 border-dashed border-yellow-500"></div>
                 <span className="text-gray-600">Ngưỡng {threshold}%</span>
               </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mockChartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  label={{ value: 'Độ ẩm (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                />
                <ReferenceLine y={threshold} stroke="#eab308" strokeDasharray="5 5" />
                <Line 
                  type="monotone" 
                  dataKey="moisture" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;