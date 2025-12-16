import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // 1. Đọc chứng chỉ SSL (Do mkcert tạo)
  // Đảm bảo file localhost-key.pem và localhost.pem đang nằm trong folder 'certificates'
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '..', 'certificates', 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'certificates', 'localhost.pem')),
  };

  // 2. Khởi tạo App với HTTPS options
  const app = await NestFactory.create(AppModule, {
    httpsOptions, 
  });

  // Enable CORS (Để Frontend port 3000/3001 và Extension gọi được)
  app.enableCors({
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 3. Lấy Port từ file .env (5001)
  const port = process.env.PORT || 5001;
  await app.listen(port);
  console.log(`🚀 Backend running directly on https://localhost:${port} (Supabase Connected)`);
}
bootstrap();