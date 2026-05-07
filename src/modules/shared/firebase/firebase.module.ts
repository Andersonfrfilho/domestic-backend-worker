import { Module } from '@nestjs/common';

import { FirebaseAdminProvider } from './firebase-admin.provider';
import { FIREBASE_PROVIDER } from './firebase.token';

@Module({
  providers: [{ provide: FIREBASE_PROVIDER, useClass: FirebaseAdminProvider }],
  exports: [FIREBASE_PROVIDER],
})
export class FirebaseModule {}
