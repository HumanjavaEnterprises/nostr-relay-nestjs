import { Injectable, Logger } from '@nestjs/common';
import { MetricService } from '../metric/metric.service';

export interface RelayMetrics {
  responseTime: number[];      // Array of recent response times in ms
  lastSeen: Date;             // Last successful connection
  eventFreshness: number;     // Average age of events in seconds
  uptime: number;             // Percentage uptime in last 24h
  totalEvents: number;        // Total events received
  failedConnections: number;  // Number of failed connection attempts
}

export interface RelayScore {
  overall: number;            // 0-100 score
  metrics: RelayMetrics;
  lastUpdated: Date;
}

@Injectable()
export class RelayQualityService {
  private readonly logger = new Logger(RelayQualityService.name);
  private relayScores: Map<string, RelayScore> = new Map();
  
  // Thresholds for scoring
  private readonly RESPONSE_TIME_THRESHOLD = 1000;    // ms
  private readonly EVENT_FRESHNESS_THRESHOLD = 3600;  // 1 hour in seconds
  private readonly UPTIME_THRESHOLD = 95;             // 95% uptime required for max score
  private readonly MAX_FAILED_CONNECTIONS = 5;        // Max failures before penalty
  
  constructor(private readonly metricService: MetricService) {
    // Record metrics every minute
    setInterval(() => this.recordMetrics(), 60000);
  }

  /**
   * Update metrics for a relay
   */
  public updateMetrics(relayUrl: string, metrics: Partial<RelayMetrics>): void {
    const currentScore = this.relayScores.get(relayUrl) || this.initializeScore();
    const updatedMetrics = { ...currentScore.metrics, ...metrics };
    
    // Calculate new score
    const score = this.calculateScore(updatedMetrics);
    
    this.relayScores.set(relayUrl, {
      overall: score,
      metrics: updatedMetrics,
      lastUpdated: new Date(),
    });

    this.logger.debug(`Updated score for ${relayUrl}: ${score}`);
  }

  /**
   * Get the current quality score for a relay
   */
  public getRelayScore(relayUrl: string): RelayScore | undefined {
    return this.relayScores.get(relayUrl);
  }

  /**
   * Calculate overall score based on metrics
   */
  private calculateScore(metrics: RelayMetrics): number {
    let score = 100; // Start with perfect score and deduct based on issues
    
    // Response time score (30% weight)
    const avgResponseTime = metrics.responseTime.length > 0 
      ? metrics.responseTime.reduce((a, b) => a + b) / metrics.responseTime.length 
      : this.RESPONSE_TIME_THRESHOLD;
    score -= Math.min(30, (avgResponseTime / this.RESPONSE_TIME_THRESHOLD) * 30);
    
    // Uptime score (30% weight)
    score -= Math.min(30, ((100 - metrics.uptime) / (100 - this.UPTIME_THRESHOLD)) * 30);
    
    // Event freshness score (20% weight)
    const freshnessScore = Math.max(0, 20 - (metrics.eventFreshness / this.EVENT_FRESHNESS_THRESHOLD) * 20);
    score -= (20 - freshnessScore);
    
    // Connection reliability (20% weight)
    const failureScore = Math.min(20, (metrics.failedConnections / this.MAX_FAILED_CONNECTIONS) * 20);
    score -= failureScore;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Initialize a new relay score with default values
   */
  private initializeScore(): RelayScore {
    return {
      overall: 50, // Start at neutral score
      metrics: {
        responseTime: [],
        lastSeen: new Date(),
        eventFreshness: 0,
        uptime: 100,
        totalEvents: 0,
        failedConnections: 0,
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Get all relays sorted by quality score
   */
  public getQualityRanking(): Array<{ url: string; score: RelayScore }> {
    return Array.from(this.relayScores.entries())
      .map(([url, score]) => ({ url, score }))
      .sort((a, b) => b.score.overall - a.score.overall);
  }

  /**
   * Record current relay quality metrics
   */
  private recordMetrics(): void {
    const qualityData = Array.from(this.relayScores.entries()).map(([url, score]) => ({
      url,
      score: {
        overall: score.overall,
        metrics: score.metrics
      }
    }));
    this.metricService.recordRelayQualityMetrics(qualityData);
  }

  /**
   * Check if a relay meets minimum quality standards
   */
  public isRelayQualityAcceptable(relayUrl: string): boolean {
    const score = this.relayScores.get(relayUrl