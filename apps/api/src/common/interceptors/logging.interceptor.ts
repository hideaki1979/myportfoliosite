import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Logger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor<unknown> {
    constructor(private readonly logger: Logger) { }

    intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
        const startMs = Date.now();
        const req = context.switchToHttp().getRequest<Request>();

        const method: string = req.method;
        const url: string = req.originalUrl ?? req.url;

        return next.handle().pipe(
            tap(() => {
                const durationMs = Date.now() - startMs;
                this.logger.log({ method, url, durationMs }, 'request completed');
            }),
        );
    }
}
