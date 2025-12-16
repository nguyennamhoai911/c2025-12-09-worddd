// apps/extension/config.js

// 👇 CÔNG TẮC TỔNG: Đổi true/false ở đây
const IS_DEV_MODE = false;

const APP_CONFIG = {
  // Backend
  API_URL: IS_DEV_MODE
    ? "https://localhost:5001"
    : "https://vocab-backend-aveq.onrender.com",

  // Frontend
  FRONTEND_URL: IS_DEV_MODE
    ? "https://localhost:3001"
    : "https://c2025-12-09-full-app-english.vercel.app",
};

// Log ra để biết đang chạy môi trường nào
console.log(
  `🚀 Extension Mode: ${IS_DEV_MODE ? "DEV (Local)" : "PROD (Server)"}`
);
