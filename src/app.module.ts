import { LoggerModule, RequestContextMiddleware } from '@adatechnology/logger';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ConfigModule } from '@config/config.module';
import { HealthModule } from '@modules/health/health.module';

import { MetricsModule } from './modules/metrics/metrics.module';
import { SharedModule } from './modules/shared/shared.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProviderApprovalModule } from './modules/provider-approval/provider-approval.module';
import { RatingModule } from './modules/rating/rating.module';
import { ServiceRequestWorkerModule } from './modules/service-request-worker/service-request.module';
import { EmailModule } from './modules/email/email.module';
import { PushModule } from './modules/push/push.module';

@Module({
  imports: [
    MetricsModule,
    ConfigModule,
    LoggerModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      interceptorExcludedPaths: ['/health', '/metrics'],
    }),
    SharedModule,
    HealthModule,
    NotificationModule,
    ProviderApprovalModule,
    RatingModule,
    ServiceRequestWorkerModule,
    EmailModule,
    PushModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
