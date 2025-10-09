import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

const isString = (v: unknown): v is string => typeof v === 'string';
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: Logger) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'INTERNAL_ERROR';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();


            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const body = exceptionResponse as Record<string, unknown>;
                const maybeMessage = body.message;
                if (isString(maybeMessage)) {
                    message = maybeMessage;
                } else if (
                    Array.isArray(maybeMessage) &&
                    maybeMessage.every(isString)
                ) {
                    message = maybeMessage.join(', ');
                }
                const maybeCode = body.code;
                if (isString(maybeCode)) {
                    code = maybeCode;
                }
            } else if (isString(exceptionResponse)) {
                message = exceptionResponse;
            }
        }

        const errorResponse = {
            success: false,
            error: {
                code,
                message,
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method,
            },
        };

        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${message}`,
            exception instanceof Error ? exception.stack : 'Unknown error',
        );

        response.status(status).json(errorResponse);
    }
}
