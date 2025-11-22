import React, { useState } from 'react';
import { Sprout, Droplets, Eye, EyeOff, Leaf, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log("DEBUG: Bắt đầu đăng nhập...");
      console.log(`DEBUG: Gửi request đến /api/users/login với username: ${username}`);

      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log(`DEBUG: Response Status: ${response.status} ${response.statusText}`);

      // 1. Đọc text trước để debug
      const responseText = await response.text();
      console.log("DEBUG: Server Raw Response:", responseText);

      // 2. Kiểm tra lỗi HTTP trước (404, 500, etc.)
      if (!response.ok) {
        // Cố gắng parse lỗi từ JSON nếu có
        let errorMessage = `Lỗi HTTP: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson.message) errorMessage = errorJson.message;
        } catch {
          // Nếu không parse được JSON lỗi, dùng text gốc hoặc message mặc định
          if (responseText) errorMessage += ` - ${responseText.substring(0, 50)}`;
        }
        throw new Error(errorMessage);
      }

      // 3. Kiểm tra body rỗng
      if (!responseText) {
        throw new Error("Máy chủ phản hồi thành công (200) nhưng không có dữ liệu.");
      }

      // 4. Parse JSON thành công
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Dữ liệu trả về không phải JSON hợp lệ: ${responseText.substring(0, 100)}...`);
      }

      console.log("DEBUG: Parsed JSON Data:", responseData);

      // 5. Kiểm tra logic nghiệp vụ (code 200, có token)
      if (responseData.code === 200 && responseData.data && responseData.data.token) {
        const token = responseData.data.token;
        
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        
        console.log("DEBUG: Login success, saving token and redirecting...");
        navigate('/dashboard');
      } else {
        throw new Error(responseData.message || 'Đăng nhập thất bại (Không tìm thấy Token).');
      }

    } catch (err: any) {
      console.error("Lỗi đăng nhập chi tiết:", err);
      setError(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <img 
          src="https://picsum.photos/1920/1080?grayscale&blur=2" 
          alt="Background" 
          className="absolute w-full h-full object-cover opacity-10"
        />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Card */}
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md z-10 border border-white/50 backdrop-blur-sm">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4 shadow-inner">
            <Sprout size={32} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Đăng Nhập</h1>
          <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
            Hệ thống tưới cây tự động <Droplets size={14} className="text-blue-500" />
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
              Tên đăng nhập
            </label>
            <div className="relative group">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
              Mật khẩu
            </label>
            <div className="relative group">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold shadow-md transition-all duration-200 transform hover:-translate-y-0.5 
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg bg-gradient-to-r from-blue-500 to-blue-600'
              } flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              'Đăng Nhập'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link to="/auth/register" className="text-green-600 hover:text-green-700 font-bold hover:underline ml-1 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* System Status Badge */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            System Operational
          </div>
        </div>
      </div>
      
      {/* Decorative leaves for the theme */}
      <Leaf className="absolute bottom-10 right-10 text-green-600/20 rotate-45 w-32 h-32 pointer-events-none" />
      <Leaf className="absolute top-20 left-10 text-green-600/10 -rotate-12 w-24 h-24 pointer-events-none" />

    </div>
  );
};

export default LoginPage;