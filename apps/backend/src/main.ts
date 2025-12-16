import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface'; // 👈 
// 1. Import interface này
import { LoggingInterceptor } from './logging.interceptor';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // 👇 2. Khai báo kiểu rõ ràng: là HttpsOptions HOẶC undefined (không dùng null)
  let httpsOptions: HttpsOptions | undefined = undefined;
  
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    try {
      const keyPath = path.join(__dirname, '..', 'certificates', 'localhost-key.pem');
      const certPath = path.join(__dirname, '..', 'certificates', 'localhost.pem');

      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        // 👇 3. Lúc này gán object vào biến là hợp lệ
        httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        console.log('🔒 Using Local HTTPS Certificates');
      }
    } catch (error) {
      console.warn('⚠️ Could not load SSL certs, falling back to HTTP');
    }
  }

  // 👇 4. Truyền thẳng biến vào (vì nó đã là undefined nếu là production)
  const app = await NestFactory.create(AppModule, {
    httpsOptions, 
  });
  app.useGlobalInterceptors(new LoggingInterceptor());
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

  const port = process.env.PORT || 5001;
  await app.listen(port);
  
  console.log(`🚀 Backend running on ${isProduction ? 'HTTP (Render managed SSL)' : 'HTTPS'} port ${port}`);
}
bootstrap();