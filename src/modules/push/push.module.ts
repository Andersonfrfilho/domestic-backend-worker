import { Module } from '@nestjs/common';

import { FirebaseModule } from '@modules/shared/firebase/firebase.module';

import { PushConsumer } from './push.consumer';
import { PushHandler } from './push.handler';

@Module({
  imports: [FirebaseModule],
  providers: [PushHandler, PushConsumer],
})
export class PushModule {}
