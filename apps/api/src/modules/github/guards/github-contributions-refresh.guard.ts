import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const API_KEY_HEADER = 'x-api-key';

@Injectable()
export class GithubContributionsRefreshGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.configService.get<string>(
      'GITHUB_CONTRIBUTIONS_REFRESH_API_KEY',
      '',
    );
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (!apiKey) {
      if (nodeEnv === 'production') {
        throw new UnauthorizedException(
          'GitHub contributions refresh API key is not configured.',
        );
      }
      return true;
    }

    const headerValue = request.headers[API_KEY_HEADER];
    const providedKey = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (!providedKey || providedKey !== apiKey) {
      throw new UnauthorizedException('Invalid API key.');
    }

    return true;
  }
}
