import { Module } from '@nestjs/common';

import { MetricsModule } from '@modules/metrics/metrics.module';
import { FirebaseModule } from '@modules/shared/firebase/firebase.module';

import { PushConsumer } from './push.consumer';
import { PushHandler } from './push.handler';

@Module({
  imports: [MetricsModule, FirebaseModule],
  providers: [PushHandler, PushConsumer],
})
export class PushModule {}
