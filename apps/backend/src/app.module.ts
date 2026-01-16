// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 👈 Quan trọng!
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    VocabularyModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 👇 Đăng ký Performance Interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
