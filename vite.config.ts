import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: true, // Cho phép truy cập từ mạng LAN
    // Proxy đã được loại bỏ theo yêu cầu, frontend sẽ gọi trực tiếp đến full URL của backend
  }
});