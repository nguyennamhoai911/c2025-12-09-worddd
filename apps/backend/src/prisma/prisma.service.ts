import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [{ emit: 'event', level: 'query' }], // Bắt buộc dòng này để log query
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ DB Connected via Prisma');
    
    // @ts-ignore
    this.$on('query', (e: any) => {
      // 🕒 T3: Thời gian query thực thi
      const t3_db_ms = e.duration;
      
      // Chỉ in ra nếu query chậm hơn 100ms (Bỏ qua các query nhanh)
      if (t3_db_ms > 100) {
        console.log(`🔥 SLOW DB [T3: ${t3_db_ms}ms] Query: ${e.query}`);
      }
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
