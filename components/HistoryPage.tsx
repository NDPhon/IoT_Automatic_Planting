import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Filter, 
  Droplets, 
  Clock, 
  History, 
  Search,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock Data for History Logs
const mockHistoryData = [
  { id: 1, startTime: '15/11/2025 14:30', endTime: '15/11/2025 14:45', duration: '15 phút', mode: 'Tự động', moistureBefore: '48%', moistureAfter: '72%', reason: 'Đạt Ngưỡng Thấp (50%)' },
  { id: 2, startTime: '15/11/2025 08:00', endTime: '15/11/2025 08:05', duration: '5 phút', mode: 'Thủ công', moistureBefore: '65%', moistureAfter: '70%', reason: 'Thao tác bằng tay' },
  { id: 3, startTime: '14/11/2025 21:15', endTime: '14/11/2025 21:25', duration: '10 phút', mode: 'Tự động', moistureBefore: '49%', moistureAfter: '68%', reason: 'Đạt Ngưỡng Thấp (50%)' },
  { id: 4, startTime: '13/11/2025 10:40', endTime: '13/11/2025 10:50', duration: '10 phút', mode: 'Tự động', moistureBefore: '52%', moistureAfter: '75%', reason: 'Ngưỡng 55% cũ' },
  { id: 5, startTime: '12/11/2025 06:00', endTime: '12/11/2025 06:20', duration: '20 phút', mode: 'Tự động', moistureBefore: '45%', moistureAfter: '80%', reason: 'Lịch định kỳ' },
  { id: 6, startTime: '11/11/2025 18:30', endTime: '11/11/2025 18:35', duration: '5 phút', mode: 'Thủ công', moistureBefore: '60%', moistureAfter: '64%', reason: 'Thao tác bằng tay' },
];

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState('All');
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState('2025-11-15');

  // Derived stats based on mock data (static for demo)
  const totalWatering = 45;
  const avgDuration = 12.5;
  const totalWaterVolume = 150;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <History size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Lịch Sử Hoạt Động Tưới</h1>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors text-sm bg-transparent border-0 cursor-pointer"
            >
              <ArrowLeft size={18} />
              Quay lại Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Section: Summary Stats & Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Summary Stats Cards */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-green-700 mb-6 border-b border-gray-100 pb-2">Tóm Tắt Tưới Tiêu</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              
              {/* Stat 1 */}
              <div className="flex flex-col items-center justify-center p-2">
                <span className="text-4xl font-bold text-blue-500 mb-2">{totalWatering}</span>
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Tổng số lần tưới</span>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center justify-center p-2">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-green-500">{avgDuration}</span>
                  <span className="text-lg text-green-600 font-medium">phút</span>
                </div>
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Thời gian trung bình</span>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center justify-center p-2">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-cyan-500">{totalWaterVolume}</span>
                  <span className="text-lg text-cyan-600 font-medium">Lít</span>
                </div>
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Tổng lượng nước</span>
              </div>

            </div>
          </div>

          {/* Filter Section */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <Filter size={20} />
              Bộ Lọc Lịch Sử
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ Ngày:</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến Ngày:</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chế độ:</label>
                <select 
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="All">Tất cả</option>
                  <option value="Auto">Tự động</option>
                  <option value="Manual">Thủ công</option>
                </select>
              </div>

              <button className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                <Search size={16} />
                Lọc Dữ Liệu
              </button>
            </div>
          </div>
        </div>

        {/* History Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-green-700">Lịch Sử Tưới Nước Chi Tiết</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              <Download size={16} /> Xuất Excel
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-teal-700 text-white text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium rounded-tl-lg">Thời Gian Bắt Đầu</th>
                  <th className="px-6 py-4 font-medium">Thời Gian Kết Thúc</th>
                  <th className="px-6 py-4 font-medium">Thời Lượng</th>
                  <th className="px-6 py-4 font-medium">Chế Độ</th>
                  <th className="px-6 py-4 font-medium">Độ Ẩm Trước</th>
                  <th className="px-6 py-4 font-medium">Độ Ẩm Sau</th>
                  <th className="px-6 py-4 font-medium rounded-tr-lg">Nguyên Nhân</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {mockHistoryData.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{item.startTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.endTime}</td>
                    <td className="px-6 py-4 font-medium flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      {item.duration}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.mode === 'Tự động' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-orange-600 font-medium">{item.moistureBefore}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">{item.moistureAfter}</td>
                    <td className="px-6 py-4 text-gray-500 italic">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty State (Hidden if data exists) */}
          {mockHistoryData.length === 0 && (
             <div className="p-12 text-center text-gray-500">
               <Droplets className="mx-auto h-12 w-12 text-gray-300 mb-4" />
               <p>Chưa có dữ liệu lịch sử tưới nào.</p>
             </div>
          )}

          {/* Pagination (Static for demo) */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">Hiển thị 1 đến 6 của 45 kết quả</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 text-sm hover:bg-gray-50 disabled:opacity-50" disabled>Trước</button>
              <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 text-sm hover:bg-gray-50">Sau</button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default HistoryPage;