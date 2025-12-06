import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Droplets, 
  Clock, 
  History, 
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Interface matching the provided API response
interface HistoryLog {
  id: number;
  start_time: string;
  end_time: string;
  duration: {
    minutes: number;
  };
  mode: string;
  reason: string;
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<HistoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  // Mock stats (giữ nguyên hoặc tính toán dựa trên page hiện tại, 
  // vì API phân trang không trả về tổng số liệu thống kê toàn hệ thống)
  const [stats, setStats] = useState({
    totalCount: 0,
    avgDuration: 0,
  });

  useEffect(() => {
    fetchHistoryData(currentPage);
  }, [currentPage]);

  const fetchHistoryData = async (page: number) => {
    setIsLoading(true);
    setError('');
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/history/get?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const text = await response.text();
      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch (e) {
        throw new Error("Phản hồi từ máy chủ không hợp lệ");
      }

      if (response.ok && jsonData.code === 200) {
        setHistoryData(jsonData.data || []);
        
        // Cập nhật thống kê sơ bộ dựa trên trang hiện tại (tạm thời)
        if (jsonData.data && jsonData.data.length > 0) {
            const currentTotalDuration = jsonData.data.reduce((acc: number, item: HistoryLog) => acc + (item.duration?.minutes || 0), 0);
            setStats({
                totalCount: jsonData.data.length, // Số lượng trên trang này
                avgDuration: Math.round(currentTotalDuration / jsonData.data.length),
            });
        }
      } else {
        setError(jsonData.message || 'Không thể tải dữ liệu lịch sử');
        setHistoryData([]);
      }
    } catch (err: any) {
      console.error("Fetch history error:", err);
      setError('Lỗi kết nối đến máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    // Vì API không trả về tổng số trang, ta cho phép next nếu trang hiện tại có dữ liệu
    // Nếu trang sau rỗng, người dùng sẽ thấy bảng trống và quay lại.
    if (historyData.length > 0) {
      setCurrentPage(prev => prev + 1);
    }
  };

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
        
        {/* Top Section: Summary Stats Only */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-green-700 mb-6 border-b border-gray-100 pb-2">Thống Kê (Trang hiện tại)</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              
              {/* Stat 1 */}
              <div className="flex flex-col items-center justify-center p-2">
                <span className="text-4xl font-bold text-blue-500 mb-2">{stats.totalCount}</span>
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Lượt tưới</span>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center justify-center p-2">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-green-500">{stats.avgDuration}</span>
                  <span className="text-lg text-green-600 font-medium">phút</span>
                </div>
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">TB Thời gian</span>
              </div>

            </div>
          </div>
        </div>

        {/* History Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-green-700">Lịch Sử Tưới Nước Chi Tiết</h2>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-teal-700 text-white text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium rounded-tl-lg">Thời Gian Bắt Đầu</th>
                  <th className="px-6 py-4 font-medium">Thời Gian Kết Thúc</th>
                  <th className="px-6 py-4 font-medium">Thời Lượng</th>
                  <th className="px-6 py-4 font-medium">Chế Độ</th>
                  <th className="px-6 py-4 font-medium rounded-tr-lg">Nguyên Nhân</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-teal-600">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <p>Đang tải dữ liệu trang {currentPage}...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                     <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                       <p>{error}</p>
                     </td>
                  </tr>
                ) : historyData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Droplets className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>Không có dữ liệu nào ở trang này.</p>
                    </td>
                  </tr>
                ) : (
                  historyData.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.start_time)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.end_time)}</td>
                      <td className="px-6 py-4 font-medium flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        {item.duration?.minutes} phút
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
                      <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate" title={item.reason}>
                        {item.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">Trang hiện tại: <span className="font-bold text-gray-800">{currentPage}</span></span>
            <div className="flex gap-3">
              <button 
                onClick={handlePrevPage}
                disabled={currentPage === 1 || isLoading}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} /> Trước
              </button>
              <button 
                onClick={handleNextPage}
                disabled={isLoading || historyData.length === 0} // Nếu không có data, không cho next
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Sau <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default HistoryPage;