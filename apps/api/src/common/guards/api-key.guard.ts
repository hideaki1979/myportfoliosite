import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  API_KEY_ENV_VAR_METADATA,
  type ApiKeyMetadata,
} from '../decorators/api-key-protected.decorator';

const API_KEY_HEADER = 'x-api-key';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.getAllAndOverride<ApiKeyMetadata | string>(
      API_KEY_ENV_VAR_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      throw new InternalServerErrorException(
        'ApiKeyProtected metadata is missing.',
      );
    }

    const { envVar, missingMessage, invalidMessage } =
      typeof metadata === 'string' ? { envVar: metadata } : metadata;

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.configService.get<string>(envVar, '');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (!apiKey) {
      if (nodeEnv === 'production') {
        throw new UnauthorizedException(
          missingMessage ?? `API key is not configured for ${envVar}.`,
        );
      }
      return true;
    }

    const headerValue = request.headers[API_KEY_HEADER];
    const providedKey = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (!providedKey) {
      throw new UnauthorizedException('API key header is missing.');
    }

    if (providedKey !== apiKey) {
      throw new UnauthorizedException(invalidMessage ?? 'Invalid API key.');
    }

    return true;
  }
}
