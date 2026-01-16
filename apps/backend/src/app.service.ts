// apps/backend/src/app.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHealthCheck() {
    // 1. Kiểm tra kết nối Database (Supabase)
    let dbStatus = 'Disconnected ❌';
    let userCount = 0;
    try {
      // Thử query nhẹ đếm số user để xem DB sống không
      userCount = await this.prisma.user.count();
      dbStatus = 'Connected (Supabase PostgreSQL) ✅';
    } catch (error) {
      dbStatus = `Error: ${error.message} ❌`;
    }

    // 2. Kiểm tra môi trường
    const isProduction = process.env.NODE_ENV === 'production';
    const protocol = isProduction ? 'https (Render Managed)' : 'https (Local Certificate)';

    // 3. Kiểm tra các Config quan trọng
    const checks = {
      database_url: process.env.DATABASE_URL ? 'Configured ✅' : 'Missing ❌',
      google_oauth: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'Ready ✅' : 'Missing Keys ⚠️',
      jwt_secret: process.env.JWT_SECRET ? 'Set ✅' : 'Missing (Auth will fail) ❌',
    };

    // 4. Trả về báo cáo chi tiết
    return {
      status: '🚀 Backend is OPERATIONAL',
      timestamp: new Date().toISOString(),
      system: {
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        protocol: protocol,
        platform: isProduction ? 'Render Cloud' : 'Localhost Windows',
      },
      connectivity: {
        database: dbStatus,
        total_users: userCount,
        cors_policy: 'Allow All (Frontend & Extension Compatible) ✅',
      },
      configuration_checks: checks,
      message: 'Sẵn sàng phục vụ Frontend (Next.js) và Extension!',
    };
  }
}
