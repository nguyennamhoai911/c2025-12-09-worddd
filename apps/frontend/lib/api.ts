// apps/frontend/lib/api.ts
import axios from 'axios';

// 1. Lấy địa chỉ từ biến môi trường (Ưu tiên) hoặc mặc định về Localhost
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000';

// 2. Tạo một instance axios dùng chung cho cả app
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Tự động gửi cookie (token) đi kèm
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;