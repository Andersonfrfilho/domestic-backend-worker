import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class QueueMetricsService {
  constructor(
    @InjectMetric('queue_messages_processed_total') private readonly counter: Counter,
    @InjectMetric('queue_message_processing_duration_seconds') private readonly histogram: Histogram,
  ) {}

  record(queue: string, status: 'success' | 'failed', durationMs: number): void {
    const duration = durationMs / 1000;
    const labels = {
      queue,
      status,
      service: process.env.OTEL_SERVICE_NAME ?? 'domestic-worker',
    };
    this.counter.inc(labels);
    this.histogram.observe(labels, duration);
  }
}
