// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 👈 Quan trọng!
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    VocabularyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
