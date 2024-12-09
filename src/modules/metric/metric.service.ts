import { Injectable } from '@nestjs/common';
import { MessageType } from '@nostr-relay/common';
import { Digest } from 'tdigest';

interface RelayQualityData {
  url: string;
  score: {
    overall: number;
    metrics: {
      responseTime: number[];
      uptime: number;
      eventFreshness: number;
      failedConnections: number;
    };
  };
}

interface MetricData {
  timestamp: number;
  maxConcurrentConnectionCount: number;
  connectionCount: number;
  reqProcessingTimes: number[];
  eventProcessingTimes: number[];
  authProcessingTimes: number[];
  closeProcessingTimes: number[];
  relayQuality: {
    url: string;
    score: number;
    responseTime: number;
    uptime: number;
    eventFreshness: number;
    failedConnections: number;
  }[];
}

@Injectable()
export class MetricService {
  private readonly startupTime = new Date().toUTCString();
  private currentConnectionCount = 0;
  private connectionCount = 0;
  private maxConcurrentConnectionCount = 0;
  private reqDigest = new Digest();
  private eventDigest = new Digest();
  private closeDigest = new Digest();
  private authDigest = new Digest();
  private metrics: MetricData[] = [];

  incrementConnectionCount(): void {
    this.currentConnectionCount++;
    this.connectionCount++;
    this.maxConcurrentConnectionCount = Math.max(
      this.maxConcurrentConnectionCount,
      this.currentConnectionCount,
    );
  }

  decrementConnectionCount(): void {
    this.currentConnectionCount--;
  }

  pushProcessingTime(msgType: MessageType, time: number): void {
    switch (msgType) {
      case MessageType.REQ:
        this.reqDigest.push(time);
        break;
      case MessageType.EVENT:
        this.eventDigest.push(time);
        break;
      case MessageType.CLOSE:
        this.closeDigest.push(time);
        break;
      case MessageType.AUTH:
        this.authDigest.push(time);
        break;
    }
  }

  recordMetric(): void {
    this.metrics.push({
      timestamp: Date.now(),
      connectionCount: this.connectionCount,
      maxConcurrentConnectionCount: this.maxConcurrentConnectionCount,
      reqProcessingTimes: this.reqDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((n) => n ?? 0),
      eventProcessingTimes: this.eventDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((n) => n ?? 0),
      authProcessingTimes: this.authDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((n) => n ?? 0),
      closeProcessingTimes: this.closeDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((n) => n ?? 0),
      relayQuality: [],
    });

    // Reset metrics
    this.maxConcurrentConnectionCount = 0;
    this.connectionCount = 0;
    this.reqDigest.reset();
    this.eventDigest.reset();
    this.authDigest.reset();
    this.closeDigest.reset();

    // Keep last 24 hours of metrics
    if (this.metrics.length > 24) {
      this.metrics.shift();
    }
  }

  recordRelayQualityMetrics(qualityData: RelayQualityData[]): void {
    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) {
      // Create a new metric entry if none exists
      this.recordMetric();
    }
    
    const metrics = this.metrics[this.metrics.length - 1];
    metrics.relayQuality = qualityData.map(({ url, score }) => ({
      url,
      score: score.overall,
      responseTime: score.metrics.responseTime.length > 0 
        ? score.metrics.responseTime.reduce((a, b) => a + b) / score.metrics.responseTime.length 
        : 0,
      uptime: score.metrics.uptime,
      eventFreshness: score.metrics.eventFreshness,
      failedConnections: score.metrics.failedConnections
    }));
  }

  getMetrics() {
    return {
      startupTime: this.startupTime,
      currentConnectionCount: this.currentConnectionCount,
      metrics: this.metrics,
    };
  }
}
