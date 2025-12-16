// apps/backend/src/common/interceptors/performance.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const t2_start = performance.now(); // 🕒 Bắt đầu T2 (Server processing)

    return next.handle().pipe(
      tap((data) => {
        const t2_end = performance.now(); // 🏁 Kết thúc T2
        const t2_duration = (t2_end - t2_start).toFixed(2); // ms

        const response = context.switchToHttp().getResponse();
        
        // 👇 THÊM HEADER: Server processing time
        response.setHeader('x-server-time', t2_duration);
        
        // Log chi tiết (nếu cần debug)
        const request = context.switchToHttp().getRequest();
        console.log(`⏱️ [${request.method} ${request.url}] Server time: ${t2_duration}ms`);
      }),
    );
  }
}
