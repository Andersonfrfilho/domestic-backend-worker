import { LoggerModule, RequestContextMiddleware } from '@adatechnology/logger';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { register as tsConfigPathsRegister } from 'tsconfig-paths';

import { ConfigModule } from '@config/config.module';
import { HealthModule } from '@modules/health/health.module';

import * as tsConfig from '../tsconfig.json';

import { SharedModule } from './modules/shared/shared.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProviderApprovalModule } from './modules/provider-approval/provider-approval.module';
import { RatingModule } from './modules/rating/rating.module';
import { ServiceRequestWorkerModule } from './modules/service-request-worker/service-request.module';
import { EmailModule } from './modules/email/email.module';
import { PushModule } from './modules/push/push.module';

const compilerOptions = tsConfig.compilerOptions;
tsConfigPathsRegister({
  baseUrl: compilerOptions.baseUrl,
  paths: compilerOptions.paths,
});

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({ level: process.env.LOG_LEVEL || 'info' }),
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
