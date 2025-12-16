// apps/frontend/app/auth/callback/page.tsx
'use client';

import { useEffect, Suspense } from 'react'; // 👈 Import Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// 1. Tạo component con để xử lý logic searchParams
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Lưu token và điều hướng về trang chủ hoặc dashboard
      localStorage.setItem('token', token);
      
      // Gọi hàm login từ context nếu cần để cập nhật state user
      // login(token); 
      
      // Redirect về trang chủ
      router.push('/');
    } else {
      // Nếu không có token, quay về login
      router.push('/login');
    }
  }, [searchParams, router, login]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Đang xử lý đăng nhập...</h2>
        <p>Vui lòng chờ trong giây lát.</p>
      </div>
    </div>
  );
}

// 2. Component chính bọc Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}