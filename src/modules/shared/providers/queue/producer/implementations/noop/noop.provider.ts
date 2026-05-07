import { Observable } from 'rxjs';

import type {
  QueueProducerMessageProviderInterface,
  ProducerConfig,
  ProducerHealth,
  BaseMessage,
  SendResult,
  BatchSendResult,
  MessagePriority,
  QoSLevel,
} from '../../producer.interface';

export class NoopMessageProducer implements QueueProducerMessageProviderInterface {
  getId(): string {
    return 'noop-producer';
  }

  getConfig(): ProducerConfig {
    return {};
  }

  async isHealthy(): Promise<ProducerHealth> {
    return {
      isHealthy: true,
      connectionStatus: 'connected',
      pendingMessages: 0,
      uptime: 0,
    };
  }

  async send(): Promise<SendResult> {
    return {
      messageId: 'noop',
      success: true,
      timestamp: new Date(),
    };
  }

  async sendBatch(): Promise<BatchSendResult> {
    return { successful: [], failed: [], totalProcessed: 0, duration: 0 };
  }

  sendWithConfirmation(): Observable<SendResult> {
    return new Observable((subscriber) => {
      subscriber.next({
        messageId: 'noop',
        success: true,
        timestamp: new Date(),
      });
      subscriber.complete();
    });
  }

  async sendWithQoS(): Promise<SendResult> {
    return {
      messageId: 'noop',
      success: true,
      timestamp: new Date(),
    };
  }

  async sendDelayed(): Promise<SendResult> {
    return {
      messageId: 'noop',
      success: true,
      timestamp: new Date(),
    };
  }

  async sendWithTTL(): Promise<SendResult> {
    return {
      messageId: 'noop',
      success: true,
      timestamp: new Date(),
    };
  }

  async getPendingMessages(): Promise<number> {
    return 0;
  }

  async purgeQueue(): Promise<number> {
    return 0;
  }

  getMetrics() {
    return {
      totalSent: 0,
      totalFailed: 0,
      totalBatched: 0,
      averageLatency: 0,
      uptime: 0,
      queues: [],
    };
  }

  async close(): Promise<void> {
    // Noop
  }

  async reconnect(): Promise<void> {
    // Noop
  }

  on(): void {
    // Noop
  }

  off(): void {
    // Noop
  }
}
