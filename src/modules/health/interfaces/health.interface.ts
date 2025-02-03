export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
}
