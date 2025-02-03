import { Injectable } from '@nestjs/common';
import { HealthCheckResult } from './interfaces/health.interface';

@Injectable()
export class HealthService {
  async check(): Promise<HealthCheckResult> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
    };
  }
}
