'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8">
          Vocabulary Manager
        </h1>
        
        <p className="text-xl text-gray-300 mb-12">
          Quản lý từ vựng và cấu hình Extension của bạn.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
           {/* Card 1: Settings */}
           <Link href="/settings" className="group block p-6 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition">
              <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-300">⚙️ Cài đặt tài khoản &darr;</h2>
              <p className="text-gray-400">Quản lý thông tin cá nhân và cấu hình API Keys cho Extension.</p>
           </Link>

           {/* Card 2: Vocabulary (Placeholder link) */}
           <Link href="/vocabulary" className="group block p-6 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition">
              <h2 className="text-2xl font-semibold mb-2 group-hover:text-green-300">📚 Danh sách từ vựng &rarr;</h2>
              <p className="text-gray-400">Xem và ôn tập các từ vựng đã lưu.</p>
           </Link>
        </div>

        {!user && !isLoading && (
           <div className="mt-12">
              <Link href="/login" className="px-8 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-700 transition">
                Đăng nhập ngay
              </Link>
           </div>
        )}
      </main>
    </div>
  );
}
