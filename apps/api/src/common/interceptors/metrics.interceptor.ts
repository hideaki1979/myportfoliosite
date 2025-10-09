import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';

@Injectable()
export class MetricsInterceptor implements NestInterceptor<unknown, unknown> {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = performance.now?.() ?? Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const end = performance.now?.() ?? Date.now();
        const durationMs = Math.round(end - start);
        const status: number = res.statusCode;
        const method: string = req.method;
        const url: string = req.url;
        const userAgent: string | undefined = req.headers['user-agent'];

        this.logger.log(
          { method, url, status, durationMs, userAgent },
          'metrics',
        );
      }),
    );
  }
}
