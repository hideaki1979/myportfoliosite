import {
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { MetricsService } from 'src/common/metrics/metrics.service';

@Controller('api/metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  getMetrics(@Headers('authorization') authHeader?: string) {
    const expected = process.env.METRICS_ADMIN_TOKEN;
    if (expected) {
      const provided = authHeader?.replace(/^Bearer\s+/i, '').trim();
      if (!provided) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const providedBuf = Buffer.from(provided);
      const expectedBuf = Buffer.from(expected);

      if (
        providedBuf.length !== expectedBuf.length ||
        !timingSafeEqual(providedBuf, expectedBuf)
      ) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
    }

    const snapshot = this.metrics.snapshot();
    return {
      success: true,
      metrics: snapshot,
      timestamp: new Date().toISOString(),
    };
  }
}
