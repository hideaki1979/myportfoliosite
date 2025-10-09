import { Injectable } from '@nestjs/common';

export interface RequestMetric {
  timestamp: number;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  userAgent?: string;
}

export interface MetricsSnapshot {
  totalRequests: number;
  errorRequests: number;
  avgDurationMs: number;
  p95DurationMs: number;
  lastN: RequestMetric[];
}

@Injectable()
export class MetricsService {
  private readonly ringBuffer: RequestMetric[] = [];
  private readonly maxBufferSize = 1000;
  private totalRequests = 0;
  private errorRequests = 0;
  private totalDurationMs = 0;

  record(metric: RequestMetric): void {
    this.totalRequests += 1;
    this.totalDurationMs += metric.durationMs;
    if (metric.status >= 400) this.errorRequests += 1;

    this.ringBuffer.push(metric);
    if (this.ringBuffer.length > this.maxBufferSize) {
      this.ringBuffer.shift();
    }
  }

  snapshot(): MetricsSnapshot {
    const durations = this.ringBuffer
      .map((m) => m.durationMs)
      .sort((a, b) => a - b);
    const p95Index = Math.max(0, Math.floor(durations.length * 0.95) - 1);
    const p95 = durations.length ? durations[p95Index] : 0;

    const avgDuration = this.totalRequests
      ? Math.round(this.totalDurationMs / this.totalRequests)
      : 0;

    return {
      totalRequests: this.totalRequests,
      errorRequests: this.errorRequests,
      avgDurationMs: avgDuration,
      p95DurationMs: Math.round(p95),
      lastN: [...this.ringBuffer],
    };
  }
}
