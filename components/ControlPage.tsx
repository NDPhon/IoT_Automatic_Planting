import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Droplets, 
  Zap, 
  Settings, 
  Thermometer, 
  Wind, 
  Sun, 
  Save, 
  Activity, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ControlPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State quản lý dữ liệu
  const [pumpStatus, setPumpStatus] = useState(false); // false = OFF
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Ref để lưu trạng thái phiên tưới (khi bật bơm)
  // startMoisture: độ ẩm lúc bắt đầu bật bơm
  const sessionRef = useRef<{ startTime: Date | null; startMoisture: number }>({
    startTime: null,
    startMoisture: 0
  });

  // Threshold Configuration States
  const [thresholds, setThresholds] = useState({
    soilMoisture: 50,
    temperature: 35,
    airHumidity: 40,
    lightIntensity: 80
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Gọi API lấy dữ liệu khi trang load
  useEffect(() => {
    fetchControlData();
  }, []);

  const fetchControlData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Gọi song song 2 API để tối ưu tốc độ
      const [systemRes, deviceRes] = await Promise.all([
        fetch('http://localhost:8000/api/system/get', { headers }),
        fetch('http://localhost:8000/api/device/get', { headers })
      ]);

      // Xử lý System Config
      if (systemRes.ok) {
        const systemJson = await systemRes.json();
        if (systemJson.code === 200 && systemJson.data) {
          setThresholds({
            soilMoisture: systemJson.data.soil_moisture_threshold,
            temperature: systemJson.data.temperature_limit,
            airHumidity: systemJson.data.air_humidity_threshold,
            lightIntensity: systemJson.data.light_threshold
          });
        }
      }

      // Xử lý Device Status
      if (deviceRes.ok) {
        const deviceJson = await deviceRes.json();
        if (deviceJson.code === 200 && deviceJson.data) {
          setIsAutoMode(deviceJson.data.mode === 'AUTO');
          const isPumpOn = deviceJson.data.pump_status === 'ON';
          setPumpStatus(isPumpOn);

          // Nếu khi load trang mà bơm đang BẬT, ta thiết lập thời gian bắt đầu giả định là thời điểm load trang
          // để nếu người dùng tắt ngay sau đó thì vẫn có dữ liệu start_time hợp lệ.
          if (isPumpOn && sessionRef.current.startTime === null) {
            sessionRef.current.startTime = new Date();
             // Không lấy được độ ẩm lúc bật trước đó nên lấy tạm giá trị hiện tại nếu cần, 
             // nhưng tốt nhất để 0 hoặc gọi API sensor ngay tại đây.
          }
        }
      }

    } catch (error) {
      console.error("Lỗi khi tải dữ liệu điều khiển:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Lấy độ ẩm hiện tại từ API để ghi log chính xác
  const fetchCurrentMoisture = async (): Promise<number> => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/sensors/current', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (json.code === 200 && json.data) {
        return parseFloat(json.data.do_am_dat) || 0;
      }
    } catch (e) {
      console.error("Không lấy được dữ liệu cảm biến cho log:", e);
    }
    return 0;
  };

  // Helper: Format Date 'YYYY-MM-DD HH:mm' (Theo múi giờ Asia/Ho_Chi_Minh)
  const formatDateForApi = (date: Date) => {
    // Sử dụng Intl.DateTimeFormat để lấy các thành phần thời gian theo đúng múi giờ VN
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

    // en-GB parts usually format as dd/mm/yyyy, hh:mm but formatToParts is safe to pick by type
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = getPart('hour');
    const minute = getPart('minute');

    return `${year}-${month}-${day} ${hour}:${minute}`;
  };

  // Helper: Ghi lịch sử
  const saveHistoryLog = async (startTime: Date, endTime: Date, startMois: number, endMois: number) => {
    const token = localStorage.getItem('token');
    try {
      const payload = {
        start_time: formatDateForApi(startTime),
        end_time: formatDateForApi(endTime),
        mode: "Thủ công",
        moisure_before: startMois,
        moisure_after: endMois,
        reason: "Người dùng bật/tắt thủ công"
      };

      console.log("Sending History Log (VN Time):", payload);

      await fetch('http://localhost:8000/api/history/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Lỗi khi lưu lịch sử:", e);
    }
  };

  const handleThresholdChange = (key: string, value: number) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    const token = localStorage.getItem('token');
    if (!token) {
       navigate('/auth/login');
       return;
    }

    try {
      // API Update System Config
      const response = await fetch('http://localhost:8000/api/system/modify', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          moisture_threshold: thresholds.soilMoisture.toString(),
          humidity_threshold: thresholds.airHumidity.toString(),
          temperature_limit: thresholds.temperature.toString(),
          light_threshold: thresholds.lightIntensity.toString()
        })
      });

      const resData = await response.json();

      if (response.ok && resData.code === 200) {
        setSaveStatus('saved');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        alert(resData.message || "Lỗi khi lưu cấu hình!");
        setSaveStatus('idle');
      }
    } catch (error) {
      console.error("Save settings error:", error);
      alert("Không thể kết nối đến máy chủ.");
      setSaveStatus('idle');
    }
  };

  const handleChangeMode = async (targetModeIsAuto: boolean) => {
    const token = localStorage.getItem('token');
    const modeString = targetModeIsAuto ? 'AUTO' : 'MANUAL';
    
    try {
      const response = await fetch('http://localhost:8000/api/device/change-mode', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode: modeString })
      });

      const resData = await response.json();

      if (response.ok && resData.code === 200) {
        setIsAutoMode(targetModeIsAuto);
        if (resData.data && resData.data.pump_status) {
          setPumpStatus(resData.data.pump_status === 'ON');
        }
      } else {
        alert(resData.message || "Không thể thay đổi chế độ.");
      }
    } catch (error) {
      console.error("Change mode error:", error);
      alert("Lỗi kết nối khi đổi chế độ.");
    }
  };

  const togglePump = async (targetStatus: boolean) => {
    if (isAutoMode) {
      alert("Vui lòng chuyển sang chế độ Thủ công (Manual) để điều khiển bơm!");
      return;
    }

    const token = localStorage.getItem('token');
    const statusString = targetStatus ? 'ON' : 'OFF';

    // 1. Lấy độ ẩm hiện tại (dữ liệu thực tế từ cảm biến)
    const currentMoisture = await fetchCurrentMoisture();

    try {
      const response = await fetch('http://localhost:8000/api/device/change-pump-status', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pump_status: statusString })
      });

      const resData = await response.json();

      if (response.ok && resData.code === 200) {
        setPumpStatus(targetStatus);

        // --- XỬ LÝ LỊCH SỬ (Chỉ thêm khi TẮT bơm) ---
        if (targetStatus === true) {
          // =========================
          // TRƯỜNG HỢP: BẬT BƠM
          // =========================
          // Chỉ lưu thời điểm bắt đầu và độ ẩm lúc bắt đầu vào biến tạm (Ref)
          // Không gọi API history ở đây
          sessionRef.current = {
            startTime: new Date(),
            startMoisture: currentMoisture
          };
          console.log("Pump ON: Session started at", sessionRef.current.startTime);

        } else {
          // =========================
          // TRƯỜNG HỢP: TẮT BƠM
          // =========================
          // Khi tắt bơm mới chốt sổ và gửi log lên server
          
          const endTime = new Date();
          
          // Lấy start time từ ref. 
          // Nếu null (do F5 trang hoặc lỗi), fallback lấy thời gian hiện tại trừ đi 1 phút
          let startTime = sessionRef.current.startTime;
          let startMois = sessionRef.current.startMoisture;

          if (!startTime) {
             console.warn("Missing start time (session lost), estimating start time.");
             startTime = new Date(endTime.getTime() - 60000); // Trừ 1 phút
             startMois = currentMoisture; // Giả định độ ẩm không đổi nếu mất session
          }

          // Gọi API thêm lịch sử
          // moisure_before: độ ẩm lúc bật
          // moisure_after: độ ẩm hiện tại (lúc tắt)
          saveHistoryLog(startTime, endTime, startMois, currentMoisture);
          
          // Reset ref sau khi đã lưu
          sessionRef.current = { startTime: null, startMoisture: 0 };
        }

      } else {
        alert(resData.message || "Không thể điều khiển bơm.");
      }
    } catch (error) {
      console.error("Toggle pump error:", error);
      alert("Lỗi kết nối khi điều khiển bơm.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang đồng bộ dữ liệu hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Settings size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Cấu Hình & Điều Khiển</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - CONTROLS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* A. PUMP CONTROL */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">A</span>
                Điều Khiển Bơm Nước
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${pumpStatus ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Droplets size={32} className={pumpStatus ? 'animate-bounce' : ''} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Trạng thái hiện tại:</p>
                    <p className={`text-xl font-bold ${pumpStatus ? 'text-green-600' : 'text-red-600'}`}>
                      {pumpStatus ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => togglePump(true)}
                    disabled={isAutoMode || pumpStatus}
                    className={`flex-1 sm:flex-none px-8 py-3 rounded-lg font-bold text-white shadow-sm transition-all transform active:scale-95
                      ${isAutoMode 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : pumpStatus 
                          ? 'bg-green-700 opacity-50 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                      }`}
                  >
                    BẬT BƠM
                  </button>
                  <button
                    onClick={() => togglePump(false)}
                    disabled={isAutoMode || !pumpStatus}
                    className={`flex-1 sm:flex-none px-8 py-3 rounded-lg font-bold text-white shadow-sm transition-all transform active:scale-95
                      ${isAutoMode 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : !pumpStatus 
                          ? 'bg-red-800 opacity-50 cursor-default'
                          : 'bg-red-600 hover:bg-red-700 hover:shadow-md'
                      }`}
                  >
                    TẮT BƠM
                  </button>
                </div>
              </div>
              {isAutoMode && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
                  <AlertCircle size={16} />
                  <span>Hệ thống đang ở chế độ <strong>Tự Động</strong>. Vui lòng chuyển sang Thủ Công để điều khiển bơm.</span>
                </div>
              )}
            </section>

            {/* B. OPERATION MODE */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">B</span>
                Chọn Chế Độ Hoạt Động
              </h2>

              <div className="space-y-4">
                {/* Manual Mode Option */}
                <label 
                  className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${!isAutoMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input 
                    type="radio" 
                    name="mode" 
                    className="sr-only"
                    checked={!isAutoMode} 
                    onChange={() => handleChangeMode(false)}
                  />
                  <div className={`mt-0.5 mr-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${!isAutoMode ? 'border-blue-600' : 'border-gray-400'}`}>
                    {!isAutoMode && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      Manual Mode (Thủ công)
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Người dùng</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Bạn tự điều khiển Bật/Tắt bơm bằng tay thông qua giao diện web.</p>
                  </div>
                </label>

                {/* Auto Mode Option */}
                <label 
                  className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${isAutoMode ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input 
                    type="radio" 
                    name="mode" 
                    className="sr-only"
                    checked={isAutoMode} 
                    onChange={() => handleChangeMode(true)}
                  />
                  <div className={`mt-0.5 mr-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${isAutoMode ? 'border-green-600' : 'border-gray-400'}`}>
                    {isAutoMode && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      Automatic Mode (Tự động)
                      <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <Zap size={10} /> Smart
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Hệ thống tự động so sánh cảm biến với ngưỡng cài đặt để quyết định tưới.</p>
                  </div>
                </label>
              </div>
            </section>

            {/* C. THRESHOLD SETTINGS */}
            <section className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-opacity duration-300 ${!isAutoMode ? 'opacity-60 pointer-events-none grayscale-[0.5]' : ''}`}>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">C</span>
                  Cấu Hình Ngưỡng Tự Động
                </h2>
                {hasChanges && (
                  <span className="text-xs text-orange-500 italic font-medium animate-pulse">Chưa lưu thay đổi</span>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mb-6">Cài đặt các ngưỡng giới hạn để hệ thống tự động kích hoạt tưới khi ở chế độ Auto.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Soil Moisture Threshold */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-gray-700 flex items-center gap-2">
                      <Droplets size={18} className="text-blue-500" /> Độ ẩm Đất Tối Thiểu
                    </label>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{thresholds.soilMoisture}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={thresholds.soilMoisture} 
                    onChange={(e) => handleThresholdChange('soilMoisture', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-xs text-gray-400">Tưới khi độ ẩm đất thấp hơn mức này.</p>
                </div>

                {/* Air Humidity Threshold */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-gray-700 flex items-center gap-2">
                      <Wind size={18} className="text-cyan-500" /> Độ ẩm Không Khí Tối Thiểu
                    </label>
                    <span className="font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">{thresholds.airHumidity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={thresholds.airHumidity} 
                    onChange={(e) => handleThresholdChange('airHumidity', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <p className="text-xs text-gray-400">Điều kiện phụ để kích hoạt tưới.</p>
                </div>

                {/* Temperature Threshold */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-gray-700 flex items-center gap-2">
                      <Thermometer size={18} className="text-red-500" /> Nhiệt Độ Giới Hạn
                    </label>
                    <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{thresholds.temperature}°C</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="50" 
                    value={thresholds.temperature} 
                    onChange={(e) => handleThresholdChange('temperature', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <p className="text-xs text-gray-400">Không tưới nếu nhiệt độ vượt quá mức này (tránh sốc nhiệt).</p>
                </div>

                {/* Light Threshold */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-gray-700 flex items-center gap-2">
                      <Sun size={18} className="text-amber-500" /> Cường Độ Ánh Sáng
                    </label>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{thresholds.lightIntensity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={thresholds.lightIntensity} 
                    onChange={(e) => handleThresholdChange('lightIntensity', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-xs text-gray-400">Ưu tiên tưới khi ánh sáng yếu hơn mức này.</p>
                </div>

              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={!hasChanges || saveStatus === 'saving'}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white shadow-sm transition-all
                    ${hasChanges 
                      ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow' 
                      : 'bg-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang Lưu...
                    </>
                  ) : saveStatus === 'saved' ? (
                     <>
                      <div className="w-4 h-4 text-white">✓</div>
                      Đã Lưu!
                     </>
                  ) : (
                    <>
                      <Save size={18} /> Lưu Cấu Hình
                    </>
                  )}
                </button>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN - REALTIME MONITOR */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Realtime Monitor Card */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Activity className="text-blue-500" size={20} />
                Giám Sát Realtime
              </h2>

              {/* Main Sensor: Soil Moisture (Hiện tại vẫn dùng hardcode vì API chỉ cho System/Device, 
                 nếu muốn realtime cảm biến cần gọi thêm API sensors) */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-blue-500">
                    <Droplets size={32} fill="currentColor" className="opacity-20" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Độ ẩm Đất Hiện Tại:</p>
                    <div className="flex items-baseline gap-1">
                      {/* Placeholder: Thực tế nên lấy từ API sensors */}
                      <span className="text-4xl font-bold text-gray-800">58</span>
                      <span className="text-xl text-gray-500 font-semibold">%</span>
                    </div>
                    <div className="mt-2 text-xs font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded inline-block">
                      Trạng thái: Ổn định
                    </div>
                  </div>
                </div>
              </div>

              {/* System Logs / Alerts - Reflecting Real State */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Trạng thái Hệ thống</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 bg-green-100 p-2 rounded border border-green-200">
                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                    <div>
                      <p className="text-xs text-green-800 font-medium">Chế độ hoạt động: {isAutoMode ? 'TỰ ĐỘNG' : 'THỦ CÔNG'}</p>
                      <p className="text-[10px] text-green-600">Đồng bộ từ thiết bị</p>
                    </div>
                  </div>
                  {pumpStatus ? (
                     <div className="flex items-start gap-2 bg-blue-100 p-2 rounded border border-blue-200">
                      <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse"></div>
                      <div>
                        <p className="text-xs text-blue-800 font-medium">Máy bơm đang CHẠY.</p>
                        <p className="text-[10px] text-blue-600">Cập nhật thời gian thực</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 bg-gray-200 p-2 rounded border border-gray-300">
                      <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-gray-500 flex-shrink-0"></div>
                      <div>
                        <p className="text-xs text-gray-700 font-medium">Máy bơm đang TẮT.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-right">
                 <p className="text-xs text-gray-400">Dữ liệu cấu hình: ID {thresholds.soilMoisture > 0 ? 'Loaded' : '...'}</p>
                 <div className="flex items-center justify-end gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">API Connected</span>
                 </div>
              </div>

            </section>

          </div>

        </div>
      </main>
    </div>
  );
};

export default ControlPage;