import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { QueueMetricsService } from './queue-metrics.service';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service'],
    }),
    makeCounterProvider({
      name: 'queue_messages_processed_total',
      help: 'Total number of queue messages processed',
      labelNames: ['queue', 'status', 'service'],
    }),
    makeHistogramProvider({
      name: 'queue_message_processing_duration_seconds',
      help: 'Queue message processing duration in seconds',
      labelNames: ['queue', 'status', 'service'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10, 30],
    }),
    HttpMetricsInterceptor,
    QueueMetricsService,
    {
      provide: APP_INTERCEPTOR,
      useExisting: HttpMetricsInterceptor,
    },
  ],
  exports: [QueueMetricsService],
})
export class MetricsModule {}
