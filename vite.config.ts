import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: true, // Cho phép truy cập từ mạng LAN (nếu cần test trên điện thoại)
    proxy: {
      // Mọi request bắt đầu bằng /api sẽ được chuyển hướng đến backend
      '/api': {
        target: 'http://127.0.0.1:8000', // Sử dụng 127.0.0.1 thay vì localhost để tránh lỗi DNS trên một số máy
        changeOrigin: true,
        secure: false,
      }
    }
  }
});