import { Controller, Get } from '@nestjs/common';
import os from 'os';

@Controller('api/health')
export class HealthController {
  @Get()
  getHealth() {
    const uptimeSec = Math.floor(process.uptime());
    const memory: NodeJS.MemoryUsage = process.memoryUsage();
    const loadAvg = os.loadavg();

    return {
      status: 'ok',
      uptimeSec,
      node: process.version,
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        cpus: os.cpus().length,
        loadAvg1m: loadAvg[0],
        loadAvg5m: loadAvg[1],
        loadAvg15m: loadAvg[2],
      },
      timestamp: new Date().toISOString(),
    };
  }
}
