import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('METRICS');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    const method = req.method;
    const url = req.url;

    // 🕒 Bắt đầu đo T2
    const start = process.hrtime();

    return next.handle().pipe(
      tap(() => {
        // 🏁 Kết thúc đo T2
        const stop = process.hrtime(start);
        const t2_server_ms = (stop[0] * 1000 + stop[1] / 1e6).toFixed(2); // Chuyển sang mili giây

        // QUAN TRỌNG: Gắn T2 vào Header để Frontend đọc được
        res.header('X-Server-Time', t2_server_ms);

        // Chỉ log nếu chậm quá mức cho phép (Threshold > 300ms) để đỡ rác log
        if (parseFloat(t2_server_ms) > 300) {
           this.logger.warn(`⚠️ SLOW API [${method} ${url}] - Server Time (T2): ${t2_server_ms}ms`);
        }
      }),
    );
  }
}