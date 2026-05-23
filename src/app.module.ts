import { HttpModule } from '@adatechnology/http-client';
import { KeycloakAdminModule } from '@adatechnology/keycloak-admin';
import { LoggerModule, RequestContextMiddleware } from '@adatechnology/logger';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ConfigModule } from '@config/config.module';
import { HealthModule } from '@modules/health/health.module';

import { BlockReminderModule } from './modules/block-reminder/block-reminder.module';
import { EmailModule } from './modules/email/email.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProviderApprovalModule } from './modules/provider-approval/provider-approval.module';
import { PushModule } from './modules/push/push.module';
import { RatingModule } from './modules/rating/rating.module';
import { ServiceRequestWorkerModule } from './modules/service-request-worker/service-request.module';
import { SharedModule } from './modules/shared/shared.module';
import { UserVerificationModule } from './modules/user-verification/user-verification.module';

const workerModules = [
  MetricsModule,
  ConfigModule,
  LoggerModule.forRoot({
    level: process.env.LOG_LEVEL || 'info',
    interceptorExcludedPaths: ['/health', '/metrics'],
  }),
  SharedModule,
  HttpModule.forRoot({}),
  HealthModule,
  BlockReminderModule,
  KeycloakAdminModule.forRoot({
    baseUrl: process.env.KEYCLOAK_BASE_URL || 'http://localhost:8081',
    realm: process.env.KEYCLOAK_REALM || 'BACKEND',
    adminUser: process.env.KEYCLOAK_ADMIN_USER || 'admin',
    adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
  }),
];

// Only import RabbitMQ consumer modules if not explicitly disabled
if (process.env.DISABLE_RABBITMQ !== 'true') {
  workerModules.push(
    NotificationModule,
    ProviderApprovalModule,
    RatingModule,
    ServiceRequestWorkerModule,
    EmailModule,
    PushModule,
    UserVerificationModule,
  );
}

@Module({
  imports: workerModules,
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
